import { CountryManagementDataModel } from "./country-management";
import { DocumentDataModel } from "./documents-management";

export interface StagesManagementDataModel {
  id: string;
  country_id: string;
  document_id: string;
  country?: CountryManagementDataModel;
  document?: DocumentDataModel;
  created_at?: string;
  updated_at?: string;
}



export interface StagesManagementPayloadCreateModel {
  country_id: string;
  document_id: string;
}

export interface StagesManagementPayloadUpdateModel {
  country_id?: string;
  document_id?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StagesManagementFormModel
  extends Omit<StagesManagementDataModel, "id" | "created_at" | "updated_at"> {}
