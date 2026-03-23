export interface DocumentTranslationDataModel {
  id?: string;
  student_id?: string;
  document_id?: string;
  uploader_id?: string;
  answer_document_id?: string | null;
  file_url?: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  page_count?: number | null;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentTranslationPayloadCreateModel {
  student_id: string;
  document_id: string;
  uploader_id: string;
  answer_document_id?: string | null;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  page_count?: number | null;
  status?: string | null;
}

export interface DocumentTranslationPayloadUpdateModel {
  student_id?: string;
  document_id?: string;
  uploader_id?: string;
  answer_document_id?: string | null;
  file_url?: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  page_count?: number | null;
  status?: string | null;
}
