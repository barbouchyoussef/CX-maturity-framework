export type CreateAssessmentPayload = {
  company_name: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_role_title: string | null;
  sector_id: number | null;
};

export type CreateAssessmentResponse = {
  assessment_id: number;
};

export type Assessment = {
  id: number;
  company_name: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_role_title: string | null;
  sector_id: number | null;
  status: string;
  overall_score: number | null;
  maturity_level: string | null;
};

export type AssessmentAnswerSubmit = {
  question_id: number;
  selected_option_id?: number | null;
  selected_option_ids?: number[];
  answer_text?: string | null;
};

export type AssessmentSubmitPayload = {
  answers: AssessmentAnswerSubmit[];
};

export type AssessmentDimensionScore = {
  dimension_id: number;
  score_percent: number | null;
};

export type AssessmentSubdimensionScore = {
  subdimension_id: number;
  raw_score: number | null;
  normalized_score_percent: number | null;
  weighted_score_contribution: number | null;
  maturity_band: string | null;
};

export type AssessmentRecommendation = {
  recommendation_id: number | null;
  subdimension_id: number;
  recommendation_type: string;
  recommendation_title: string;
  recommendation_text: string;
  priority_level: string;
  source_theme_type: string;
};

export type AssessmentSubmitResponse = {
  assessment_id: number;
  overall_score: number | null;
  maturity_level: string | null;
  dimension_scores: AssessmentDimensionScore[];
  subdimension_scores: AssessmentSubdimensionScore[];
  recommendations: AssessmentRecommendation[];
};

export type AssessmentAnswerSelectedOption = {
  option_id: number;
  option_label: string;
  option_value: string;
  score: number | null;
};

export type AssessmentAnswerLog = {
  assessment_answer_id: number | null;
  question_id: number;
  question_text: string;
  answer_type: string;
  is_mandatory: boolean;
  is_scored: boolean;
  scoring_strategy: string;
  selected_option_id: number | null;
  selected_option_label: string | null;
  selected_option_value: string | null;
  selected_options: AssessmentAnswerSelectedOption[];
  answer_text: string | null;
  numeric_score: number | null;
  confidence_score: number | null;
  answered_at: string | null;
};

export type AssessmentSubdimensionResult = {
  subdimension_id: number;
  code: string;
  name: string;
  weight: number;
  raw_score: number | null;
  normalized_score_percent: number | null;
  weighted_score_contribution: number | null;
  maturity_band: string | null;
  calculation_details: string | null;
  answers: AssessmentAnswerLog[];
  recommendations: AssessmentRecommendation[];
};

export type AssessmentDimensionResult = {
  dimension_id: number;
  code: string;
  name: string;
  weight: number;
  score_percent: number | null;
  calculation_details: string | null;
  subdimensions: AssessmentSubdimensionResult[];
};

export type AssessmentAreaHighlight = {
  dimension_id: number;
  dimension_name: string;
  subdimension_id: number;
  subdimension_name: string;
  score_percent: number | null;
  maturity_band: string | null;
};

export type AssessmentResults = {
  assessment_id: number;
  company_name: string | null;
  respondent_name: string | null;
  respondent_email: string | null;
  respondent_role_title: string | null;
  sector_id: number | null;
  sector_name: string | null;
  status: string;
  overall_score: number | null;
  maturity_level: string | null;
  dimensions: AssessmentDimensionResult[];
  recommendations: AssessmentRecommendation[];
  strengths: AssessmentAreaHighlight[];
  pain_points: AssessmentAreaHighlight[];
};
