export type StudentCampusApplicationStatus =
  | "APPLIED"
  | "WAITING_LOO"
  | "CONDITIONAL_LOO"
  | "UNCONDITIONAL_LOO"
  | "ACCEPTED"
  | "REJECTED"
  | (string & {});

export interface StudentCampusApplicationDataModel {
  id: string;
  user_id: string;
  campus_name: string;
  country_name?: string;
  country_id?: string;
  degree: string;
  name_degree: string;
  intake?: string;
  status: StudentCampusApplicationStatus;
  is_primary: boolean;
  notes?: string | null;
  offer_letter_url?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudentCampusApplicationPayloadCreateModel {
  user_id: string;
  campus_name: string;
  country_name?: string;
  country_id?: string;
  degree: string;
  name_degree: string;
  intake?: string;
  status?: StudentCampusApplicationStatus;
  is_primary?: boolean;
  notes?: string | null;
  offer_letter_url?: string | null;
}

export interface StudentCampusApplicationPayloadUpdateModel {
  campus_name?: string;
  country_name?: string;
  country_id?: string;
  degree?: string;
  name_degree?: string;
  intake?: string;
  status?: StudentCampusApplicationStatus;
  is_primary?: boolean;
  notes?: string | null;
  offer_letter_url?: string | null;
}
