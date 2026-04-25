import {
  NoteStudentDataModel,
  NoteStudentFormModel,
} from "@/app/models/notes-student";
import FormNotesComponent from "./FormNotesComponent";
import { Modal } from "antd";

interface ModalNotesComponentProps {
  open?: boolean;
  onClose?: () => void;
  user_id?: string;
  selectedNote?: NoteStudentDataModel | null;
  loading?: boolean;
  onSubmit?: (values: NoteStudentFormModel) => void;
  onCancel?: () => void;
}

export default function ModalNotesComponent({
  ...props
}: ModalNotesComponentProps) {
  return (
    <Modal
      open={props.open}
      onCancel={props.onClose}
      footer={null}
      destroyOnHidden
    >
      <FormNotesComponent
        user_id={props.user_id}
        selectedNote={props.selectedNote}
        loading={props.loading}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel ?? props.onClose}
      />
    </Modal>
  );
}
