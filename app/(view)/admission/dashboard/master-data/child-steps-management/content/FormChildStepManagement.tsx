import type {
  ChildStepsManagementDataModel,
  ChildStepsManagementPayloadCreateModel,
} from "@/app/models/child-steps-management";
import { Button, Form, Input, Popconfirm, Space } from "antd";
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
          label="Step Category Name"
          tooltip="Category name used to group registration steps."
          rules={[{ required: true, message: "Category name is required" }]}
        >
          <Input
            placeholder="Example: Preparation, Progress, Complete"
            style={{ height: 40, borderRadius: 10 }}
          />
        </Form.Item>

        <Space
          style={{
            width: "100%",
            justifyContent: "flex-end",
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid #f1f5f9",
          }}
        >
          {selectedChild && (
            <Button
              onClick={onCancel}
              style={{ borderRadius: 10, height: 38 }}
            >
              Cancel
            </Button>
          )}

          {selectedChild && (
            <Popconfirm
              title="Delete Step Category"
              description={`Are you sure you want to delete category "${selectedChild?.label}"?`}
              onConfirm={onDelete}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                loading={deleteLoading}
                style={{ borderRadius: 10, height: 38 }}
              >
                Delete
              </Button>
            </Popconfirm>
          )}

          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              background: "#1b3d6d",
              borderColor: "#1b3d6d",
              borderRadius: 10,
              height: 38,
              fontWeight: 600,
              boxShadow: "0 2px 6px rgba(27, 61, 109, 0.2)",
            }}
          >
            {selectedChild ? "Save Changes" : "Save Category"}
          </Button>
        </Space>
      </Form>
    </div>
  );
}

