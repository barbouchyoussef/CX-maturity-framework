import { apiClient } from "@/lib/apiClient"; 
import type {
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