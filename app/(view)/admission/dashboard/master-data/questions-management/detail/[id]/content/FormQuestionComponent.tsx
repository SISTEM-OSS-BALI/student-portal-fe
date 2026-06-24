import {
  App,
  Button,
  Flex,
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
import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";

interface FormQuestionComponentProps {
  onSubmit: (values: QuestionPayloadCreateModel) => Promise<QuestionDataModel>;
  onSaved?: () => void;
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
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
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

    setSubmitting(true);
    try {
      const saved = await props.onSubmit(payload);

      // sync options for SELECT/RADIO/CHECKBOX
      if (isOptionType) {
        const questionId = props.questionId ?? saved.id;
        const submitted = (values.options ?? [])
          .map((opt, originalIndex) => ({
            originalIndex,
            id: opt.id,
            label: (opt.label ?? "").trim(),
            value: (opt.value ?? "").trim(),
            order: typeof opt.order === "number" ? opt.order : originalIndex + 1,
            active: opt.active ?? true,
          }))
          .filter((opt) => opt.label || opt.value);

        // fetch existing options from API to know deletions, and to fall
        // back-match by value when the form's local row has no id yet
        // (e.g. retrying after a previous create succeeded but the id was
        // never written back) — the DB enforces uniqueness on
        // (question_id, value), so blindly creating again would 1062.
        const existingRes = await api.get(
          `/api/question-options?question_id=${encodeURIComponent(questionId)}`,
        );
        const existing = (existingRes.data?.result ??
          existingRes.data) as QuestionOptionItemDataModel[];
        const existingById = new Map(
          existing.filter((o) => o.id).map((o) => [o.id, o]),
        );
        const existingByValue = new Map(
          existing.map((o) => [o.value.trim().toLowerCase(), o]),
        );

        const matchedExistingIds = new Set<string>();
        const resolved = submitted.map((opt) => {
          const byId = opt.id ? existingById.get(String(opt.id)) : undefined;
          const match =
            byId ?? existingByValue.get(opt.value.toLowerCase());
          if (match) matchedExistingIds.add(String(match.id));
          return { ...opt, existingMatch: match };
        });

        // delete options that are no longer present in the submitted list
        for (const opt of existing) {
          if (!matchedExistingIds.has(String(opt.id))) {
            await api.delete(`/api/question-options/${opt.id}`);
          }
        }

        // create/update submitted options, writing the real id back into
        // the form so a retry never re-creates an option that already
        // exists.
        for (const opt of resolved) {
          if (opt.existingMatch) {
            await api.put(`/api/question-options/${opt.existingMatch.id}`, {
              label: opt.label,
              value: opt.value,
              order: opt.order,
              active: opt.active,
              question_id: questionId,
            });
            form.setFieldValue(
              ["options", opt.originalIndex, "id"],
              opt.existingMatch.id,
            );
          } else {
            const createdRes = await api.post(`/api/question-options`, {
              question_id: questionId,
              label: opt.label,
              value: opt.value,
              order: opt.order,
              active: opt.active,
            });
            const created = (createdRes.data?.result ??
              createdRes.data) as QuestionOptionItemDataModel;
            if (created?.id) {
              form.setFieldValue(
                ["options", opt.originalIndex, "id"],
                created.id,
              );
            }
          }
        }

        queryClient.invalidateQueries({ queryKey: ["question-options"] });
        queryClient.invalidateQueries({ queryKey: ["questions"] });
      }

      // Only close/reset the parent's edit state once the question AND its
      // options have actually been persisted, instead of as soon as the
      // question's own scalar fields are saved.
      props.onSaved?.();
    } catch (error) {
      const backendMessage =
        (
          error as {
            response?: { data?: { error?: { message?: string } } };
          }
        )?.response?.data?.error?.message;
      notification.error({
        message: "Gagal menyimpan pertanyaan",
        description:
          backendMessage ||
          (error instanceof Error
            ? error.message
            : "Opsi yang baru ditambahkan mungkin belum tersimpan. Coba lagi."),
      });
    } finally {
      setSubmitting(false);
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
                  <div
                    key={field.key}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 12,
                    }}
                  >
                    <Form.Item name={[field.name, "id"]} hidden>
                      <Input />
                    </Form.Item>

                    <Space.Compact
                      block
                      style={{ marginBottom: 8 }}
                    >
                      <Form.Item
                        name={[field.name, "label"]}
                        rules={[{ required: true, message: "Label wajib" }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="Label" />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, "value"]}
                        rules={[{ required: true, message: "Value wajib" }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input placeholder="Value" />
                      </Form.Item>
                    </Space.Compact>

                    <Flex align="center" justify="space-between" gap={12} wrap>
                      <Flex align="center" gap={16} wrap>
                        <Form.Item
                          name={[field.name, "order"]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            min={1}
                            placeholder="Order"
                            style={{ width: 100 }}
                          />
                        </Form.Item>

                        <Form.Item
                          name={[field.name, "active"]}
                          valuePropName="checked"
                          label="Active"
                          style={{ marginBottom: 0 }}
                        >
                          <Switch />
                        </Form.Item>
                      </Flex>

                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(field.name)}
                      />
                    </Flex>
                  </div>
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
        <Button
          type="primary"
          htmlType="submit"
          loading={props.loading || submitting}
        >
          {props.submitLabel ?? "Simpan Perubahan"}
        </Button>
      </Form.Item>
    </Form>
  );
}
