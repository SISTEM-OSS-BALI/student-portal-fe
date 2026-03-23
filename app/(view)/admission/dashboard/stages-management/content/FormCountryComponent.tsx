import type {
  CountryManagementDataModel,
  CountryManagementPayloadCreateModel,
} from "@/app/models/country-management";
import { Button, Form, Input, Space } from "antd";
import { useEffect } from "react";

export interface FormCountryComponentProps {
  onSubmit: (values: CountryManagementPayloadCreateModel) => void;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedCountry?: CountryManagementDataModel | null;
}

export default function FormCountryComponent({
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedCountry,
}: FormCountryComponentProps) {
  const [form] = Form.useForm<CountryManagementPayloadCreateModel>();

  useEffect(() => {
    form.setFieldsValue({
      name: selectedCountry?.name ?? "",
    });
  }, [form, selectedCountry]);

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onSubmit}
      >
        <Form.Item
          name="name"
          label="Nama Negara"
          rules={[{ required: true, message: "Nama negara wajib diisi" }]}
        >
          <Input type="text" placeholder="Indonesia" />
        </Form.Item>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Batal</Button>
          <Button
            danger
            onClick={onDelete}
            disabled={!selectedCountry}
            loading={deleteLoading}
          >
            Hapus
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {selectedCountry ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </Space>
      </Form>
    </div>
  );
}
