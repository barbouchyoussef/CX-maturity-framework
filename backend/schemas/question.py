from pydantic import BaseModel, Field
from typing import Optional


class AnswerOptionBase(BaseModel):
    option_label: str
    option_value: str
    score: Optional[float] = None
    maturity_level: Optional[int] = None
    display_order: int = 0
    is_active: bool = True


class AnswerOptionCreate(AnswerOptionBase):
    pass


class AnswerOptionOut(AnswerOptionBase):
    id: int
    question_id: int


class DisplayRuleBase(BaseModel):
    depends_on_question_id: int
    operator: str
    expected_option_id: Optional[int] = None
    expected_value: Optional[str] = None
    min_score: Optional[float] = None
    max_score: Optional[float] = None
    rule_group: Optional[str] = None
    is_active: bool = True


class DisplayRuleCreate(DisplayRuleBase):
    pass


class DisplayRuleOut(DisplayRuleBase):
    id: int
    question_id: int


class QuestionBase(BaseModel):
    sector_id: int
    subdimension_id: int
    question_text: str
    helper_text: Optional[str] = None
    answer_type: str
    is_mandatory: bool = True
    is_scored: bool = True
    scoring_strategy: str = "single_option_score"
    weight: Optional[float] = None
    display_order: int = 0
    is_active: bool = True


class QuestionCreate(QuestionBase):
    options: list[AnswerOptionCreate] = Field(default_factory=list)
    display_rules: list[DisplayRuleCreate] = Field(default_factory=list)


class QuestionUpdate(QuestionBase):
    options: list[AnswerOptionCreate] = Field(default_factory=list)
    display_rules: list[DisplayRuleCreate] = Field(default_factory=list)


class QuestionOut(QuestionBase):
    id: int
    options: list[AnswerOptionOut] = Field(default_factory=list)
    display_rules: list[DisplayRuleOut] = Field(default_factory=list)


class QuestionCreateResponse(BaseModel):
    question_id: int
    message: str
