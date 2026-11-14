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
  Modal,
  Tooltip,
} from "antd";
import type {
  QuestionDataModel,
  QuestionPayloadCreateModel,
  QuestionOptionItemDataModel,
} from "@/app/models/question";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import {
  DeleteOutlined,
  PlusOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";

type QuestionOptionFormValue = {
  id?: string;
  label?: string;
  value?: string;
  order?: number;
  active?: boolean;
};

type QuestionFormValues = QuestionPayloadCreateModel & {
  options?: QuestionOptionFormValue[];
  date_constraint?: string;
};

interface FormQuestionComponentProps {
  onSubmit: (values: QuestionPayloadCreateModel) => Promise<QuestionDataModel>;
  onSaved?: (savedQuestion?: QuestionDataModel) => void;
  initialValues?: Partial<QuestionFormValues>;
  loading?: boolean;
  base_id?: string;
  submitLabel?: string;
  questionId?: string;
  initialOptions?: QuestionOptionItemDataModel[];
  onCancel?: () => void;
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
  const [form] = Form.useForm<QuestionFormValues>();
  const { notification } = App.useApp();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const inputType = Form.useWatch("input_type", form);

  const handleBulkAddApply = () => {
    if (!bulkText.trim()) {
      setBulkModalOpen(false);
      return;
    }

    const lines = bulkText
      .split(/[\n,]+/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setBulkModalOpen(false);
      return;
    }

    const currentOptions = form.getFieldValue("options") ?? [];
    const existingValues = new Set(
      currentOptions.map((o: QuestionOptionFormValue) =>
        (o.value || o.label || "").trim().toLowerCase(),
      ),
    );

    const added: QuestionOptionFormValue[] = [];
    let nextOrder = currentOptions.length + 1;

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (!existingValues.has(lower)) {
        existingValues.add(lower);
        added.push({
          label: line,
          value: line,
          order: nextOrder++,
          active: true,
        });
      }
    }

    if (added.length === 0) {
      notification.info({
        message: "Tidak Ada Pilihan Baru",
        description:
          "Seluruh teks yang dimasukkan sudah ada di dalam daftar pilihan.",
      });
    } else {
      form.setFieldValue("options", [...currentOptions, ...added]);
      notification.success({
        message: "Pilihan Berhasil Ditambahkan",
        description: `Berhasil menambahkan ${added.length} pilihan baru ke dalam daftar.`,
      });
    }

    setBulkText("");
    setBulkModalOpen(false);
  };

  const handleReorderSequential = () => {
    const current = form.getFieldValue("options") ?? [];
    if (!current || current.length === 0) return;
    const reordered = current.map((opt: QuestionOptionFormValue, idx: number) => ({
      ...opt,
      order: idx + 1,
    }));
    form.setFieldValue("options", reordered);
    notification.success({
      message: "Urutan Berhasil Dirapikan",
      description: "Nomor urut seluruh opsi telah diselaraskan dari 1 secara berurutan.",
    });
  };

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

  // Sinkronisasi opsi pilihan ketika props.initialOptions atau questionId berubah
  useEffect(() => {
    if (props.initialOptions && props.initialOptions.length > 0) {
      form.setFieldValue(
        "options",
        props.initialOptions.map((opt, idx) => ({
          id: opt.id,
          label: opt.label,
          value: opt.value,
          order: typeof opt.order === "number" ? opt.order : idx + 1,
          active: opt.active ?? true,
        })),
      );
    } else if (props.questionId && isOptionType) {
      api
        .get(
          `/api/question-options?question_id=${encodeURIComponent(props.questionId)}`,
        )
        .then((res) => {
          const list = (res.data?.result ?? res.data) as QuestionOptionItemDataModel[];
          if (Array.isArray(list) && list.length > 0) {
            form.setFieldValue(
              "options",
              list.map((opt, idx) => ({
                id: opt.id,
                label: opt.label,
                value: opt.value,
                order: typeof opt.order === "number" ? opt.order : idx + 1,
                active: opt.active ?? true,
              })),
            );
          }
        })
        .catch(() => {});
    }
  }, [props.initialOptions, props.questionId, isOptionType, form]);

  const handleFinish = async (values: QuestionFormValues) => {
    let placeholderValue = values.placeholder?.trim() || undefined;
    if (inputTypeKey === "DATE") {
      const constraint = values.date_constraint || "DEFAULT";
      if (constraint && constraint !== "DEFAULT") {
        placeholderValue = `CONSTRAINT:${constraint}`;
      } else if (placeholderValue?.startsWith("CONSTRAINT:")) {
        placeholderValue = undefined;
      }
    }

    const payload: QuestionPayloadCreateModel = {
      base_id: props.base_id ?? values.base_id,
      text: values.text?.trim() ?? "",
      input_type: values.input_type,
      required: values.required,
      order: values.order,
      help_text: values.help_text?.trim() || undefined,
      placeholder: placeholderValue,
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
          errors: ["Batas minimum karakter tidak boleh lebih besar dari batas maksimum"],
        },
        { name: "max_length", errors: ["Batas maksimum harus lebih besar atau sama dengan batas minimum"] },
      ]);
      return;
    }

    if (isOptionType) {
      const rawOptions = (values.options ?? [])
        .map((opt, index) => {
          const label = (opt.label ?? "").trim();
          let value = (opt.value ?? "").trim();
          if (!value && label) {
            value = label;
          }
          return {
            id: opt.id,
            label,
            value,
            order: typeof opt.order === "number" ? opt.order : index + 1,
            active: opt.active ?? true,
          };
        })
        .filter((opt) => opt.label || opt.value);

      if (rawOptions.length === 0) {
        notification.warning({
          message: "Pilihan Jawaban Diperlukan",
          description:
            "Pertanyaan bertipe pilihan (Select, Radio, Checkbox) wajib memiliki minimal satu opsi pilihan.",
        });
        return;
      }

      // Validasi duplikasi nilai opsi
      const seenValues = new Map<string, string>();
      for (const opt of rawOptions) {
        const key = opt.value.toLowerCase();
        if (seenValues.has(key)) {
          notification.error({
            message: "Terdapat Duplikasi Pilihan",
            description: `Pilihan '${opt.value}' terdaftar lebih dari satu kali. Setiap pilihan opsi harus memiliki teks/nilai yang unik.`,
          });
          return;
        }
        seenValues.set(key, opt.label);
      }
    }

    setSubmitting(true);
    try {
      const saved = await props.onSubmit(payload);

      // sync options for SELECT/RADIO/CHECKBOX
      if (isOptionType) {
        const questionId = props.questionId ?? saved.id;
        const submitted = (values.options ?? [])
          .map((opt, originalIndex) => {
            const label = (opt.label ?? "").trim();
            let value = (opt.value ?? "").trim();
            if (!value && label) {
              value = label;
            }
            return {
              originalIndex,
              id: opt.id,
              label,
              value,
              order: typeof opt.order === "number" ? opt.order : originalIndex + 1,
              active: opt.active ?? true,
            };
          })
          .filter((opt) => opt.label || opt.value);

        // 1. Prioritaskan Batch Sync (1 request, transaksional aman & cepat)
        let syncSuccess = false;
        try {
          const syncRes = await api.put(
            `/api/question-options/sync/${encodeURIComponent(questionId)}`,
            {
              options: submitted.map((opt) => ({
                id: opt.id || undefined,
                label: opt.label,
                value: opt.value,
                order: opt.order,
                active: opt.active,
              })),
            },
          );
          const syncResult = (syncRes.data?.result ??
            syncRes.data) as QuestionOptionItemDataModel[];
          if (Array.isArray(syncResult)) {
            saved.options = syncResult;
            syncSuccess = true;
          }
        } catch {
          syncSuccess = false;
        }

        // 2. Fallback jika endpoint batch sync tidak tersedia
        if (!syncSuccess) {
          const existingRes = await api.get(
            `/api/question-options?question_id=${encodeURIComponent(questionId)}`,
          );
          const existing = (existingRes.data?.result ??
            existingRes.data) as QuestionOptionItemDataModel[];
          const existingById = new Map(
            existing.filter((o) => o.id).map((o) => [String(o.id), o]),
          );
          const existingByValue = new Map(
            existing.map((o) => [o.value.trim().toLowerCase(), o]),
          );

          const matchedExistingIds = new Set<string>();
          const resolved = submitted.map((opt) => {
            const byId = opt.id ? existingById.get(String(opt.id)) : undefined;
            const match =
              byId ?? existingByValue.get(opt.value.trim().toLowerCase());
            if (match) matchedExistingIds.add(String(match.id));
            return { ...opt, existingMatch: match };
          });

          // Delete options not in submitted list
          for (const opt of existing) {
            if (!matchedExistingIds.has(String(opt.id))) {
              try {
                await api.delete(`/api/question-options/${opt.id}`);
              } catch {
                // Ignore restriction errors
              }
            }
          }

          // Create/update submitted options
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
        }

        queryClient.invalidateQueries({ queryKey: ["question-options"] });
        queryClient.invalidateQueries({ queryKey: ["questions"] });

        try {
          const freshRes = await api.get(
            `/api/question-options?question_id=${encodeURIComponent(questionId)}`,
          );
          const fresh = (freshRes.data?.result ?? freshRes.data) as QuestionOptionItemDataModel[];
          if (Array.isArray(fresh)) {
            saved.options = fresh;
          }
        } catch {
          // ignore
        }
      }

      // Transition to edit mode with the saved question and options
      props.onSaved?.(saved);
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
        placeholder:
          props.initialValues?.placeholder?.startsWith("CONSTRAINT:")
            ? ""
            : props.initialValues?.placeholder ?? "",
        date_constraint:
          props.initialValues?.placeholder?.startsWith("CONSTRAINT:")
            ? props.initialValues.placeholder.replace("CONSTRAINT:", "")
            : "DEFAULT",
        min_length: props.initialValues?.min_length ?? undefined,
        max_length: props.initialValues?.max_length ?? undefined,
        active: props.initialValues?.active ?? true,
        options:
          props.initialOptions?.map((opt, idx) => ({
            id: opt.id,
            label: opt.label,
            value: opt.value,
            order: typeof opt.order === "number" ? opt.order : idx + 1,
            active: opt.active ?? true,
          })) ?? [],
      }}
      style={{ width: "100%" }}
    >
      {/* Base ID (opsional). Kalau kamu mau hidden, ubah jadi hidden */}
      <Form.Item
        label="Base ID"
        name="base_id"
        hidden={Boolean(props.base_id)}
        rules={[{ required: !props.base_id, message: "ID kelompok formulir wajib diisi" }]}
      >
        <Input placeholder="base_id" />
      </Form.Item>

      <Form.Item
        label="Question Text"
        tooltip="Teks pertanyaan resmi yang akan diajukan kepada siswa."
        name="text"
        rules={[{ required: true, message: "Field is required" }]}
      >
        <Input placeholder="e.g. Relationship, Emergency Contact Phone Number" />
      </Form.Item>

      <Form.Item
        label="Input Type"
        tooltip="Format dan jenis kolom isian data untuk jawaban siswa."
        name="input_type"
        rules={[{ required: true, message: "Field is required" }]}
      >
        <Select
          placeholder="Select input type"
          options={QUESTION_TYPES}
          showSearch
          optionFilterProp="label"
        />
      </Form.Item>

      {inputTypeKey === "DATE" ? (
        <Form.Item
          label="Date Constraint"
          tooltip="Aturan batasan kalender untuk memvalidasi tanggal yang dapat dipilih siswa."
          name="date_constraint"
        >
          <Select
            placeholder="Select date constraint"
            options={[
              {
                value: "DEFAULT",
                label: "Otomatis / Default (Sesuai peran pertanyaan)",
              },
              {
                value: "PAST_ONLY",
                label: "Maksimal Hari Ini (Past Only - misal Tanggal Lahir)",
              },
              {
                value: "FUTURE_ONLY",
                label: "Minimal Hari Ini (Future Only - misal Masa Berlaku Paspor)",
              },
              {
                value: "AFTER_START_DATE",
                label: "Harus Setelah Tanggal Mulai (Must be After Start Date)",
              },
              {
                value: "NONE",
                label: "Bebas / Tanpa Batasan (No Restriction)",
              },
            ]}
          />
        </Form.Item>
      ) : null}

      <Form.Item
        label="Help Text"
        tooltip="Petunjuk atau deskripsi bantuan dalam Bahasa Indonesia yang tampil pada tooltip formulir siswa."
        name="help_text"
      >
        <Input.TextArea
          rows={3}
          placeholder="Tuliskan petunjuk atau catatan pengisian dalam Bahasa Indonesia (contoh: Hubungan kekerabatan dengan siswa)..."
        />
      </Form.Item>

      {supportsPlaceholder ? (
        <Form.Item
          label="Placeholder"
          tooltip="Contoh teks petunjuk di dalam kotak isian sebelum mulai diketik."
          name="placeholder"
        >
          <Input placeholder="e.g. Contoh teks placeholder di dalam kotak isian..." />
        </Form.Item>
      ) : null}

      <Space size={16} wrap style={{ width: "100%" }}>
        <Form.Item
          label="Display Order"
          tooltip="Nomor urutan tampilan pertanyaan pada formulir. Nomor otomatis disesuaikan secara berurutan tanpa duplikasi."
          name="order"
          rules={[{ required: true, message: "Field is required" }]}
        >
          <InputNumber min={1} style={{ width: 160 }} />
        </Form.Item>

        {supportsMinMaxLength ? (
          <>
            <Form.Item
              label="Minimum Characters"
              tooltip="Batas minimum jumlah karakter yang wajib diisi oleh siswa."
              name="min_length"
            >
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>

            <Form.Item
              label="Maximum Characters"
              tooltip="Batas maksimum jumlah karakter yang dapat diisi oleh siswa."
              name="max_length"
            >
              <InputNumber min={0} style={{ width: 160 }} />
            </Form.Item>
          </>
        ) : null}
      </Space>

      {isOptionType ? (
        <>
          <Divider style={{ margin: "16px 0 12px" }} />
          <Flex align="center" justify="space-between" wrap gap={8} style={{ marginBottom: 10 }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#1e293b" }}>
                Pilihan Jawaban (Options)
              </span>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Atur daftar pilihan opsi. Nilai tersimpan otomatis mengikuti label jika dikosongkan.
              </div>
            </div>
            <Flex gap={8} wrap>
              <Button
                size="small"
                icon={<SortAscendingOutlined />}
                onClick={handleReorderSequential}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Rapikan Urutan
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<UnorderedListOutlined />}
                onClick={() => setBulkModalOpen(true)}
                style={{
                  borderRadius: 6,
                  fontSize: 12,
                  background: "#1b3d6d",
                  borderColor: "#1b3d6d",
                }}
              >
                Tambah Banyak Sekaligus
              </Button>
            </Flex>
          </Flex>

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
                      background: "#fafbfc",
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
                        rules={[{ required: true, message: "Label opsi wajib diisi" }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <Input
                          placeholder="Label Tampilan (contoh: Saudara Kandung)"
                          onChange={(e) => {
                            const newLabel = e.target.value;
                            const currentVal = form.getFieldValue([
                              "options",
                              field.name,
                              "value",
                            ]);
                            if (!currentVal || currentVal.trim() === "") {
                              form.setFieldValue(
                                ["options", field.name, "value"],
                                newLabel,
                              );
                            }
                          }}
                        />
                      </Form.Item>

                      <Form.Item
                        name={[field.name, "value"]}
                        style={{ flex: 1, marginBottom: 0 }}
                        tooltip="Nilai yang disimpan di sistem. Otomatis mengikuti label jika dikosongkan."
                      >
                        <Input placeholder="Nilai (otomatis mengikuti label)" />
                      </Form.Item>
                    </Space.Compact>

                    <Flex align="center" justify="space-between" gap={12} wrap>
                      <Flex align="center" gap={16} wrap>
                        <Form.Item
                          name={[field.name, "order"]}
                          style={{ marginBottom: 0 }}
                          label="Urutan"
                        >
                          <InputNumber
                            min={1}
                            placeholder="Order"
                            style={{ width: 90 }}
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

                <Flex gap={10} style={{ marginTop: 8 }}>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() =>
                      add({
                        active: true,
                        order: fields.length + 1,
                      })
                    }
                    style={{ flex: 1, height: 38, borderRadius: 8 }}
                  >
                    Tambah Satu Opsi (+ Add Option)
                  </Button>
                  <Button
                    icon={<UnorderedListOutlined />}
                    onClick={() => setBulkModalOpen(true)}
                    style={{ height: 38, borderRadius: 8 }}
                  >
                    Tambah Banyak Sekaligus
                  </Button>
                </Flex>
              </div>
            )}
          </Form.List>
        </>
      ) : null}

      <Space size={24} wrap>
        <Form.Item
          label="Required"
          tooltip="Tandai jika pertanyaan ini wajib diisi oleh siswa."
          name="required"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Active"
          tooltip="Status keaktifan pertanyaan agar tampil pada formulir siswa."
          name="active"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      </Space>

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
        {props.onCancel && props.questionId && (
          <Button
            onClick={props.onCancel}
            style={{ borderRadius: 10, height: 40, padding: "0 20px" }}
          >
            Cancel
          </Button>
        )}
        <Button
          type="primary"
          htmlType="submit"
          loading={props.loading || submitting}
          style={{
            borderRadius: 10,
            height: 40,
            padding: "0 24px",
            background: "#1b3d6d",
            fontWeight: 600,
          }}
        >
          {props.submitLabel ?? (props.questionId ? "Save Changes" : "Save Question")}
        </Button>
      </div>

      <Modal
        title="Tambah Banyak Pilihan Sekaligus (Bulk Add)"
        open={bulkModalOpen}
        onCancel={() => setBulkModalOpen(false)}
        onOk={handleBulkAddApply}
        okText="Terapkan ke Formulir"
        cancelText="Batal"
        okButtonProps={{ style: { background: "#1b3d6d", borderRadius: 8 } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
      >
        <p style={{ color: "#64748b", fontSize: 13, marginBottom: 12 }}>
          Tempel atau ketik daftar pilihan opsi. Anda dapat memisahkan setiap opsi dengan baris baru (Enter) atau tanda koma (,). Nilai opsi akan otomatis diselaraskan.
        </p>
        <Input.TextArea
          rows={8}
          placeholder={"Contoh:\nAyah\nIbu\nSaudara Kandung\nSaudara Tiri\nSepupu\nWali\nKerabat Lainnya"}
          value={bulkText}
          onChange={(e) => setBulkText(e.target.value)}
          style={{ borderRadius: 8, fontSize: 13 }}
        />
      </Modal>
    </Form>
  );
}
