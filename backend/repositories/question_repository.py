from typing import Any
from db import get_db_cursor
from schemas.question import QuestionCreate, QuestionUpdate


def _normalize_question_row(row: dict[str, Any]) -> dict[str, Any]:
    row["is_mandatory"] = bool(row["is_mandatory"])
    row["is_scored"] = bool(row["is_scored"])
    row["is_active"] = bool(row["is_active"])
    if row.get("weight") is not None:
        row["weight"] = float(row["weight"])
    return row


def _normalize_option_row(row: dict[str, Any]) -> dict[str, Any]:
    row["is_active"] = bool(row["is_active"])
    if row.get("score") is not None:
        row["score"] = float(row["score"])
    return row


def _normalize_rule_row(row: dict[str, Any]) -> dict[str, Any]:
    row["is_active"] = bool(row["is_active"])
    if row.get("min_score") is not None:
        row["min_score"] = float(row["min_score"])
    if row.get("max_score") is not None:
        row["max_score"] = float(row["max_score"])
    return row


def _insert_options(cursor: Any, question_id: int, payload: QuestionCreate | QuestionUpdate) -> None:
    query = """
        INSERT INTO question_answer_options (
            question_id,
            option_label,
            option_value,
            score,
            maturity_level,
            display_order,
            is_active
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    for option in payload.options:
        cursor.execute(
            query,
            (
                question_id,
                option.option_label,
                option.option_value,
                option.score,
                option.maturity_level,
                option.display_order,
                option.is_active,
            ),
        )


def _insert_display_rules(
    cursor: Any, question_id: int, payload: QuestionCreate | QuestionUpdate
) -> None:
    query = """
        INSERT INTO question_display_rules (
            question_id,
            depends_on_question_id,
            operator,
            expected_option_id,
            expected_value,
            min_score,
            max_score,
            rule_group,
            is_active
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    for rule in payload.display_rules:
        cursor.execute(
            query,
            (
                question_id,
                rule.depends_on_question_id,
                rule.operator,
                rule.expected_option_id,
                rule.expected_value,
                rule.min_score,
                rule.max_score,
                rule.rule_group,
                rule.is_active,
            ),
        )


def create_question(payload: QuestionCreate) -> int:
    query = """
        INSERT INTO questions (
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
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(
            query,
            (
                payload.sector_id,
                payload.subdimension_id,
                payload.question_text,
                payload.helper_text,
                payload.answer_type,
                payload.is_mandatory,
                payload.is_scored,
                payload.scoring_strategy,
                payload.weight,
                payload.display_order,
                payload.is_active,
            ),
        )
        question_id = int(cursor.lastrowid)
        _insert_options(cursor, question_id, payload)
        _insert_display_rules(cursor, question_id, payload)
        return question_id


def get_all_questions(
    sector_id: int | None = None,
    subdimension_id: int | None = None,
) -> list[dict[str, Any]]:
    query = """
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
    """
    params: list[Any] = []
    filters: list[str] = []

    if sector_id is not None:
        filters.append("sector_id = %s")
        params.append(sector_id)
    if subdimension_id is not None:
        filters.append("subdimension_id = %s")
        params.append(subdimension_id)
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " ORDER BY sector_id ASC, subdimension_id ASC, display_order ASC, id ASC"

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, tuple(params))
        questions = [_normalize_question_row(row) for row in cursor.fetchall()]

    return _attach_children(questions)


def get_question_by_id(question_id: int) -> dict[str, Any] | None:
    query = """
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
        WHERE id = %s
        LIMIT 1
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(query, (question_id,))
        row = cursor.fetchone()

    if not row:
        return None

    return _attach_children([_normalize_question_row(row)])[0]


def update_question(question_id: int, payload: QuestionUpdate) -> bool:
    query = """
        UPDATE questions
        SET
            sector_id = %s,
            subdimension_id = %s,
            question_text = %s,
            helper_text = %s,
            answer_type = %s,
            is_mandatory = %s,
            is_scored = %s,
            scoring_strategy = %s,
            weight = %s,
            display_order = %s,
            is_active = %s
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(
            query,
            (
                payload.sector_id,
                payload.subdimension_id,
                payload.question_text,
                payload.helper_text,
                payload.answer_type,
                payload.is_mandatory,
                payload.is_scored,
                payload.scoring_strategy,
                payload.weight,
                payload.display_order,
                payload.is_active,
                question_id,
            ),
        )
        updated = cursor.rowcount > 0
        if not updated:
            cursor.execute("SELECT id FROM questions WHERE id = %s LIMIT 1", (question_id,))
            if cursor.fetchone() is None:
                return False

        cursor.execute("DELETE FROM question_display_rules WHERE question_id = %s", (question_id,))
        cursor.execute("DELETE FROM question_answer_options WHERE question_id = %s", (question_id,))
        _insert_options(cursor, question_id, payload)
        _insert_display_rules(cursor, question_id, payload)
        return True


def delete_question(question_id: int) -> bool:
    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute("DELETE FROM question_display_rules WHERE question_id = %s", (question_id,))
        cursor.execute("DELETE FROM question_answer_options WHERE question_id = %s", (question_id,))
        cursor.execute("DELETE FROM questions WHERE id = %s", (question_id,))
        return cursor.rowcount > 0


def toggle_question_status(question_id: int) -> bool:
    query = """
        UPDATE questions
        SET is_active = NOT is_active
        WHERE id = %s
    """

    with get_db_cursor(dictionary=False) as (_, cursor):
        cursor.execute(query, (question_id,))
        return cursor.rowcount > 0


def _attach_children(questions: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not questions:
        return questions

    question_ids = [question["id"] for question in questions]
    placeholders = ",".join(["%s"] * len(question_ids))

    options_query = f"""
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
        WHERE question_id IN ({placeholders})
        ORDER BY question_id ASC, display_order ASC, id ASC
    """
    rules_query = f"""
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
        WHERE question_id IN ({placeholders})
        ORDER BY question_id ASC, id ASC
    """

    with get_db_cursor(dictionary=True) as (_, cursor):
        cursor.execute(options_query, tuple(question_ids))
        options = [_normalize_option_row(row) for row in cursor.fetchall()]
        cursor.execute(rules_query, tuple(question_ids))
        rules = [_normalize_rule_row(row) for row in cursor.fetchall()]

    options_by_question: dict[int, list[dict[str, Any]]] = {}
    for option in options:
        options_by_question.setdefault(option["question_id"], []).append(option)

    rules_by_question: dict[int, list[dict[str, Any]]] = {}
    for rule in rules:
        rules_by_question.setdefault(rule["question_id"], []).append(rule)

    for question in questions:
        question["options"] = options_by_question.get(question["id"], [])
        question["display_rules"] = rules_by_question.get(question["id"], [])

    return questions
