import { useEffect } from "react";
import { useCountriesManagement } from "@/app/hooks/use-country-management";
import { QuestionBasePayloadCreateModel } from "@/app/models/question";
import { Button, Form, Input, InputNumber, Select, Switch } from "antd";

const { TextArea } = Input;

interface FormCreateBaseQuestionComponentProps {
  onFinish: (values: QuestionBasePayloadCreateModel) => void;
  initialValues?: QuestionBasePayloadCreateModel;
  submitLabel?: string;
  loading?: boolean;
  onCancel?: () => void;
}

export default function FormCreateBaseQuestionComponent({
  onFinish,
  initialValues,
  submitLabel = "Simpan Kelompok Formulir",
  loading = false,
  onCancel,
}: FormCreateBaseQuestionComponentProps) {
  const [form] = Form.useForm<QuestionBasePayloadCreateModel>();
  const { data: countryData, fetchLoading: countryLoading } =
    useCountriesManagement({});

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [form, initialValues]);

  const countryOptions =
    countryData?.map((country) => ({
      label: country.name,
      value: country.id,
    })) ?? [];

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={initialValues}
    >
      <Form.Item
        label="Group Name"
        tooltip="Nama kelompok atau judul kategori formulir kuesioner."
        name="name"
        rules={[{ required: true, message: "Field is required" }]}
      >
        <Input
          placeholder="e.g. Undergraduate German Application Form"
          style={{ borderRadius: 8, height: 38, fontSize: 13.5 }}
        />
      </Form.Item>

      <Form.Item
        label="Description"
        tooltip="Deskripsi atau panduan umum pengisian formulir ini."
        name="desc"
      >
        <TextArea
          placeholder="Tuliskan deskripsi atau panduan umum pengisian formulir ini..."
          rows={3}
          style={{ borderRadius: 8, fontSize: 13.5 }}
        />
      </Form.Item>

      <Form.Item
        label="Destination Country"
        tooltip="Negara tujuan studi yang menggunakan formulir ini."
        name="country_id"
        rules={[{ required: true, message: "Field is required" }]}
      >
        <Select
          placeholder="Select country"
          options={countryOptions}
          showSearch
          optionFilterProp="label"
          loading={countryLoading}
          style={{ height: 38 }}
          onChange={(_, option) => {
            const selectedLabel = Array.isArray(option)
              ? option[0]?.label
              : option?.label;
            form.setFieldsValue({
              type_country:
                typeof selectedLabel === "string" ? selectedLabel : undefined,
            });
          }}
        />
      </Form.Item>

      <Form.Item
        name="type_country"
        hidden
        rules={[{ required: true, message: "Type is required." }]}
      >
        <Input />
      </Form.Item>

      <div
        style={{
          background: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 20,
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Form.Item
            name="allow_multiple_submissions"
            valuePropName="checked"
            noStyle
          >
            <Switch />
          </Form.Item>
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: "#1e293b",
              userSelect: "none",
            }}
          >
            Allow Multiple Submissions
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Form.Item name="active" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
          <span
            style={{
              fontWeight: 600,
              fontSize: 13,
              color: "#1e293b",
              userSelect: "none",
            }}
          >
            Active
          </span>
        </div>
      </div>

      <Form.Item
        label="Form Version"
        tooltip="Versi formulir untuk kebutuhan penomoran rilis."
        name="version"
      >
        <InputNumber
          min={1}
          style={{ width: "100%", borderRadius: 8, height: 38, fontSize: 13.5 }}
        />
      </Form.Item>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: 12,
          marginTop: 24,
          paddingTop: 16,
          borderTop: "1px solid #e2e8f0",
        }}
      >
        {onCancel && (
          <Button
            onClick={onCancel}
            style={{ borderRadius: 8, height: 38, padding: "0 18px", fontSize: 13.5, fontWeight: 600 }}
          >
            Cancel
          </Button>
        )}
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          style={{
            borderRadius: 8,
            height: 38,
            padding: "0 22px",
            background: "#1b3d6d",
            fontWeight: 600,
            fontSize: 13.5,
          }}
        >
          {submitLabel}
        </Button>
      </div>
    </Form>
  );
}
