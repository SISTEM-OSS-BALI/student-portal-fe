import { UserDataModel, UserPayloadCreateModel } from "@/app/models/user";
import { Modal } from "antd";
import FormStudentComponent from "./FormStudentComponent";
import { StagesManagementDataModel } from "@/app/models/stages-management";

interface ModalStudentComponentProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: UserPayloadCreateModel) => void;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedStudent?: UserDataModel | null;
  stagesData?: StagesManagementDataModel[];
}

export default function ModalStudentComponent({
  open,
  onClose,
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedStudent,
  stagesData,
}: ModalStudentComponentProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={selectedStudent ? "Edit Student" : "Tambah Student"}
      destroyOnClose
    >
      <FormStudentComponent
        onSubmit={onSubmit}
        onDelete={onDelete}
        onCancel={onCancel}
        loading={loading}
        deleteLoading={deleteLoading}
        selectedStudent={selectedStudent}
        stagesData={stagesData ?? []}
      />
    </Modal>
  );
}
