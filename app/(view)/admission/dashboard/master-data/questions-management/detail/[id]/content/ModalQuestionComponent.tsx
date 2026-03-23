import type { QuestionPayloadCreateModel } from "@/app/models/question";
import { Modal } from "antd";
import FormQuestionManagement from "./FormQuestionComponent";

interface ModalQuestionComponentProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionPayloadCreateModel) => void;
  initialValues?: Partial<QuestionPayloadCreateModel>;
  base_id?: string;
  title?: string;
  submitLabel?: string;
  loading?: boolean;
}

export default function ModalQuestionComponent({
  ...props
}: ModalQuestionComponentProps) {
  return (
    <Modal
      visible={props.visible}
      onCancel={props.onClose}
      title={props.title}
      footer={null}
      destroyOnClose
    >
      <FormQuestionManagement
        onSubmit={props.onSubmit}
        initialValues={props.initialValues}
        loading={props.loading}
        base_id={props.base_id}
        submitLabel={props.submitLabel}
      />
    </Modal>
  );
}
