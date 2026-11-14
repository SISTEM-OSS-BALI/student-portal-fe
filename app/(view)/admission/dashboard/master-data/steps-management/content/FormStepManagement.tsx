import type { ChildStepsManagementDataModel } from "@/app/models/child-steps-management";
import type {
  StepsManagementDataModel,
  StepsManagementPayloadCreateModel,
} from "@/app/models/steps-management";
import { Button, Form, Input, Popconfirm, Select, Space } from "antd";
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
      [...(childStepsData ?? [])]
        .sort((a, b) =>
          (a.label ?? "").localeCompare(b.label ?? "", undefined, {
            sensitivity: "base",
            numeric: true,
          }),
        )
        .map((child) => ({
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
          label="Step Name"
          tooltip="Main admission stage name."
          rules={[{ required: true, message: "Step name is required" }]}
        >
          <Input
            placeholder="Example: Preparation, In Progress, Completed"
            style={{ height: 40, borderRadius: 10 }}
          />
        </Form.Item>

        <Form.Item
          name="child_ids"
          label="Step Sub-Items"
          tooltip="Sub-step categories linked to this stage."
          rules={[{ required: true, message: "Please select at least 1 sub-step" }]}
          extra={
            <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
              The items above are managed in{" "}
              <a
                href="/admission/dashboard/master-data/child-steps-management"
                target="_blank"
                rel="noreferrer"
                style={{ color: "#1d4ed8", fontWeight: 600 }}
              >
                Step Categories
              </a>
              . If the desired item is not in the list, please create it there first.
            </div>
          }
        >
          <Select
            mode="multiple"
            allowClear
            placeholder="Select sub-step items for this stage"
            options={childOptions}
            disabled={!hasChildOptions}
            filterOption={(input, option) =>
              String(option?.label ?? "")
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            size="large"
            style={{ width: "100%", borderRadius: 10 }}
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
          {selectedStep && (
            <Button
              onClick={onCancel}
              style={{ borderRadius: 10, height: 38 }}
            >
              Cancel
            </Button>
          )}

          {selectedStep && (
            <Popconfirm
              title="Delete Step"
              description={`Are you sure you want to delete step "${selectedStep?.label}"?`}
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
            {selectedStep ? "Save Changes" : "Save Step"}
          </Button>
        </Space>
      </Form>
    </div>
  );
}

