export interface VisaTypeManagementDataModel {
  id: string;
  name: string;
  country_id: string;
  country_name?: string | null;
  created_at: string;
  updated_at: string;
}

export interface VisaTypeManagementPayloadCreateModel {
  name: string;
  country_id: string;
}

export interface VisaTypeManagementPayloadUpdateModel {
  name?: string;
  country_id?: string;
}

export interface VisaTypeManagementPayloadDeleteModel {
  id: string;
}

export interface VisaTypeManagementFilterModel {
  country_id?: string;
}
