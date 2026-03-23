import { CountryManagementDataModel } from "./country-management";
import { DocumentDataModel } from "./documents-management";
import { NoteStudentDataModel } from "./notes-student";

export interface UserDataModel {
  id: number | string;
  name: string;
  email: string;
  role?: string;
  stage_id?: string | null;
  status?: string;
  name_campus?: string;
  degree?: string;
  name_degree?: string;
  visa_type?: string;
  translation_quota?: number;
  no_phone?: string | null;
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

  created_at?: string;
  updated_at?: string;
}

export interface UserPayloadCreateModel {
  name: string;
  email: string;
  password: string;
  stage_id?: string | null;
  status?: string;
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
  stage_id?: string | null;
  status?: string;
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

export type UserFormModel = UserLoginModel;
