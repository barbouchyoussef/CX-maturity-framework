import { apiClient } from "@/lib/apiClient";
import type {
  Sector,
  SectorCreateResponse,
  SectorPayload,
} from "../types/sector.types";

export async function getSectors(): Promise<Sector[]> {
  return apiClient<Sector[]>("/sectors");
}

export async function createSector(
  payload: SectorPayload
): Promise<SectorCreateResponse> {
  return apiClient<SectorCreateResponse>("/sectors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateSector(
  sectorId: number,
  payload: SectorPayload
): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/sectors/${sectorId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteSector(sectorId: number): Promise<void> {
  await apiClient<void>(`/sectors/${sectorId}`, {
    method: "DELETE",
  });
}
