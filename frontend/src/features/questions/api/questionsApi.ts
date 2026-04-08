import { apiClient } from "@/lib/apiClient";
import type {
  Question,
  QuestionCreateResponse,
  QuestionPayload,
} from "../types/question.types";

export async function getQuestions(filters?: {
  sectorId?: number;
  subdimensionId?: number;
}): Promise<Question[]> {
  const params = new URLSearchParams();
  if (filters?.sectorId) params.set("sector_id", String(filters.sectorId));
  if (filters?.subdimensionId) {
    params.set("subdimension_id", String(filters.subdimensionId));
  }

  const query = params.toString() ? `?${params.toString()}` : "";
  return apiClient<Question[]>(`/questions${query}`);
}

export async function createQuestion(
  payload: QuestionPayload
): Promise<QuestionCreateResponse> {
  return apiClient<QuestionCreateResponse>("/questions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateQuestion(
  questionId: number,
  payload: QuestionPayload
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/questions/${questionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteQuestion(
  questionId: number
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/questions/${questionId}`, {
    method: "DELETE",
  });
}
