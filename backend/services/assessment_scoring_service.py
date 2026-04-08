import json
from typing import Any

from db import get_db_cursor
from schemas.assessment import (
    AssessmentAnswerSubmit,
    AssessmentResultsOut,
    AssessmentSubmitResponse,
)


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    return float(value)


def _to_iso(value: Any) -> str | None:
    if value is None:
        return None
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _score_to_band(score_percent: float | None) -> str | None:
    if score_percent is None:
        return None
    if score_percent < 25:
        return "low"
    if score_percent < 50:
        return "emerging"
    if score_percent < 75:
        return "defined"
    return "advanced"


def _theme_type_for_score(score_percent: float | None) -> str:
    if score_percent is None or score_percent < 50:
        return "low"
    if score_percent < 75:
        return "medium"
    return "high"


def _priority_for_score(score_percent: float | None) -> str:
    if score_percent is None or score_percent < 40:
        return "Now"
    if score_percent < 70:
        return "Next"
    return "Later"


def _recommendation_title(theme_type: str, subdimension_name: str) -> str:
    if theme_type == "low":
        return f"Stabilize {subdimension_name}"
    if theme_type == "medium":
        return f"Standardize {subdimension_name}"
    return f"Scale {subdimension_name}"


def _active_rules(question: dict[str, Any]) -> list[dict[str, Any]]:
    return [rule for rule in question.get("display_rules", []) if rule.get("is_active")]


def _active_options(question: dict[str, Any]) -> list[dict[str, Any]]:
    return [option for option in question.get("options", []) if option.get("is_active")]


def _normalize_weighted_average(
    items: list[Any],
    value_getter: Any,
    weight_getter: Any,
) -> float | None:
    if not items:
        return None

    weights = [max(float(weight_getter(item) or 0), 0) for item in items]
    if sum(weights) <= 0:
        weights = [1.0 for _ in items]

    total_weight = sum(weights)
    return sum(value_getter(item) * weights[index] for index, item in enumerate(items)) / total_weight


def _selected_option_scores(
    question: dict[str, Any],
    answer: AssessmentAnswerSubmit | None,
) -> tuple[float | None, float | None]:
    if answer is None:
        return None, None

    options = _active_options(question)
    options_by_id = {option["id"]: option for option in options}
    strategy = question.get("scoring_strategy")

    if question.get("answer_type") == "single_select":
        if answer.selected_option_id is None:
            return None, None

        option = options_by_id.get(answer.selected_option_id)
        if option is None:
            raise ValueError(f"Invalid option for question {question['id']}")

        max_score = max((_to_float(item.get("score")) or 0 for item in options), default=0)
        return _to_float(option.get("score")), max_score

    if question.get("answer_type") == "multi_select":
        selected_ids = list(dict.fromkeys(answer.selected_option_ids or []))
        if not selected_ids:
            return None, None

        selected_scores: list[float] = []
        for option_id in selected_ids:
            option = options_by_id.get(option_id)
            if option is None:
                raise ValueError(f"Invalid option for question {question['id']}")
            score = _to_float(option.get("score"))
            if score is not None:
                selected_scores.append(score)

        if not selected_scores:
            return None, None

        if strategy == "multi_sum":
            score = sum(selected_scores)
            max_score = sum(max(_to_float(option.get("score")) or 0, 0) for option in options)
        elif strategy == "multi_average":
            score = sum(selected_scores) / len(selected_scores)
            max_score = max((_to_float(option.get("score")) or 0 for option in options), default=0)
        else:
            score = max(selected_scores)
            max_score = max((_to_float(option.get("score")) or 0 for option in options), default=0)

        return score, max_score

    return None, None


def _question_score(
    question: dict[str, Any],
    answers_by_question: dict[int, AssessmentAnswerSubmit],
) -> tuple[float | None, float | None]:
    if not question.get("is_scored"):
        return None, None

    return _selected_option_scores(question, answers_by_question.get(question["id"]))


def _has_answer(question: dict[str, Any], answer: AssessmentAnswerSubmit | None) -> bool:
    if answer is None:
        return False
    if question["answer_type"] == "single_select":
        return answer.selected_option_id is not None
    if question["answer_type"] == "multi_select":
        return len(answer.selected_option_ids) > 0
    return bool((answer.answer_text or "").strip())


def _is_reference_rule_satisfied(
    rule: dict[str, Any],
    questions_by_id: dict[int, dict[str, Any]],
    answers_by_question: dict[int, AssessmentAnswerSubmit],
) -> bool:
    source_question = questions_by_id.get(rule["depends_on_question_id"])
    if source_question is None:
        return False

    answer = answers_by_question.get(rule["depends_on_question_id"])
    score, _ = _selected_option_scores(source_question, answer)

    if rule["operator"] == "equals":
        if answer is None:
            return False
        if rule.get("expected_option_id") is not None:
            return answer.selected_option_id == rule.get("expected_option_id")
        return answer.answer_text == rule.get("expected_value")
    if rule["operator"] == "not_equals":
        if answer is None:
            return False
        if rule.get("expected_option_id") is not None:
            return answer.selected_option_id != rule.get("expected_option_id")
        return answer.answer_text != rule.get("expected_value")
    if rule["operator"] == "in":
        return (
            answer is not None
            and rule.get("expected_option_id") is not None
            and rule.get("expected_option_id") in answer.selected_option_ids
        )
    if rule["operator"] == "not_in":
        return (
            answer is not None
            and rule.get("expected_option_id") is not None
            and rule.get("expected_option_id") not in answer.selected_option_ids
        )

    if score is None:
        return False

    if rule["operator"] == "score_gte":
        return score >= (_to_float(rule.get("min_score")) or 0)
    if rule["operator"] == "score_lte":
        return score <= (_to_float(rule.get("max_score")) or _to_float(rule.get("min_score")) or 0)
    if rule["operator"] == "score_between":
        min_score = _to_float(rule.get("min_score"))
        max_score = _to_float(rule.get("max_score"))
        return score >= (min_score if min_score is not None else float("-inf")) and score <= (
            max_score if max_score is not None else float("inf")
        )

    return True


def _maturity_rule_type(rule: dict[str, Any]) -> str | None:
    group = (rule.get("rule_group") or "").lower()
    if group == "low" or "low_maturity" in group:
        return "low"
    if group == "high" or "high_maturity" in group:
        return "high"
    return None


def _dimension_maturity_score(
    target_question: dict[str, Any],
    questions: list[dict[str, Any]],
    subdimensions_by_id: dict[int, dict[str, Any]],
    answers_by_question: dict[int, AssessmentAnswerSubmit],
) -> float | None:
    target_subdimension = subdimensions_by_id.get(target_question["subdimension_id"])
    if target_subdimension is None:
        return None

    dimension_id = target_subdimension["dimension_id"]
    scores: list[float] = []

    for question in questions:
        question_subdimension = subdimensions_by_id.get(question["subdimension_id"])
        if (
            question["id"] == target_question["id"]
            or not question.get("is_active")
            or not question.get("is_scored")
            or not question.get("is_mandatory")
            or _active_rules(question)
            or question_subdimension is None
            or question_subdimension["dimension_id"] != dimension_id
        ):
            continue

        score, _ = _question_score(question, answers_by_question)
        if score is None:
            return None
        scores.append(score)

    if not scores:
        return None
    return sum(scores) / len(scores)


def _is_question_visible(
    question: dict[str, Any],
    questions: list[dict[str, Any]],
    questions_by_id: dict[int, dict[str, Any]],
    subdimensions_by_id: dict[int, dict[str, Any]],
    answers_by_question: dict[int, AssessmentAnswerSubmit],
) -> bool:
    rules = _active_rules(question)
    if not rules:
        return True

    for rule in rules:
        maturity_rule_type = _maturity_rule_type(rule)
        if maturity_rule_type:
            dimension_score = _dimension_maturity_score(
                question,
                questions,
                subdimensions_by_id,
                answers_by_question,
            )
            if dimension_score is None:
                return False
            if maturity_rule_type == "low":
                if dimension_score > (_to_float(rule.get("max_score")) or 1):
                    return False
            elif dimension_score < (_to_float(rule.get("min_score")) or 3):
                return False
        elif not _is_reference_rule_satisfied(rule, questions_by_id, answers_by_question):
            return False

    return True


def _load_assessment_framework(cursor: Any, sector_id: int) -> dict[str, Any]:
    cursor.execute(
        """
        SELECT id, name, code, description, weight, display_order, is_active
        FROM dimensions
        WHERE is_active = 1
        ORDER BY display_order ASC, id ASC
        """
    )
    dimensions = cursor.fetchall()

    cursor.execute(
        """
        SELECT id, dimension_id, name, code, description, weight, display_order, is_active
        FROM subdimensions
        WHERE is_active = 1
        ORDER BY dimension_id ASC, display_order ASC, id ASC
        """
    )
    subdimensions = cursor.fetchall()

    cursor.execute(
        """
        SELECT
            id,
            sector_id,
            subdimension_id,
            question_text,
            helper_text,
            answer_type,
            is_mandatory,
            is_scored,
            scoring_strategy,
            weight,
            display_order,
            is_active
        FROM questions
        WHERE sector_id = %s AND is_active = 1
        ORDER BY subdimension_id ASC, display_order ASC, id ASC
        """,
        (sector_id,),
    )
    questions = cursor.fetchall()

    if not questions:
        return {
            "dimensions": dimensions,
            "subdimensions": subdimensions,
            "questions": [],
        }

    question_ids = [question["id"] for question in questions]
    placeholders = ",".join(["%s"] * len(question_ids))

    cursor.execute(
        f"""
        SELECT
            id,
            question_id,
            option_label,
            option_value,
            score,
            maturity_level,
            display_order,
            is_active
        FROM question_answer_options
        WHERE question_id IN ({placeholders}) AND is_active = 1
        ORDER BY question_id ASC, display_order ASC, id ASC
        """,
        tuple(question_ids),
    )
    options = cursor.fetchall()

    cursor.execute(
        f"""
        SELECT
            id,
            question_id,
            depends_on_question_id,
            operator,
            expected_option_id,
            expected_value,
            min_score,
            max_score,
            rule_group,
            is_active
        FROM question_display_rules
        WHERE question_id IN ({placeholders}) AND is_active = 1
        ORDER BY question_id ASC, id ASC
        """,
        tuple(question_ids),
    )
    rules = cursor.fetchall()

    options_by_question: dict[int, list[dict[str, Any]]] = {}
    for option in options:
        option["is_active"] = bool(option["is_active"])
        option["score"] = _to_float(option.get("score"))
        options_by_question.setdefault(option["question_id"], []).append(option)

    rules_by_question: dict[int, list[dict[str, Any]]] = {}
    for rule in rules:
        rule["is_active"] = bool(rule["is_active"])
        rule["min_score"] = _to_float(rule.get("min_score"))
        rule["max_score"] = _to_float(rule.get("max_score"))
        rules_by_question.setdefault(rule["question_id"], []).append(rule)

    for question in questions:
        question["is_active"] = bool(question["is_active"])
        question["is_mandatory"] = bool(question["is_mandatory"])
        question["is_scored"] = bool(question["is_scored"])
        question["weight"] = _to_float(question.get("weight"))
        question["options"] = options_by_question.get(question["id"], [])
        question["display_rules"] = rules_by_question.get(question["id"], [])

    for dimension in dimensions:
        dimension["is_active"] = bool(dimension["is_active"])
        dimension["weight"] = _to_float(dimension.get("weight"))

    for subdimension in subdimensions:
        subdimension["is_active"] = bool(subdimension["is_active"])
        subdimension["weight"] = _to_float(subdimension.get("weight"))

    return {
        "dimensions": dimensions,
        "subdimensions": subdimensions,
        "questions": questions,
    }


def _persist_answer(
    cursor: Any,
    assessment_id: int,
    question: dict[str, Any],
    answer: AssessmentAnswerSubmit,
    numeric_score: float | None,
) -> None:
    selected_option_id = answer.selected_option_id if question["answer_type"] == "single_select" else None
    cursor.execute(
        """
        INSERT INTO assessment_answers (
            assessment_id,
            question_id,
            selected_option_id,
            answer_text,
            numeric_score,
            confidence_score
        )
        VALUES (%s, %s, %s, %s, %s, NULL)
        """,
        (
            assessment_id,
            question["id"],
            selected_option_id,
            answer.answer_text,
            numeric_score,
        ),
    )
    assessment_answer_id = cursor.lastrowid

    if question["answer_type"] == "multi_select":
        for option_id in dict.fromkeys(answer.selected_option_ids):
            cursor.execute(
                """
                INSERT INTO assessment_answer_selected_options (
                    assessment_answer_id,
                    question_option_id
                )
                VALUES (%s, %s)
                """,
                (assessment_answer_id, option_id),
            )


def _load_recommendation_themes(
    cursor: Any,
    sector_id: int,
    subdimension_ids: list[int],
) -> dict[int, dict[str, Any]]:
    if not subdimension_ids:
        return {}

    placeholders = ",".join(["%s"] * len(subdimension_ids))
    cursor.execute(
        f"""
        SELECT
            subdimension_id,
            low_maturity_theme,
            medium_maturity_theme,
            high_maturity_theme
        FROM recommendation_themes
        WHERE sector_id = %s
          AND subdimension_id IN ({placeholders})
          AND is_active = 1
        """,
        (sector_id, *subdimension_ids),
    )

    return {row["subdimension_id"]: row for row in cursor.fetchall()}


def _fallback_recommendation_text(
    theme_type: str,
    sector_name: str | None,
    subdimension_name: str,
) -> str:
    sector_label = sector_name or "the selected sector"
    if theme_type == "low":
        return (
            f"Prioritize {subdimension_name} for {sector_label}: define ownership, "
            "capture minimum evidence, and resolve the most visible customer pain points first."
        )
    if theme_type == "medium":
        return (
            f"Standardize {subdimension_name} for {sector_label}: align the process "
            "across teams, connect it to scorecards, and make the improvement cadence repeatable."
        )
    return (
        f"Scale {subdimension_name} for {sector_label}: codify the strongest practices, "
        "benchmark performance, and turn the capability into a differentiating CX strength."
    )


def _persist_recommendations(
    cursor: Any,
    assessment_id: int,
    sector_id: int,
    sector_name: str | None,
    subdimension_results: list[dict[str, Any]],
    subdimensions_by_id: dict[int, dict[str, Any]],
) -> list[dict[str, Any]]:
    cursor.execute(
        "DELETE FROM assessment_recommendations WHERE assessment_id = %s",
        (assessment_id,),
    )

    themes_by_subdimension = _load_recommendation_themes(
        cursor,
        sector_id,
        [result["subdimension_id"] for result in subdimension_results],
    )

    generated: list[dict[str, Any]] = []
    for result in subdimension_results:
        subdimension = subdimensions_by_id.get(result["subdimension_id"])
        if subdimension is None:
            continue

        theme_type = _theme_type_for_score(result["normalized_score_percent"])
        theme = themes_by_subdimension.get(result["subdimension_id"])
        theme_column = f"{theme_type}_maturity_theme"
        recommendation_text = (
            theme.get(theme_column)
            if theme and theme.get(theme_column)
            else _fallback_recommendation_text(
                theme_type,
                sector_name,
                subdimension["name"],
            )
        )
        priority_level = _priority_for_score(result["normalized_score_percent"])
        title = _recommendation_title(theme_type, subdimension["name"])

        cursor.execute(
            """
            INSERT INTO assessment_recommendations (
                assessment_id,
                subdimension_id,
                recommendation_type,
                recommendation_title,
                recommendation_text,
                priority_level,
                source_theme_type
            )
            VALUES (%s, %s, 'maturity_theme', %s, %s, %s, %s)
            """,
            (
                assessment_id,
                result["subdimension_id"],
                title,
                recommendation_text,
                priority_level,
                theme_type,
            ),
        )

        generated.append(
            {
                "recommendation_id": cursor.lastrowid,
                "subdimension_id": result["subdimension_id"],
                "recommendation_type": "maturity_theme",
                "recommendation_title": title,
                "recommendation_text": recommendation_text,
                "priority_level": priority_level,
                "source_theme_type": theme_type,
            }
        )

    return generated


def submit_assessment_answers(
    assessment_id: int,
    answers: list[AssessmentAnswerSubmit],
) -> AssessmentSubmitResponse:
    answers_by_question = {answer.question_id: answer for answer in answers}

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(
            """
            SELECT a.id, a.sector_id, s.name AS sector_name
            FROM assessments a
            LEFT JOIN sectors s ON s.id = a.sector_id
            WHERE a.id = %s
            LIMIT 1
            """,
            (assessment_id,),
        )
        assessment = cursor.fetchone()
        if assessment is None:
            raise ValueError("Assessment not found")
        if assessment.get("sector_id") is None:
            raise ValueError("Assessment does not have a sector")

        framework = _load_assessment_framework(cursor, int(assessment["sector_id"]))
        dimensions = framework["dimensions"]
        subdimensions = framework["subdimensions"]
        questions = framework["questions"]

        questions_by_id = {question["id"]: question for question in questions}
        subdimensions_by_id = {
            subdimension["id"]: subdimension for subdimension in subdimensions
        }

        unknown_question_ids = set(answers_by_question) - set(questions_by_id)
        if unknown_question_ids:
            raise ValueError("Submitted answers include questions outside this assessment sector")

        visible_questions = [
            question
            for question in questions
            if _is_question_visible(
                question,
                questions,
                questions_by_id,
                subdimensions_by_id,
                answers_by_question,
            )
        ]

        missing_mandatory_question_ids = [
            question["id"]
            for question in visible_questions
            if question.get("is_mandatory")
            and not _has_answer(question, answers_by_question.get(question["id"]))
        ]
        if missing_mandatory_question_ids:
            raise ValueError("Please answer all mandatory visible questions before submitting")

        question_scores: dict[int, dict[str, float]] = {}
        for question in visible_questions:
            raw_score, max_score = _question_score(question, answers_by_question)
            if raw_score is None or max_score is None or max_score <= 0:
                continue

            question_scores[question["id"]] = {
                "raw_score": raw_score,
                "normalized_score_percent": min(max((raw_score / max_score) * 100, 0), 100),
                "max_score": max_score,
                "weight": question.get("weight") or 0,
            }

        cursor.execute(
            """
            DELETE aaso
            FROM assessment_answer_selected_options aaso
            JOIN assessment_answers aa ON aa.id = aaso.assessment_answer_id
            WHERE aa.assessment_id = %s
            """,
            (assessment_id,),
        )
        cursor.execute("DELETE FROM assessment_answers WHERE assessment_id = %s", (assessment_id,))
        cursor.execute(
            "DELETE FROM assessment_subdimension_scores WHERE assessment_id = %s",
            (assessment_id,),
        )
        cursor.execute(
            "DELETE FROM assessment_dimension_scores WHERE assessment_id = %s",
            (assessment_id,),
        )

        for question in visible_questions:
            answer = answers_by_question.get(question["id"])
            if answer is None:
                continue
            numeric_score = question_scores.get(question["id"], {}).get("raw_score")
            _persist_answer(cursor, assessment_id, question, answer, numeric_score)

        subdimension_results: list[dict[str, Any]] = []
        for subdimension in subdimensions:
            scored_questions = [
                question
                for question in visible_questions
                if question["subdimension_id"] == subdimension["id"]
                and question["id"] in question_scores
            ]

            if not scored_questions:
                continue

            normalized_score = _normalize_weighted_average(
                scored_questions,
                lambda question: question_scores[question["id"]]["normalized_score_percent"],
                lambda question: question_scores[question["id"]]["weight"],
            )
            raw_score = _normalize_weighted_average(
                scored_questions,
                lambda question: question_scores[question["id"]]["raw_score"],
                lambda question: question_scores[question["id"]]["weight"],
            )

            if normalized_score is None:
                continue

            subdimension_results.append(
                {
                    "subdimension_id": subdimension["id"],
                    "dimension_id": subdimension["dimension_id"],
                    "raw_score": raw_score,
                    "normalized_score_percent": normalized_score,
                    "weighted_score_contribution": 0.0,
                    "maturity_band": _score_to_band(normalized_score),
                    "weight": subdimension.get("weight") or 0,
                    "calculation_details": {
                        "method": "weighted_average_of_visible_scored_questions",
                        "question_count": len(scored_questions),
                        "visible_question_count": len(
                            [
                                question
                                for question in visible_questions
                                if question["subdimension_id"] == subdimension["id"]
                            ]
                        ),
                    },
                }
            )

        dimension_results: list[dict[str, Any]] = []
        for dimension in dimensions:
            dimension_subdimension_results = [
                result
                for result in subdimension_results
                if result["dimension_id"] == dimension["id"]
            ]
            if not dimension_subdimension_results:
                continue

            score_percent = _normalize_weighted_average(
                dimension_subdimension_results,
                lambda item: item["normalized_score_percent"],
                lambda item: item["weight"],
            )
            if score_percent is None:
                continue

            subdimension_weights = [
                max(float(item.get("weight") or 0), 0)
                for item in dimension_subdimension_results
            ]
            if sum(subdimension_weights) <= 0:
                subdimension_weights = [1.0 for _ in dimension_subdimension_results]

            weighted_subdimension_total = sum(subdimension_weights)
            for index, item in enumerate(dimension_subdimension_results):
                normalized_weight = subdimension_weights[index] / weighted_subdimension_total
                item["weighted_score_contribution"] = (
                    item["normalized_score_percent"] * normalized_weight
                )

            dimension_results.append(
                {
                    "dimension_id": dimension["id"],
                    "score_percent": score_percent,
                    "weight": dimension.get("weight") or 0,
                    "calculation_details": {
                        "method": "weighted_average_of_subdimension_scores",
                        "subdimension_count": len(dimension_subdimension_results),
                    },
                }
            )

        overall_score = _normalize_weighted_average(
            dimension_results,
            lambda item: item["score_percent"],
            lambda item: item["weight"],
        )
        maturity_level = _score_to_band(overall_score)

        for result in subdimension_results:
            cursor.execute(
                """
                INSERT INTO assessment_subdimension_scores (
                    assessment_id,
                    subdimension_id,
                    raw_score,
                    normalized_score_percent,
                    weighted_score_contribution,
                    maturity_band,
                    calculation_details
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    assessment_id,
                    result["subdimension_id"],
                    result["raw_score"],
                    result["normalized_score_percent"],
                    result["weighted_score_contribution"],
                    result["maturity_band"],
                    json.dumps(result["calculation_details"]),
                ),
            )

        for result in dimension_results:
            cursor.execute(
                """
                INSERT INTO assessment_dimension_scores (
                    assessment_id,
                    dimension_id,
                    score_percent,
                    calculation_details
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    assessment_id,
                    result["dimension_id"],
                    result["score_percent"],
                    json.dumps(result["calculation_details"]),
                ),
            )

        recommendations = _persist_recommendations(
            cursor,
            assessment_id,
            int(assessment["sector_id"]),
            assessment.get("sector_name") or "the selected sector",
            subdimension_results,
            subdimensions_by_id,
        )

        cursor.execute(
            """
            UPDATE assessments
            SET status = 'completed',
                overall_score = %s,
                maturity_level = %s,
                completed_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (overall_score, maturity_level, assessment_id),
        )

    return AssessmentSubmitResponse(
        assessment_id=assessment_id,
        overall_score=overall_score,
        maturity_level=maturity_level,
        dimension_scores=[
            {
                "dimension_id": result["dimension_id"],
                "score_percent": result["score_percent"],
            }
            for result in dimension_results
        ],
        subdimension_scores=[
            {
                "subdimension_id": result["subdimension_id"],
                "raw_score": result["raw_score"],
                "normalized_score_percent": result["normalized_score_percent"],
                "weighted_score_contribution": result["weighted_score_contribution"],
                "maturity_band": result["maturity_band"],
            }
            for result in subdimension_results
        ],
        recommendations=recommendations,
    )


def get_assessment_results(assessment_id: int) -> AssessmentResultsOut:
    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(
            """
            SELECT
                a.id,
                a.company_name,
                a.respondent_name,
                a.respondent_email,
                a.respondent_role_title,
                a.sector_id,
                a.status,
                a.overall_score,
                a.maturity_level,
                s.name AS sector_name
            FROM assessments a
            LEFT JOIN sectors s ON s.id = a.sector_id
            WHERE a.id = %s
            LIMIT 1
            """,
            (assessment_id,),
        )
        assessment = cursor.fetchone()
        if assessment is None:
            raise ValueError("Assessment not found")

        cursor.execute(
            """
            SELECT
                d.id AS dimension_id,
                d.code,
                d.name,
                d.weight,
                d.display_order,
                ads.score_percent,
                ads.calculation_details
            FROM dimensions d
            LEFT JOIN assessment_dimension_scores ads
                ON ads.dimension_id = d.id
                AND ads.assessment_id = %s
            WHERE d.is_active = 1
            ORDER BY d.display_order ASC, d.id ASC
            """,
            (assessment_id,),
        )
        dimension_rows = cursor.fetchall()

        cursor.execute(
            """
            SELECT
                sd.id AS subdimension_id,
                sd.dimension_id,
                sd.code,
                sd.name,
                sd.weight,
                sd.display_order,
                ass.raw_score,
                ass.normalized_score_percent,
                ass.weighted_score_contribution,
                ass.maturity_band,
                ass.calculation_details
            FROM subdimensions sd
            LEFT JOIN assessment_subdimension_scores ass
                ON ass.subdimension_id = sd.id
                AND ass.assessment_id = %s
            WHERE sd.is_active = 1
            ORDER BY sd.dimension_id ASC, sd.display_order ASC, sd.id ASC
            """,
            (assessment_id,),
        )
        subdimension_rows = cursor.fetchall()

        cursor.execute(
            """
            SELECT
                aa.id AS assessment_answer_id,
                aa.question_id,
                aa.selected_option_id,
                aa.answer_text,
                aa.numeric_score,
                aa.confidence_score,
                aa.answered_at,
                q.subdimension_id,
                q.question_text,
                q.answer_type,
                q.is_mandatory,
                q.is_scored,
                q.scoring_strategy,
                q.display_order,
                qo.option_label AS selected_option_label,
                qo.option_value AS selected_option_value
            FROM assessment_answers aa
            JOIN questions q ON q.id = aa.question_id
            LEFT JOIN question_answer_options qo ON qo.id = aa.selected_option_id
            WHERE aa.assessment_id = %s
            ORDER BY q.subdimension_id ASC, q.display_order ASC, q.id ASC
            """,
            (assessment_id,),
        )
        answer_rows = cursor.fetchall()

        answer_ids = [row["assessment_answer_id"] for row in answer_rows]
        selected_options_by_answer: dict[int, list[dict[str, Any]]] = {}
        if answer_ids:
            placeholders = ",".join(["%s"] * len(answer_ids))
            cursor.execute(
                f"""
                SELECT
                    aaso.assessment_answer_id,
                    qo.id AS option_id,
                    qo.option_label,
                    qo.option_value,
                    qo.score
                FROM assessment_answer_selected_options aaso
                JOIN question_answer_options qo ON qo.id = aaso.question_option_id
                WHERE aaso.assessment_answer_id IN ({placeholders})
                ORDER BY aaso.assessment_answer_id ASC, qo.display_order ASC, qo.id ASC
                """,
                tuple(answer_ids),
            )
            for option in cursor.fetchall():
                selected_options_by_answer.setdefault(
                    option["assessment_answer_id"], []
                ).append(
                    {
                        "option_id": option["option_id"],
                        "option_label": option["option_label"],
                        "option_value": option["option_value"],
                        "score": _to_float(option.get("score")),
                    }
                )

        cursor.execute(
            """
            SELECT
                id AS recommendation_id,
                subdimension_id,
                recommendation_type,
                recommendation_title,
                recommendation_text,
                priority_level,
                source_theme_type
            FROM assessment_recommendations
            WHERE assessment_id = %s
            ORDER BY id ASC
            """,
            (assessment_id,),
        )
        recommendation_rows = cursor.fetchall()

    priority_order = {"Now": 1, "Next": 2, "Later": 3}
    recommendations = sorted(
        [
            {
                "recommendation_id": row["recommendation_id"],
                "subdimension_id": row["subdimension_id"],
                "recommendation_type": row["recommendation_type"],
                "recommendation_title": row["recommendation_title"],
                "recommendation_text": row["recommendation_text"],
                "priority_level": row["priority_level"],
                "source_theme_type": row["source_theme_type"],
            }
            for row in recommendation_rows
        ],
        key=lambda item: (
            priority_order.get(item["priority_level"], 99),
            item["subdimension_id"],
            item["recommendation_id"] or 0,
        ),
    )
    recommendations_by_subdimension: dict[int, list[dict[str, Any]]] = {}
    for recommendation in recommendations:
        recommendations_by_subdimension.setdefault(
            recommendation["subdimension_id"],
            [],
        ).append(recommendation)

    answers_by_subdimension: dict[int, list[dict[str, Any]]] = {}
    for row in answer_rows:
        answer = {
            "assessment_answer_id": row["assessment_answer_id"],
            "question_id": row["question_id"],
            "question_text": row["question_text"],
            "answer_type": row["answer_type"],
            "is_mandatory": bool(row["is_mandatory"]),
            "is_scored": bool(row["is_scored"]),
            "scoring_strategy": row["scoring_strategy"],
            "selected_option_id": row["selected_option_id"],
            "selected_option_label": row["selected_option_label"],
            "selected_option_value": row["selected_option_value"],
            "selected_options": selected_options_by_answer.get(
                row["assessment_answer_id"], []
            ),
            "answer_text": row["answer_text"],
            "numeric_score": _to_float(row.get("numeric_score")),
            "confidence_score": _to_float(row.get("confidence_score")),
            "answered_at": _to_iso(row.get("answered_at")),
        }
        answers_by_subdimension.setdefault(row["subdimension_id"], []).append(answer)

    subdimensions_by_dimension: dict[int, list[dict[str, Any]]] = {}
    for row in subdimension_rows:
        subdimensions_by_dimension.setdefault(row["dimension_id"], []).append(
            {
                "subdimension_id": row["subdimension_id"],
                "code": row["code"],
                "name": row["name"],
                "weight": float(row["weight"]),
                "raw_score": _to_float(row.get("raw_score")),
                "normalized_score_percent": _to_float(
                    row.get("normalized_score_percent")
                ),
                "weighted_score_contribution": _to_float(
                    row.get("weighted_score_contribution")
                ),
                "maturity_band": row["maturity_band"],
                "calculation_details": row["calculation_details"],
                "answers": answers_by_subdimension.get(row["subdimension_id"], []),
                "recommendations": recommendations_by_subdimension.get(
                    row["subdimension_id"],
                    [],
                ),
            }
        )

    dimension_names_by_id = {
        row["dimension_id"]: row["name"] for row in dimension_rows
    }
    scored_highlights = [
        {
            "dimension_id": row["dimension_id"],
            "dimension_name": dimension_names_by_id.get(
                row["dimension_id"],
                "Dimension",
            ),
            "subdimension_id": row["subdimension_id"],
            "subdimension_name": row["name"],
            "score_percent": _to_float(row.get("normalized_score_percent")),
            "maturity_band": row["maturity_band"],
        }
        for row in subdimension_rows
        if _to_float(row.get("normalized_score_percent")) is not None
    ]
    strengths = sorted(
        scored_highlights,
        key=lambda item: item["score_percent"] or 0,
        reverse=True,
    )[:3]
    pain_points = sorted(
        scored_highlights,
        key=lambda item: item["score_percent"] or 0,
    )[:3]

    dimensions = [
        {
            "dimension_id": row["dimension_id"],
            "code": row["code"],
            "name": row["name"],
            "weight": float(row["weight"]),
            "score_percent": _to_float(row.get("score_percent")),
            "calculation_details": row["calculation_details"],
            "subdimensions": subdimensions_by_dimension.get(row["dimension_id"], []),
        }
        for row in dimension_rows
    ]

    return AssessmentResultsOut(
        assessment_id=assessment["id"],
        company_name=assessment["company_name"],
        respondent_name=assessment["respondent_name"],
        respondent_email=assessment["respondent_email"],
        respondent_role_title=assessment["respondent_role_title"],
        sector_id=assessment["sector_id"],
        sector_name=assessment["sector_name"],
        status=assessment["status"],
        overall_score=_to_float(assessment.get("overall_score")),
        maturity_level=assessment["maturity_level"],
        dimensions=dimensions,
        recommendations=recommendations,
        strengths=strengths,
        pain_points=pain_points,
    )
