from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class AssessmentCreate(BaseModel):
    company_name: Optional[str] = None
    respondent_name: Optional[str] = None
    respondent_email: Optional[EmailStr] = None
    respondent_role_title: Optional[str] = None
    sector_id: Optional[int] = None


class AssessmentCreateResponse(BaseModel):
    assessment_id: int
    message: str


class AssessmentOut(BaseModel):
    id: int
    company_name: Optional[str] = None
    respondent_name: Optional[str] = None
    respondent_email: Optional[EmailStr] = None
    respondent_role_title: Optional[str] = None
    sector_id: Optional[int] = None
    status: str
    overall_score: Optional[float] = None
    maturity_level: Optional[str] = None


class AssessmentAnswerSubmit(BaseModel):
    question_id: int
    selected_option_id: Optional[int] = None
    selected_option_ids: list[int] = Field(default_factory=list)
    answer_text: Optional[str] = None


class AssessmentSubmitRequest(BaseModel):
    answers: list[AssessmentAnswerSubmit] = Field(default_factory=list)


class AssessmentSubdimensionScoreOut(BaseModel):
    subdimension_id: int
    raw_score: Optional[float] = None
    normalized_score_percent: Optional[float] = None
    weighted_score_contribution: Optional[float] = None
    maturity_band: Optional[str] = None


class AssessmentDimensionScoreOut(BaseModel):
    dimension_id: int
    score_percent: Optional[float] = None


class AssessmentRecommendationOut(BaseModel):
    recommendation_id: Optional[int] = None
    subdimension_id: int
    recommendation_type: str
    recommendation_title: str
    recommendation_text: str
    priority_level: str
    source_theme_type: str


class AssessmentSubmitResponse(BaseModel):
    assessment_id: int
    overall_score: Optional[float] = None
    maturity_level: Optional[str] = None
    dimension_scores: list[AssessmentDimensionScoreOut] = Field(default_factory=list)
    subdimension_scores: list[AssessmentSubdimensionScoreOut] = Field(default_factory=list)
    recommendations: list[AssessmentRecommendationOut] = Field(default_factory=list)


class AssessmentAnswerSelectedOptionOut(BaseModel):
    option_id: int
    option_label: str
    option_value: str
    score: Optional[float] = None


class AssessmentAnswerLogOut(BaseModel):
    assessment_answer_id: Optional[int] = None
    question_id: int
    question_text: str
    answer_type: str
    is_mandatory: bool
    is_scored: bool
    scoring_strategy: str
    selected_option_id: Optional[int] = None
    selected_option_label: Optional[str] = None
    selected_option_value: Optional[str] = None
    selected_options: list[AssessmentAnswerSelectedOptionOut] = Field(default_factory=list)
    answer_text: Optional[str] = None
    numeric_score: Optional[float] = None
    confidence_score: Optional[float] = None
    answered_at: Optional[str] = None


class AssessmentSubdimensionResultOut(BaseModel):
    subdimension_id: int
    code: str
    name: str
    weight: float
    raw_score: Optional[float] = None
    normalized_score_percent: Optional[float] = None
    weighted_score_contribution: Optional[float] = None
    maturity_band: Optional[str] = None
    calculation_details: Optional[str] = None
    answers: list[AssessmentAnswerLogOut] = Field(default_factory=list)
    recommendations: list[AssessmentRecommendationOut] = Field(default_factory=list)


class AssessmentDimensionResultOut(BaseModel):
    dimension_id: int
    code: str
    name: str
    weight: float
    score_percent: Optional[float] = None
    calculation_details: Optional[str] = None
    subdimensions: list[AssessmentSubdimensionResultOut] = Field(default_factory=list)


class AssessmentAreaHighlightOut(BaseModel):
    dimension_id: int
    dimension_name: str
    subdimension_id: int
    subdimension_name: str
    score_percent: Optional[float] = None
    maturity_band: Optional[str] = None


class AssessmentResultsOut(BaseModel):
    assessment_id: int
    company_name: Optional[str] = None
    respondent_name: Optional[str] = None
    respondent_email: Optional[EmailStr] = None
    respondent_role_title: Optional[str] = None
    sector_id: Optional[int] = None
    sector_name: Optional[str] = None
    status: str
    overall_score: Optional[float] = None
    maturity_level: Optional[str] = None
    dimensions: list[AssessmentDimensionResultOut] = Field(default_factory=list)
    recommendations: list[AssessmentRecommendationOut] = Field(default_factory=list)
    strengths: list[AssessmentAreaHighlightOut] = Field(default_factory=list)
    pain_points: list[AssessmentAreaHighlightOut] = Field(default_factory=list)
