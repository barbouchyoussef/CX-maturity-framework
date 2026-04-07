export type Dimension = {
  id: number;
  sector_id: number;
  name: string;
  code: string;
  description?: string | null;
  weight: number;
  display_order: number;
  is_active: boolean;
};

export type DimensionPayload = {
  sector_id: number;
  name: string;
  code: string;
  description?: string | null;
  weight: number;
  display_order: number;
  is_active: boolean;
};

export type DimensionCreateResponse = {
  dimension_id: number;
  message: string;
};
