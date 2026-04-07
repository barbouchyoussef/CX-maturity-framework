export type Subdimension = {
  id: number;
  dimension_id: number;
  name: string;
  code: string;
  description?: string | null;
  weight: number;
  display_order: number;
  is_active: boolean;
};

export type SubdimensionPayload = {
  dimension_id: number;
  name: string;
  code: string;
  description?: string | null;
  weight: number;
  display_order: number;
  is_active: boolean;
};

export type SubdimensionCreateResponse = {
  subdimension_id: number;
  message: string;
};
