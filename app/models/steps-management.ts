import { ChildStepsManagementDataModel } from "./child-steps-management";

export interface StepsManagementDataModel {
  id: string;
  label: string;
  child_ids?: string[];
  children?: ChildStepsManagementDataModel[];
  created_at?: string;
  updated_at?: string;
}

export type StepChildApiModel = {
  id: string;
  label: string;
};

export type StepsApiModel = {
  id: string;
  label: string;
  child_id?: string | null;
  child?: StepChildApiModel;
  child_ids?: string[];
  children?: StepChildApiModel[];
  created_at?: string;
  updated_at?: string;
};

export interface StepsManagementPayloadCreateModel {
  label: string;
  child_ids?: string[];
}

export interface StepsManagementPayloadUpdateModel {
  label?: string;
  child_ids?: string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface StepsManagementFormModel extends Omit<
  StepsManagementDataModel,
  "id" | "created_at" | "updated_at" | "children"
> {}
