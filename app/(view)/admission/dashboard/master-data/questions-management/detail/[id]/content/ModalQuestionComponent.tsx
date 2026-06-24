import type { QuestionDataModel, QuestionPayloadCreateModel } from "@/app/models/question";
import { Modal } from "antd";
import FormQuestionManagement from "./FormQuestionComponent";

interface ModalQuestionComponentProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: QuestionPayloadCreateModel) => Promise<QuestionDataModel>;
  onSaved?: () => void;
  initialValues?: Partial<QuestionPayloadCreateModel>;
  questionId?: string;
  initialOptions?: QuestionDataModel["options"];
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
      width={600}
    >
      <FormQuestionManagement
        onSubmit={props.onSubmit}
        onSaved={props.onSaved}
        initialValues={props.initialValues}
        loading={props.loading}
        base_id={props.base_id}
        questionId={props.questionId}
        initialOptions={props.initialOptions}
        submitLabel={props.submitLabel}
      />
    </Modal>
  );
}
