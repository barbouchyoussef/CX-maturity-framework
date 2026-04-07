export type Sector = {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
};

export type SectorPayload = {
  name: string;
  code: string;
  description?: string | null;
  display_order: number;
  is_active: boolean;
};

export type SectorCreateResponse = {
  sector_id: number;
  message: string;
};
