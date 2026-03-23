export interface AnswerApprovalsDataModel {
  id?: string;
  answer_id?: string;
  student_id?: string;
  reviewer_id?: string;
  status?: string;
  note?: string | null;
  reviewed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AnswerApprovalsPayloadCreateModel {
  answer_id: string;
  student_id: string;
  reviewer_id: string;
  status?: string;
  note?: string | null;
  reviewed_at?: string | null;
}

export interface AnswerApprovalsPayloadUpdateModel {
  answer_id?: string;
  student_id?: string;
  reviewer_id?: string;
  status?: string;
  note?: string | null;
  reviewed_at?: string | null;
}
