import type { UserDataModel } from "./user";

export type SponsorLetterDocumentStatus =
  | "DRAFT"
  | "SUBMITTED_TO_DIRECTOR"
  | "REVISION_REQUESTED"
  | "APPROVED";

export type SponsorLetterApprovalStatus =
  | "PENDING"
  | "APPROVED"
  | "REVISION_REQUESTED"
  | "REJECTED"
  | "CANCELED";

export type GeneratedDocumentSource = "AI" | "MANUAL";

export interface SponsorLetterApprovalReviewerDataModel {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface SponsorLetterApprovalLogDataModel {
  id: string;
  approval_id: string;
  actor_id: string;
  actor?: SponsorLetterApprovalReviewerDataModel | null;
  from_status?: SponsorLetterApprovalStatus | null;
  to_status: SponsorLetterApprovalStatus;
  note?: string | null;
  created_at: string;
}

export interface SponsorLetterAiApprovalDataModel {
  id: string;
  document_id: string;
  reviewer_id: string;
  reviewer?: SponsorLetterApprovalReviewerDataModel | null;
  status: SponsorLetterApprovalStatus;
  note?: string | null;
  reviewed_at?: string | null;
  logs?: SponsorLetterApprovalLogDataModel[];
  created_at: string;
  updated_at: string;
}

export interface GeneratedSponsorLetterAiTemplateDataModel {
  document_type: string;
  default_source?: GeneratedDocumentSource | string | null;
  supports_manual_creation?: boolean;
  supports_ai_generation?: boolean;
  checklist_version?: string | null;
  checklist_items?: string[];
  checklist_source?: string | null;
}

export interface GeneratedSponsorLetterAiDocumentDataModel {
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
  status?: SponsorLetterDocumentStatus | string | null;
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
  current_approval?: SponsorLetterAiApprovalDataModel | null;
  approvals?: SponsorLetterAiApprovalDataModel[];
  created_at: string;
  updated_at: string;
}

export interface GeneratedSponsorLetterAiDocumentPayloadModel {
  student_id: string;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  word_file_url?: string | null;
  word_file_path?: string | null;
  word_file_name?: string | null;
  word_file_type?: string | null;
  status?: SponsorLetterDocumentStatus | string | null;
  source?: GeneratedDocumentSource | string | null;
  submitted_to_director_at?: string | null;
  approved_at?: string | null;
  revision_requested_at?: string | null;
  current_approval_id?: string | null;
}

export interface SponsorLetterAiApprovalPayloadCreateModel {
  document_id: string;
  status: SponsorLetterApprovalStatus;
  note?: string | null;
}

export interface SponsorLetterAiApprovalPayloadUpdateModel {
  status?: SponsorLetterApprovalStatus;
  note?: string | null;
}
