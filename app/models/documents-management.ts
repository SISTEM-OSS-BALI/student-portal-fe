export type TranslationNeededValue = "yes" | "no";

export interface DocumentDataModel {
  id: number | string;
  label: string;
  internal_code: string;
  file_type: string;
  category: string;
  translation_needed: TranslationNeededValue;
  required: boolean;
  auto_rename_pattern: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentPayloadCreateModel {
  label: string;
  internal_code: string;
  file_type: string;
  category: string;
  translation_needed: TranslationNeededValue;
  required: boolean;
  auto_rename_pattern: string;
  notes?: string;
}

export interface DocumentPayloadUpdateModel {
  label?: string;
  internal_code?: string;
  file_type?: string;
  category?: string;
  translation_needed?: TranslationNeededValue;
  required?: boolean;
  auto_rename_pattern?: string;
  notes?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DocumentFormModel
  extends Omit<DocumentDataModel, "id" | "created_at" | "updated_at"> {}
