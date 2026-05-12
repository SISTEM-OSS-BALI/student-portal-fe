export interface PromoDataModel {
  id: string;
  code: string;
  description?: string | null;
  discount: number;
  valid_from: string;
  valid_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PromoPayloadCreateModel {
  code: string;
  description?: string | null;
  discount: number;
  valid_from: string;
  valid_to: string;
  is_active?: boolean;
}

export interface PromoPayloadUpdateModel {
  code?: string;
  description?: string | null;
  discount?: number;
  valid_from?: string;
  valid_to?: string;
  is_active?: boolean;
}

