import { Button, Form, Input, InputNumber, Select, Switch, Space } from "antd";
import type { QuestionPayloadCreateModel } from "@/app/models/question";

interface FormQuestionComponentProps {
  onSubmit: (values: QuestionPayloadCreateModel) => void | Promise<void>;
  initialValues?: Partial<QuestionPayloadCreateModel>;
  loading?: boolean;
  base_id?: string;
  submitLabel?: string;
}

const QUESTION_TYPES = [
  { value: "TEXT", label: "Text" },
  { value: "TEXTAREA", label: "Textarea" },
  { value: "NUMBER", label: "Number" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "DATE", label: "Date" },
  { value: "SELECT", label: "Select" },
  { value: "RADIO", label: "Radio" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "FILE", label: "File" },
];

export default function FormQuestionManagement(
  props: FormQuestionComponentProps,
) {
  const [form] = Form.useForm<QuestionPayloadCreateModel>();

  const handleFinish = async (values: QuestionPayloadCreateModel) => {
    const payload: QuestionPayloadCreateModel = {
      base_id: props.base_id ?? values.base_id,
      text: values.text?.trim() ?? "",
      input_type: values.input_type,
      required: values.required,
      order: values.order,
      help_text: values.help_text?.trim() || undefined,
      placeholder: values.placeholder?.trim() || undefined,
      min_length: values.min_length,
      max_length: values.max_length,
      active: values.active,
    };

    // Validasi min/max biar aman
    if (
      typeof payload.min_length === "number" &&
      typeof payload.max_length === "number" &&
      payload.min_length > payload.max_length
    ) {
      form.setFields([
        {
          name: "min_length",
          errors: ["Min length tidak boleh lebih besar dari Max length"],
        },
        { name: "max_length", errors: ["Max length harus >= Min length"] },
      ]);
      return;
    }

    await props.onSubmit(payload);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      initialValues={{
        base_id: props.base_id ?? props.initialValues?.base_id,
        text: props.initialValues?.text ?? "",
        input_type: props.initialValues?.input_type ?? undefined,
        required: props.initialValues?.required ?? false,
        order: props.initialValues?.order ?? 1,
        help_text: props.initialValues?.help_text ?? "",
        placeholder: props.initialValues?.placeholder ?? "",
        min_length: props.initialValues?.min_length ?? undefined,
        max_length: props.initialValues?.max_length ?? undefined,
        active: props.initialValues?.active ?? true,
      }}
      style={{ width: "100%" }}
    >
      {/* Base ID (opsional). Kalau kamu mau hidden, ubah jadi hidden */}
      <Form.Item
        label="Base ID"
        name="base_id"
        hidden={Boolean(props.base_id)}
        rules={[{ required: !props.base_id, message: "base_id wajib diisi" }]}
      >
        <Input placeholder="base_id" />
      </Form.Item>

      <Form.Item
        label="Question Text"
        name="text"
        rules={[{ required: true, message: "Text pertanyaan wajib diisi" }]}
      >
        <Input placeholder="Contoh: What is your full name?" />
      </Form.Item>

      <Form.Item
        label="Input Type"
        name="input_type"
        rules={[{ required: true, message: "Input type wajib dipilih" }]}
      >
        <Select
          placeholder="Pilih tipe input"
          options={QUESTION_TYPES}
          showSearch
          optionFilterProp="label"
        />
      </Form.Item>

      <Form.Item label="Help Text" name="help_text">
        <Input.TextArea
          rows={3}
          placeholder="Teks bantuan (opsional) untuk menjelaskan pertanyaan"
        />
      </Form.Item>

      <Form.Item label="Placeholder" name="placeholder">
        <Input placeholder="Placeholder input (opsional)" />
      </Form.Item>

      <Space size={16} wrap style={{ width: "100%" }}>
        <Form.Item
          label="Order"
          name="order"
          rules={[{ required: true, message: "Order wajib diisi" }]}
        >
          <InputNumber min={1} style={{ width: 160 }} />
        </Form.Item>

        <Form.Item label="Min Length" name="min_length">
          <InputNumber min={0} style={{ width: 160 }} />
        </Form.Item>

        <Form.Item label="Max Length" name="max_length">
          <InputNumber min={0} style={{ width: 160 }} />
        </Form.Item>
      </Space>

      <Space size={24} wrap>
        <Form.Item label="Required" name="required" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Active" name="active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Space>

      <Form.Item style={{ marginTop: 12 }}>
        <Button type="primary" htmlType="submit" loading={props.loading}>
          {props.submitLabel ?? "Simpan Perubahan"}
        </Button>
      </Form.Item>
    </Form>
  );
}
