import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Space,
  Divider,
  Alert,
} from "antd";
import type {
  QuestionDataModel,
  QuestionPayloadCreateModel,
  QuestionOptionItemDataModel,
} from "@/app/models/question";
import { useEffect, useMemo } from "react";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

interface FormQuestionComponentProps {
  onSubmit: (values: QuestionPayloadCreateModel) => Promise<QuestionDataModel>;
  initialValues?: Partial<QuestionPayloadCreateModel>;
  loading?: boolean;
  base_id?: string;
  submitLabel?: string;
  questionId?: string;
  initialOptions?: QuestionOptionItemDataModel[];
}

type QuestionOptionFormValue = {
  id?: string;
  label?: string;
  value?: string;
  order?: number;
  active?: boolean;
};

type QuestionFormValues = QuestionPayloadCreateModel & {
  options?: QuestionOptionFormValue[];
};

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
  const [form] = Form.useForm<QuestionFormValues>();
  const queryClient = useQueryClient();
  const inputType = Form.useWatch("input_type", form);

  const inputTypeKey = String(inputType ?? "").toUpperCase();
  const isOptionType = useMemo(
    () => ["SELECT", "RADIO", "CHECKBOX"].includes(inputTypeKey),
    [inputTypeKey],
  );
  const supportsPlaceholder = useMemo(
    () =>
      ["TEXT", "TEXTAREA", "NUMBER", "EMAIL", "PHONE"].includes(inputTypeKey),
    [inputTypeKey],
  );
  const supportsMinMaxLength = useMemo(
    () => ["TEXT", "TEXTAREA"].includes(inputTypeKey),
    [inputTypeKey],
  );

  useEffect(() => {
    if (!supportsPlaceholder) {
      form.setFieldValue("placeholder", "");
    }
    if (!supportsMinMaxLength) {
      form.setFieldValue("min_length", undefined);
      form.setFieldValue("max_length", undefined);
    }
    if (!isOptionType) {
      form.setFieldValue("options", []);
    }
  }, [form, isOptionType, supportsMinMaxLength, supportsPlaceholder]);

  const handleFinish = async (values: QuestionFormValues) => {
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

    if (isOptionType) {
      const options = (values.options ?? [])
        .map((opt, index) => ({
          id: opt.id,
          label: (opt.label ?? "").trim(),
          value: (opt.value ?? "").trim(),
          order: typeof opt.order === "number" ? opt.order : index + 1,
          active: opt.active ?? true,
        }))
        .filter((opt) => opt.label || opt.value);

      if (options.length === 0) {
        form.setFields([{ name: ["options"], errors: ["Minimal 1 option"] }]);
        return;
      }
      for (const opt of options) {
        if (!opt.label || !opt.value) {
          form.setFields([
            { name: ["options"], errors: ["Label & Value wajib diisi"] },
          ]);
          return;
        }
      }
    }

    const saved = await props.onSubmit(payload);

    // sync options for SELECT/RADIO/CHECKBOX
    if (isOptionType) {
      const questionId = props.questionId ?? saved.id;
      const submitted = (values.options ?? [])
        .map((opt, index) => ({
          id: opt.id,
          label: (opt.label ?? "").trim(),
          value: (opt.value ?? "").trim(),
          order: typeof opt.order === "number" ? opt.order : index + 1,
          active: opt.active ?? true,
        }))
        .filter((opt) => opt.label || opt.value);

      // fetch existing options from API to know deletions
      const existingRes = await api.get(
        `/api/question-options?question_id=${encodeURIComponent(questionId)}`,
      );
      const existing = (existingRes.data?.result ??
        existingRes.data) as QuestionOptionItemDataModel[];
      const existingById = new Map(
        existing.filter((o) => o.id).map((o) => [o.id, o]),
      );
      const submittedIds = new Set(
        submitted.filter((o) => o.id).map((o) => String(o.id)),
      );

      // delete removed options
      for (const opt of existing) {
        if (opt.id && !submittedIds.has(String(opt.id))) {
          await api.delete(`/api/question-options/${opt.id}`);
        }
      }

      // create/update submitted options
      for (const opt of submitted) {
        if (opt.id && existingById.has(String(opt.id))) {
          await api.put(`/api/question-options/${opt.id}`, {
            label: opt.label,
            value: opt.value,
            order: opt.order,
            active: opt.active,
            question_id: questionId,
          });
        } else {
          await api.post(`/api/question-options`, {
            question_id: questionId,
            label: opt.label,
            value: opt.value,
            order: opt.order,
            active: opt.active,
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ["question-options"] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    }
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
        options:
          props.initialOptions?.map((opt) => ({
            id: opt.id,
            label: opt.label,
            value: opt.value,
            order: opt.order,
            active: opt.active,
          })) ?? [],
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

      {supportsPlaceholder ? (
        <Form.Item label="Placeholder" name="placeholder">
          <Input placeholder="Placeholder input (opsional)" />
        </Form.Item>
      ) : null}

      <Space size={16} wrap style={{ width: "100%" }}>
        <Form.Item
          label="Order"
          name="order"
          rules={[{ required: true, message: "Order wajib diisi" }]}
        >
          <InputNumber min={1} style={{ width: 160 }} />
        </Form.Item>

        {supportsMinMaxLength ? (
          <>
            <Form.Item label="Min Length" name="min_length">
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>

            <Form.Item label="Max Length" name="max_length">
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>
          </>
        ) : null}
      </Space>

      {isOptionType ? (
        <>
          <Divider style={{ margin: "12px 0" }} />
          <Alert
            type="info"
            showIcon={false}
            message="Untuk tipe input Select/Radio/Checkbox, kamu perlu mengisi options."
          />

          <Form.List name={"options" as never}>
            {(fields, { add, remove }) => (
              <div style={{ marginTop: 12 }}>
                {fields.map((field) => (
                  <Space
                    key={field.key}
                    align="start"
                    style={{ display: "flex", marginBottom: 8 }}
                  >
                    <Form.Item name={[field.name, "id"]} hidden>
                      <Input />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, "label"]}
                      rules={[{ required: true, message: "Label wajib" }]}
                    >
                      <Input placeholder="Label" style={{ width: 180 }} />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, "value"]}
                      rules={[{ required: true, message: "Value wajib" }]}
                    >
                      <Input placeholder="Value" style={{ width: 180 }} />
                    </Form.Item>

                    <Form.Item name={[field.name, "order"]}>
                      <InputNumber
                        min={1}
                        placeholder="Order"
                        style={{ width: 120 }}
                      />
                    </Form.Item>

                    <Form.Item
                      name={[field.name, "active"]}
                      valuePropName="checked"
                      style={{ marginTop: 6 }}
                    >
                      <Switch />
                    </Form.Item>

                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  </Space>
                ))}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ active: true })}
                  block
                >
                  Add Option
                </Button>
              </div>
            )}
          </Form.List>
        </>
      ) : null}

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
