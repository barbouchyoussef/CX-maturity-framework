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