import { Modal } from "antd";
import FormCountryComponent from "./FormCountryComponent";
import type {
  CountryManagementDataModel,
  CountryManagementPayloadCreateModel,
} from "@/app/models/country-management";

interface ModalCountryComponentProps {
  open: boolean;
  onCancelModal: () => void;
  onSubmit: (values: CountryManagementPayloadCreateModel) => void;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedCountry?: CountryManagementDataModel | null;
}

export default function ModalCountryComponent({
  open,
  onCancelModal,
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedCountry,
}: ModalCountryComponentProps) {
  return (
    <div>
      <Modal
        open={open}
        title={selectedCountry ? "Edit Negara" : "Buat Negara"}
        onCancel={onCancelModal}
        destroyOnClose
        footer={null}
      >
        <FormCountryComponent
          onCancel={onCancel}
          loading={loading}
          deleteLoading={deleteLoading}
          onSubmit={onSubmit}
          onDelete={onDelete}
          selectedCountry={selectedCountry}
        />
      </Modal>
    </div>
  );
}
