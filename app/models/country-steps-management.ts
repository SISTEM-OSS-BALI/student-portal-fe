import type { StepsManagementDataModel } from "./steps-management";

export interface CountryStepsManagementDataModel {
  id: string;
  country_id: string;
  step_id: string;
  country?: {
    id: string;
    name: string;
  };
  step?: StepsManagementDataModel;
  created_at?: string;
  updated_at?: string;
}

export interface CountryStepsManagementPayloadCreateModel {
  country_id: string;
  step_id: string;
}

export interface CountryStepsManagementPayloadUpdateModel {
  country_id?: string;
  step_id?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CountryStepsManagementFormModel
  extends Omit<
    CountryStepsManagementDataModel,
    "id" | "created_at" | "updated_at"
  > {}
