export interface ChildStepsManagementDataModel {
  id: string;
  label: string;
  steps?: ChildStepsStepDataModel[];
  created_at?: string;
  updated_at?: string;
}

export interface ChildStepsStepDataModel {
  id: string;
  label: string;
}

export interface ChildStepsApiModel {
  id: string;
  label: string;
  steps?: ChildStepsStepDataModel[];
  created_at?: string;
  updated_at?: string;
}

export interface ChildStepsManagementPayloadCreateModel {
  label: string;
}

export interface ChildStepsManagementPayloadUpdateModel {
  label?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ChildStepsManagementFormModel
  extends Omit<
    ChildStepsManagementDataModel,
    "id" | "created_at" | "updated_at" | "steps"
  > {}
