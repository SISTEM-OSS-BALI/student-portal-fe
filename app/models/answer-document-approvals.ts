export interface AnswerDocumentApprovalsDataModel {
  id?: string;
  answer_document_id?: string;
  student_id?: string;
  reviewer_id?: string;
  status?: string;
  note?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnswerDocumentApprovalsPayloadCreateModel {
  answer_document_id: string;
  student_id: string;
  reviewer_id: string;
  status?: string;
  note?: string | null;
  reviewed_at?: string | null;
}

export interface AnswerDocumentApprovalsPayloadUpdateModel {
  answer_document_id?: string;
  student_id?: string;
  reviewer_id?: string;
  status?: string;
  note?: string | null;
  reviewed_at?: string | null;
}
