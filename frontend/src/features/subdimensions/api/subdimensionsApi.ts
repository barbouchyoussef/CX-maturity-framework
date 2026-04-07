import { apiClient } from "@/lib/apiClient";
import type {
  Subdimension,
  SubdimensionCreateResponse,
  SubdimensionPayload,
} from "../types/subdimension.types";

export async function getSubdimensions(
  dimensionId?: number
): Promise<Subdimension[]> {
  const query = dimensionId ? `?dimension_id=${dimensionId}` : "";
  return apiClient<Subdimension[]>(`/subdimensions${query}`);
}

export async function createSubdimension(
  payload: SubdimensionPayload
): Promise<SubdimensionCreateResponse> {
  return apiClient<SubdimensionCreateResponse>("/subdimensions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSubdimension(
  subdimensionId: number,
  payload: SubdimensionPayload
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/subdimensions/${subdimensionId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSubdimension(
  subdimensionId: number
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/subdimensions/${subdimensionId}`, {
    method: "DELETE",
  });
}
