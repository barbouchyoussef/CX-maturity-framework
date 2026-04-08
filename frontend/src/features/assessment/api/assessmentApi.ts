import { apiClient } from "@/lib/apiClient"; 
import type {
  Assessment,
  AssessmentResults,
  AssessmentSubmitPayload,
  AssessmentSubmitResponse,
  CreateAssessmentPayload,
  CreateAssessmentResponse,
} from "../types/assessment.types";

export async function createAssessment(
  payload: CreateAssessmentPayload
): Promise<CreateAssessmentResponse> {
  return apiClient<CreateAssessmentResponse>("/assessments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAssessment(assessmentId: number): Promise<Assessment> {
  return apiClient<Assessment>(`/assessments/${assessmentId}`);
}

export async function submitAssessment(
  assessmentId: number,
  payload: AssessmentSubmitPayload
): Promise<AssessmentSubmitResponse> {
  return apiClient<AssessmentSubmitResponse>(`/assessments/${assessmentId}/submit`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAssessmentResults(
  assessmentId: number
): Promise<AssessmentResults> {
  return apiClient<AssessmentResults>(`/assessments/${assessmentId}/results`);
}
