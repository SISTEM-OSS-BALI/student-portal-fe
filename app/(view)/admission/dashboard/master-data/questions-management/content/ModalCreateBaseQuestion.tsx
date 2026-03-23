import { QuestionBasePayloadCreateModel } from "@/app/models/question";
import { Modal } from "antd";
import FormCreateBaseQuestionComponent from "./FormCreateBaseQuestionComponent";

interface ModalCreateBaseQuestionProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: QuestionBasePayloadCreateModel) => void;
  initialValues?: QuestionBasePayloadCreateModel;
  title?: string;
  submitLabel?: string;
  loading?: boolean;
}
export default function ModalCreateBaseQuestion({
  visible,
  onCancel,
  onSubmit,
  initialValues,
  title = "Create Base Question",
  submitLabel,
  loading,
}: ModalCreateBaseQuestionProps) {
  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      title={title}
      footer={null}
      destroyOnClose
    >
      <FormCreateBaseQuestionComponent
        onFinish={onSubmit}
        initialValues={initialValues}
        submitLabel={submitLabel}
        loading={loading}
      />
    </Modal>
  );
}
