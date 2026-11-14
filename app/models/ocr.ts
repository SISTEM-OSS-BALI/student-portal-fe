export type ExtractedFieldsModel = {
  full_name?: string;
  document_number?: string;
  nik?: string;
  passport_number?: string;
  birth_date?: string;
  expiry_date?: string;
  issue_date?: string;
  nationality?: string;
  institution_name?: string;
  major_or_degree?: string;
  score_or_gpa?: string;
  bank_name?: string;
  account_number?: string;
  additional_fields?: Record<string, string>;
};

export type OCRClassifyResultModel = {
  detected_type: string;
  detected_label: string;
  confidence: number;
  confidence_percent: string;
  expected_type?: string;
  expected_label?: string;
  is_match: boolean;
  status: "VALID_MATCH" | "MISMATCH" | "UNRECOGNIZED";
  message: string;
  warning?: string;
  extracted_fields: ExtractedFieldsModel;
  raw_text_snippet: string;
  processed_at: string;
};

export type OCRClassifyPayload = {
  url?: string;
  expected_code?: string;
  expected_label?: string;
  answer_document_id?: string;
  use_ai?: boolean;
};
