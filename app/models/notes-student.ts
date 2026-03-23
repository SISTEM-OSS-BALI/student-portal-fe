export interface NoteStudentDataModel {
  id?: string;
  user_id?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NoteStudentPayloadCreateModel {
  user_id: string;
  content: string;
}

export interface NoteStudentPayloadUpdateModel {
  content?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface NoteStudentFormModel extends Omit<NoteStudentDataModel, "id"> {}
