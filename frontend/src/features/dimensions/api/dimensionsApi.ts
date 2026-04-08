import { apiClient } from "@/lib/apiClient";
import type {
  Dimension,
  DimensionCreateResponse,
  DimensionPayload,
} from "../types/dimension.types";

export async function getDimensions(): Promise<Dimension[]> {
  return apiClient<Dimension[]>("/dimensions");
}

export async function createDimension(
  payload: DimensionPayload
): Promise<DimensionCreateResponse> {
  return apiClient<DimensionCreateResponse>("/dimensions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDimension(
  dimensionId: number,
  payload: DimensionPayload
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/dimensions/${dimensionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteDimension(
  dimensionId: number
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/dimensions/${dimensionId}`, {
    method: "DELETE",
  });
}
