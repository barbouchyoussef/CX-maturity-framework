from fastapi import HTTPException
from schemas.question import QuestionCreate, QuestionUpdate


ANSWER_TYPES = {"single_select", "multi_select", "text_area"}
SCORING_STRATEGIES = {
    "none",
    "single_option_score",
    "multi_sum",
    "multi_average",
    "multi_max",
    "manual",
}
DISPLAY_RULE_OPERATORS = {
    "equals",
    "not_equals",
    "in",
    "not_in",
    "score_gte",
    "score_lte",
    "score_between",
}
MIN_OPTION_SCORE = 0
MAX_OPTION_SCORE = 4


def validate_question_payload(payload: QuestionCreate | QuestionUpdate) -> None:
    if payload.answer_type not in ANSWER_TYPES:
        raise HTTPException(status_code=422, detail="Invalid answer type")

    if payload.scoring_strategy not in SCORING_STRATEGIES:
        raise HTTPException(status_code=422, detail="Invalid scoring strategy")

    if payload.answer_type == "text_area" and payload.options:
        raise HTTPException(
            status_code=422,
            detail="Text area questions cannot have answer options",
        )

    if not payload.is_scored and payload.scoring_strategy != "none":
        raise HTTPException(
            status_code=422,
            detail="Unscored questions must use scoring_strategy='none'",
        )

    if payload.is_scored and not payload.is_mandatory:
        raise HTTPException(
            status_code=422,
            detail="Scored questions must be mandatory",
        )

    if payload.is_scored and payload.answer_type == "single_select":
        if payload.scoring_strategy != "single_option_score":
            raise HTTPException(
                status_code=422,
                detail="Single select scored questions must use single_option_score",
            )

        active_options = [option for option in payload.options if option.is_active]
        if len(active_options) < 2:
            raise HTTPException(
                status_code=422,
                detail="Scored single select questions require at least two active options",
            )

        for option in active_options:
            if option.score is None:
                raise HTTPException(
                    status_code=422,
                    detail="Scored answer options must have a score",
                )
            if option.score < MIN_OPTION_SCORE or option.score > MAX_OPTION_SCORE:
                raise HTTPException(
                    status_code=422,
                    detail="Answer option scores must be between 0 and 4",
                )

    if payload.is_scored and payload.answer_type == "multi_select":
        if payload.scoring_strategy not in {"multi_sum", "multi_average", "multi_max"}:
            raise HTTPException(
                status_code=422,
                detail="Scored multi select questions require a multi scoring strategy",
            )
        for option in payload.options:
            if option.is_active and option.score is None:
                raise HTTPException(
                    status_code=422,
                    detail="Scored multi select options must have scores",
                )

    for rule in payload.display_rules:
        if rule.operator not in DISPLAY_RULE_OPERATORS:
            raise HTTPException(status_code=422, detail="Invalid display rule operator")
        if rule.depends_on_question_id <= 0:
            raise HTTPException(
                status_code=422,
                detail="Display rules must depend on a valid question",
            )
