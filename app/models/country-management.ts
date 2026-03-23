import type { CountryStepsManagementDataModel } from "./country-steps-management";
import type { StepsManagementDataModel } from "./steps-management";

export interface CountryManagementDataModel {
  id: string;
  name: string;
  document_total?: number;
  step_total?: number;
  steps?: StepsManagementDataModel[];
  country_steps?: CountryStepsManagementDataModel[];
  created_at?: string;
  updated_at?: string;
}

export interface CountryManagementPayloadCreateModel {
  name: string;
}

export interface CountryManagementPayloadUpdateModel {
  name?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CountryManagementFormModel
  extends Omit<CountryManagementDataModel, "id" | "created_at" | "updated_at"> {}
