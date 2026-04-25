import type { UserDataModel } from "./user";

export type StatementLetterDocumentStatus =
  | "DRAFT"
  | "SUBMITTED_TO_DIRECTOR"
  | "REVISION_REQUESTED"
  | "APPROVED";

export type StatementLetterApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "CANCELED";

export type GeneratedDocumentSource = "AI" | "MANUAL";

export interface StatementLetterApprovalReviewerDataModel {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface StatementLetterApprovalLogDataModel {
  id: string;
  approval_id: string;
  actor_id: string;
  actor?: StatementLetterApprovalReviewerDataModel | null;
  from_status?: StatementLetterApprovalStatus | null;
  to_status: StatementLetterApprovalStatus;
  note?: string | null;
  created_at: string;
}

export interface StatementLetterAiApprovalDataModel {
  id: string;
  document_id: string;
  reviewer_id: string;
  reviewer?: StatementLetterApprovalReviewerDataModel | null;
  status: StatementLetterApprovalStatus;
  note?: string | null;
  reviewed_at?: string | null;
  logs?: StatementLetterApprovalLogDataModel[];
  created_at: string;
  updated_at: string;
}

export interface GeneratedStatementLetterAiTemplateDataModel {
  document_type: string;
  default_source?: GeneratedDocumentSource | string | null;
  supports_manual_creation?: boolean;
  supports_ai_generation?: boolean;
  checklist_version?: string | null;
  checklist_items?: string[];
  checklist_source?: string | null;
}

export interface GeneratedStatementLetterAiDocumentDataModel {
  id: string;
  student_id: string;
  student?: Pick<UserDataModel, "id" | "name" | "email"> | null;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  word_file_url?: string | null;
  word_file_path?: string | null;
  word_file_name?: string | null;
  word_file_type?: string | null;
  status?: StatementLetterDocumentStatus | string | null;
  source?: GeneratedDocumentSource | string | null;
  supports_manual_creation?: boolean;
  supports_ai_generation?: boolean;
  checklist_version?: string | null;
  checklist_items?: string[];
  checklist_source?: string | null;
  submitted_to_director_at?: string | null;
  approved_at?: string | null;
  revision_requested_at?: string | null;
  current_approval_id?: string | null;
  can_download_pdf?: boolean;
  download_pdf_url?: string | null;
  current_approval?: StatementLetterAiApprovalDataModel | null;
  approvals?: StatementLetterAiApprovalDataModel[];
  created_at: string;
  updated_at: string;
}

export interface GeneratedStatementLetterAiDocumentPayloadModel {
  student_id: string;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  word_file_url?: string | null;
  word_file_path?: string | null;
  word_file_name?: string | null;
  word_file_type?: string | null;
  status?: StatementLetterDocumentStatus | string | null;
  source?: GeneratedDocumentSource | string | null;
  submitted_to_director_at?: string | null;
  approved_at?: string | null;
  revision_requested_at?: string | null;
  current_approval_id?: string | null;
}

export interface StatementLetterAiApprovalPayloadCreateModel {
  document_id: string;
  status: StatementLetterApprovalStatus;
  note?: string | null;
}

export interface StatementLetterAiApprovalPayloadUpdateModel {
  status?: StatementLetterApprovalStatus;
  note?: string | null;
}
