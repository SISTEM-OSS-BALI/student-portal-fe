import type {
  ChildStepsManagementDataModel,
  ChildStepsManagementPayloadCreateModel,
} from "@/app/models/child-steps-management";
import { Button, Form, Input, Space } from "antd";
import { useEffect } from "react";

interface FormChildStepManagementProps {
  onSubmit: (values: ChildStepsManagementPayloadCreateModel) => void | Promise<void>;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedChild?: ChildStepsManagementDataModel | null;
}

export default function FormChildStepManagement({
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedChild,
}: FormChildStepManagementProps) {
  const [form] = Form.useForm<ChildStepsManagementPayloadCreateModel>();

  useEffect(() => {
    if (!selectedChild) {
      form.resetFields();
      return;
    }
    form.setFieldsValue({
      label: selectedChild?.label ?? "",
    });
  }, [form, selectedChild]);

  const handleFinish = async (values: ChildStepsManagementPayloadCreateModel) => {
    try {
      await onSubmit(values);
      form.resetFields();
    } catch {
      // handled by notification hook
    }
  };

  return (
    <div>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="label"
          label="Nama Kategori Step"
          rules={[{ required: true, message: "Nama kategori wajib diisi" }]}
        >
          <Input placeholder="Contoh: Translation" />
        </Form.Item>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Batal</Button>
          <Button
            danger
            onClick={onDelete}
            disabled={!selectedChild}
            loading={deleteLoading}
          >
            Hapus
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {selectedChild ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </Space>
      </Form>
    </div>
  );
}
