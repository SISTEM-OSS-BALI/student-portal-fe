export type TranslationNeededValue = "yes" | "no";

export interface DocumentDataModel {
  id: number | string;
  label: string;
  internal_code: string;
  file_type: string;
  category: string;
  example_url?: string | null;
  translation_needed: TranslationNeededValue;
  required: boolean;
  auto_rename_pattern: string;
  notes?: string | null;
  ocr_keywords?: string | null;
  ocr_pattern?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentPayloadCreateModel {
  label: string;
  internal_code: string;
  file_type: string;
  category: string;
  example_url?: string | null;
  translation_needed: TranslationNeededValue;
  required: boolean;
  auto_rename_pattern: string;
  notes?: string;
  ocr_keywords?: string | null;
  ocr_pattern?: string | null;
}

export interface DocumentPayloadUpdateModel {
  label?: string;
  internal_code?: string;
  file_type?: string;
  category?: string;
  example_url?: string | null;
  translation_needed?: TranslationNeededValue;
  required?: boolean;
  auto_rename_pattern?: string;
  notes?: string | null;
  ocr_keywords?: string | null;
  ocr_pattern?: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DocumentFormModel
  extends Omit<DocumentDataModel, "id" | "created_at" | "updated_at"> {}
