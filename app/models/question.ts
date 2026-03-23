export type TypeJob = string;
export type QuestionType = string;

export interface QuestionBaseDataModel {
  id: string;
  name: string;
  desc?: string | null;
  type_country: TypeJob;
  country_id?: string | null;
  allow_multiple_submissions: boolean;
  active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionBasePayloadCreateModel {
  name: string;
  desc?: string | null;
  type_country: TypeJob;
  country_id?: string | null;
  allow_multiple_submissions?: boolean;
  active?: boolean;
  version?: number;
}

export interface QuestionBasePayloadUpdateModel {
  name?: string;
  desc?: string | null;
  type_country?: TypeJob;
  country_id?: string | null;
  allow_multiple_submissions?: boolean;
  active?: boolean;
  version?: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface QuestionBaseFormModel
  extends Omit<QuestionBaseDataModel, "id" | "created_at" | "updated_at"> {}

export interface QuestionOptionItemDataModel {
  id: string;
  question_id: string;
  label: string;
  value: string;
  order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionDataModel {
  id: string;
  base_id: string;
  text: string;
  input_type: QuestionType;
  required: boolean;
  order: number;
  help_text?: string | null;
  placeholder?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  active: boolean;
  option_ids?: string[];
  options?: QuestionOptionItemDataModel[];
  created_at: string;
  updated_at: string;
}

export interface QuestionPayloadCreateModel {
  base_id: string;
  text: string;
  input_type: QuestionType;
  required?: boolean;
  order?: number;
  help_text?: string | null;
  placeholder?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  active?: boolean;
}

export interface QuestionPayloadUpdateModel {
  base_id?: string;
  text?: string;
  input_type?: QuestionType;
  required?: boolean;
  order?: number;
  help_text?: string | null;
  placeholder?: string | null;
  min_length?: number | null;
  max_length?: number | null;
  active?: boolean;
}

export interface QuestionOptionDataModel {
  id: string;
  question_id: string;
  label: string;
  value: string;
  order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface QuestionOptionPayloadCreateModel {
  question_id: string;
  label: string;
  value: string;
  order?: number;
  active?: boolean;
}

export interface QuestionOptionPayloadUpdateModel {
  question_id?: string;
  label?: string;
  value?: string;
  order?: number;
  active?: boolean;
}

export interface AnswerQuestionDataModel {
  id: string;
  submission_id?: string | null;
  question_id: string;
  answer_text?: string | null;
  student_id?: string | null;
  selected_option_ids: string[];
  created_at: string;
}

export interface AnswerQuestionPayloadCreateModel {
  submission_id?: string | null;
  question_id: string;
  answer_text?: string | null;
  student_id?: string | null;
  selected_option_ids?: string[];
}

export interface AnswerQuestionPayloadUpdateModel {
  submission_id?: string | null;
  answer_text?: string | null;
  student_id?: string | null;
  selected_option_ids?: string[];
}

export interface AnswerSelectedOptionDataModel {
  answer_id: string;
  option_id: string;
}

export interface AnswerSelectedOptionPayloadCreateModel {
  answer_id: string;
  option_id: string;
}

export interface AnswerDocumentDataModel {
  id: string;
  submission_id?: string | null;
  student_id: string;
  document_id: string;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnswerDocumentPayloadCreateModel {
  submission_id?: string | null;
  student_id?: string | null;
  document_id: string;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  status?: string | null;
}

export interface AnswerDocumentPayloadUpdateModel {
  submission_id?: string | null;
  student_id?: string | null;
  document_id?: string | null;
  file_url?: string | null;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  status?: string | null;
}

export interface AnswerSubmissionDataModel {
  id: string;
  base_id: string;
  student_id: string;
  status: string;
  version: number;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnswerSubmissionPayloadCreateModel {
  base_id: string;
  student_id: string;
  status?: string;
  version?: number;
  submitted_at?: string | null;
}

export interface AnswerSubmissionPayloadUpdateModel {
  base_id?: string;
  student_id?: string;
  status?: string;
  version?: number;
  submitted_at?: string | null;
}
