import { CountryManagementDataModel } from "./country-management";
import { DocumentDataModel } from "./documents-management";
import { NoteStudentDataModel } from "./notes-student";

export interface UserDataModel {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  stage_id?: string | null;
  current_step_id?: string | null;
  visa_status?: string;
  status?: string;
  student_status?: string;

  name_campus?: string;
  degree?: string;
  name_degree?: string;
  visa_type?: string;
  translation_quota?: number;
  no_phone?: string | null;

  visa_granted_at?: string | null;
  visa_grant_duration_days?: number | null;
  visa_grant_duration_label?: string | null;

  joined_at?: string | null;
  created_at?: string;
  updated_at?: string;

  student_status_updated_by_id?: string | number | null;
  student_status_updated_by_name?: string | null;
  student_status_updated_at?: string | null;
  student_status_updated_at_label?: string | null;

  document_consent_signature_url?: string | null;
  document_consent_proof_photo_url?: string | null;
  document_consent_signed_at?: string | null;
  document_consent_signed?: boolean;

  notes?: NoteStudentDataModel[];
  stage?: {
    id: string;
    country_id?: string;
    document_id?: string;
    country?: CountryManagementDataModel;
    document?: DocumentDataModel;
    created_at?: string;
    updated_at?: string;
  };
}

export interface UserPayloadCreateModel {
  name: string;
  email: string;
  password: string;
  role?: string;
  stage_id?: string | null;
  current_step_id?: string | null;
  visa_status?: string;
  student_status?: string;
  name_consultant?: string | null;
  name_campus?: string;
  degree?: string;
  name_degree?: string;
  visa_type?: string;
  translation_quota?: number;
  no_phone?: string | null;
}

export interface UserPayloadUpdateModel {
  name?: string;
  email?: string;
  role?: string;
  stage_id?: string | null;
  current_step_id?: string | null;
  visa_status?: string;
  student_status?: string;
  name_consultant?: string | null;
  name_campus?: string;
  degree?: string;
  name_degree?: string;
  visa_type?: string;
  translation_quota?: number;
  no_phone?: string | null;
}

export interface UserLoginModel {
  email: string;
  password: string;
}

export interface PatchDocumentsConsentPayload {
  document_consent_signature_url?: string | null;
  document_consent_proof_photo_url?: string | null;
  document_consent_signed_at?: string | null;
  document_consent_signed?: boolean;
}

export type UserFormModel = UserLoginModel;
