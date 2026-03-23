import type { ChildStepsManagementDataModel } from "@/app/models/child-steps-management";
import type {
  StepsManagementDataModel,
  StepsManagementPayloadCreateModel,
} from "@/app/models/steps-management";
import { Button, Form, Input, Select, Space } from "antd";
import { useEffect, useMemo } from "react";

interface StepsManagementFormProps {
  onSubmit: (values: StepsManagementPayloadCreateModel) => void | Promise<void>;
  onDelete: () => void;
  onCancel: () => void;
  loading: boolean;
  deleteLoading: boolean;
  selectedStep?: StepsManagementDataModel | null;
  childStepsData?: ChildStepsManagementDataModel[];
}

export default function StepsManagementForm({
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedStep,
  childStepsData,
}: StepsManagementFormProps) {
  const [form] = Form.useForm<StepsManagementPayloadCreateModel>();

  const childOptions = useMemo(
    () =>
      (childStepsData ?? []).map((child) => ({
        label: child.label,
        value: child.id,
      })),
    [childStepsData],
  );
  const hasChildOptions = childOptions.length > 0;

  useEffect(() => {
    if (!selectedStep) {
      form.resetFields();
      return;
    }

    form.setFieldsValue({
      label: selectedStep.label ?? "",
      child_ids:
        selectedStep.child_ids ??
        selectedStep.children?.map((child) => child.id) ??
        [],
    });
  }, [form, selectedStep]);

  const handleFinish = async (values: StepsManagementPayloadCreateModel) => {
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
          label="Nama Step"
          rules={[{ required: true, message: "Nama step wajib diisi" }]}
        >
          <Input placeholder="Contoh: Dokumen Awal" />
        </Form.Item>

        <Form.Item
          name="child_ids"
          label="Kategori Step"
          rules={[
            { required: true, message: "Pilih minimal 1 kategori" },
          ]}
          help={
            hasChildOptions
              ? undefined
              : "Buat kategori step terlebih dahulu agar bisa memilih."
          }
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="Pilih kategori step"
            options={childOptions}
            disabled={!hasChildOptions}
          />
        </Form.Item>

        <Space style={{ width: "100%", justifyContent: "flex-end" }}>
          <Button onClick={onCancel}>Batal</Button>
          <Button
            danger
            onClick={onDelete}
            disabled={!selectedStep}
            loading={deleteLoading}
          >
            Hapus
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            {selectedStep ? "Simpan Perubahan" : "Simpan"}
          </Button>
        </Space>
      </Form>
    </div>
  );
}
