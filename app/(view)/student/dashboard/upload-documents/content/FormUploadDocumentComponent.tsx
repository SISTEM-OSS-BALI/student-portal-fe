"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Checkbox,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Tabs,
  Upload,
  Typography,
  Tag,
  Divider,
  Button,
  notification,
} from "antd";
import { FileTextOutlined, LinkOutlined, UploadOutlined } from "@ant-design/icons";
import type { UploadProps } from "antd";
import { useAuth } from "@/app/utils/use-auth";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import { useQuestions } from "@/app/hooks/use-questions";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useUser } from "@/app/hooks/use-users";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import type {
  AnswerDocumentPayloadCreateModel,
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";

const { TextArea } = Input;
const { Text, Title } = Typography;

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

const getFileExt = (name: string) => {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
};

const resolveAccept = (fileType?: string) => {
  if (!fileType) return undefined;
  const normalized = fileType.toLowerCase();
  if (normalized.includes("pdf")) return ".pdf";
  if (normalized.includes("image") || normalized.includes("jpg") || normalized.includes("png")) {
    return "image/*";
  }
  if (normalized.includes("doc")) return ".doc,.docx";
  return undefined;
};

const resolveFileTypeLabel = (fileType?: string) => {
  if (!fileType) return "Semua tipe file";
  return fileType;
};

const normalizeUpload: UploadProps["getValueFromEvent"] = (e) => {
  if (Array.isArray(e)) return e;
  return e?.fileList ?? [];
};

const buildAutoFileName = (
  pattern: string | undefined,
  file: File,
  context: {
    student_name?: string;
    document_label?: string;
    internal_code?: string;
    country_name?: string;
  },
) => {
  if (!pattern) {
    return sanitizeFileName(file.name);
  }

  const ext = getFileExt(file.name);
  let next = pattern;
  next = next.replaceAll("{studentName}", context.student_name ?? "student");
  next = next.replaceAll("{documentLabel}", context.document_label ?? "document");
  next = next.replaceAll("{internalCode}", context.internal_code ?? "DOC");
  next = next.replaceAll("{country}", context.country_name ?? "country");
  next = next.replaceAll("{ext}", ext.replace(".", ""));
  if (ext && !next.toLowerCase().endsWith(ext.toLowerCase())) {
    next = `${next}${ext}`;
  }
  return sanitizeFileName(next);
};

const renderQuestionField = (question: QuestionDataModel) => {
  const options =
    question.options?.map((option) => ({
      label: option.label,
      value: option.id ?? option.value,
    })) ?? [];

  switch (question.input_type) {
    case "TEXTAREA":
      return <TextArea rows={4} placeholder={question.placeholder ?? ""} />;
    case "NUMBER":
      return <InputNumber style={{ width: "100%" }} />;
    case "EMAIL":
      return <Input type="email" placeholder={question.placeholder ?? ""} />;
    case "PHONE":
      return <Input placeholder={question.placeholder ?? ""} />;
    case "DATE":
      return <DatePicker style={{ width: "100%" }} />;
    case "SELECT":
      return (
        <Select
          placeholder={question.placeholder ?? "Select option"}
          options={options}
        />
      );
    case "RADIO":
      return <Radio.Group options={options} />;
    case "CHECKBOX":
      return <Checkbox.Group options={options} />;
    case "FILE":
      return (
        <Upload beforeUpload={() => false}>
          <Input placeholder="Upload file" readOnly />
        </Upload>
      );
    case "TEXT":
    default:
      return <Input placeholder={question.placeholder ?? ""} />;
  }
};

export default function FormUploadDocumentComponent() {
  const [docForm] = Form.useForm();
  const [submittingSection, setSubmittingSection] = useState<string | null>(null);
  const { data: bases, fetchLoading: basesLoading } = useQuestionBases({});
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const { user_id } = useAuth();
  const { data: currentUser } = useUser({ id: user_id });
  const { data: stages } = useStagesManagement({});
  const { uploadDocument } = useDocumentUpload();
  const { data: answerQuestions } = useAnswerQuestions({
    queryString: currentUser?.id ? `applicant_id=${currentUser.id}` : undefined,
    enabled: Boolean(currentUser?.id),
    withNotification: false,
  });
  const {
    onCreate: createAnswerQuestion,
    onCreateLoading: creatingAnswerQuestion,
    onUpdate: updateAnswerQuestion,
    onUpdateLoading: updatingAnswerQuestion,
  } = useAnswerQuestions({ enabled: false, withNotification: false });
  const { onCreate: submitDocuments, onCreateLoading: submittingDocuments } =
    useAnswerDocuments({ enabled: false });

  useEffect(() => {
    if (!activeTab && bases?.length) {
      setActiveTab(bases[0].id);
    }
  }, [activeTab, bases]);

  const resolvedBaseId = useMemo(() => {
    if (!bases?.length) return undefined;
    const baseIds = new Set(bases.map((base) => base.id));
    return activeTab && baseIds.has(activeTab) ? activeTab : bases[0].id;
  }, [activeTab, bases]);

  const { data: questions, fetchLoading: questionsLoading } = useQuestions({
    queryString: resolvedBaseId ? `base_id=${resolvedBaseId}` : undefined,
  });

  const countryDocuments = useMemo(() => {
    const countryId = currentUser?.stage?.country_id;
    if (!countryId) return [];
    const docs = (stages ?? [])
      .filter((stage) => stage.country_id === countryId)
      .map((stage) => stage.document)
      .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));

    const unique = new Map(docs.map((doc) => [doc.id, doc]));
    return Array.from(unique.values());
  }, [stages, currentUser]);

  const documentMap = useMemo(() => {
    return new Map(countryDocuments.map((doc) => [String(doc.id), doc]));
  }, [countryDocuments]);

  const answerByQuestionId = useMemo(() => {
    const map = new Map<string, AnswerQuestionDataModel>();
    (answerQuestions ?? []).forEach((answer) => {
      if (!answer?.question_id) return;
      const existing = map.get(answer.question_id);
      if (!existing) {
        map.set(answer.question_id, answer);
        return;
      }
      const existingTime = Date.parse(existing.created_at);
      const nextTime = Date.parse(answer.created_at);
      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        map.set(answer.question_id, answer);
      }
    });
    return map;
  }, [answerQuestions]);

  const normalizeAnswerText = (value: unknown) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "object") {
      const maybeDate = value as { toISOString?: () => string };
      if (typeof maybeDate.toISOString === "function") {
        return maybeDate.toISOString();
      }
    }
    return String(value);
  };

  const handleSubmitDocuments = async (values: any) => {
    const documents = values?.documents ?? {};
    const pendingDocs: string[] = [];
    const payload: AnswerDocumentPayloadCreateModel[] = [];

    Object.entries(documents).forEach(([document_id, fileList]) => {
      const file = Array.isArray(fileList) ? fileList[0] : undefined;
      if (!file) return;
      const response = file?.response as
        | { url?: string; path?: string }
        | undefined;
      if (file?.status !== "done" || !response?.url) {
        const label = documentMap.get(String(document_id))?.label;
        pendingDocs.push(label ?? String(document_id));
        return;
      }
      payload.push({
        document_id: String(document_id),
        student_id: currentUser?.id,
        file_name: file?.name,
        file_url: response?.url ?? "",
        file_path: response?.path,
        file_type: file?.type,
        status: file?.status,
      });
    });

    if (pendingDocs.length > 0) {
      notification.error({
        message: "Upload belum selesai",
        description: `Dokumen berikut belum selesai diunggah: ${pendingDocs.join(
          ", ",
        )}`,
      });
      return;
    }

    if (!payload.length) {
      notification.error({
        message: "Dokumen belum dipilih",
        description: "Silakan unggah dokumen sebelum submit.",
      });
      return;
    }

    try {
      await submitDocuments(payload);
      notification.success({
        message: "Dokumen disubmit",
        description: "File yang sudah diunggah siap diproses.",
      });
    } catch (error) {
      notification.error({
        message: "Gagal submit dokumen",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    }
  };

  const handleSubmitAnswers = async (
    baseId: string,
    baseQuestions: QuestionDataModel[],
    values: Record<string, unknown>,
  ) => {
    if (!currentUser?.id) {
      notification.error({
        message: "Pengguna tidak ditemukan",
        description: "Silakan login ulang sebelum mengirim jawaban.",
      });
      return;
    }

    setSubmittingSection(baseId);
    try {
      const tasks = baseQuestions.map(async (question) => {
        const rawValue = values?.[question.id];
        const isOptionType = ["SELECT", "RADIO", "CHECKBOX"].includes(
          question.input_type,
        );
        let payload: {
          answer_text?: string;
          selected_option_ids?: string[];
        } | null = null;

        if (isOptionType) {
          const selected = Array.isArray(rawValue)
            ? rawValue.filter(Boolean)
            : rawValue
              ? [rawValue]
              : [];
          const selectedIds = selected.map((value) => String(value));
          if (!selectedIds.length && !question.required) {
            return null;
          }
          payload = { selected_option_ids: selectedIds };
        } else {
          const answerText = normalizeAnswerText(rawValue);
          if (!answerText && !question.required) {
            return null;
          }
          payload = { answer_text: answerText ?? "" };
        }

        const existing = answerByQuestionId.get(question.id);
        if (existing) {
          return updateAnswerQuestion({
            id: existing.id,
            payload,
          });
        }
        return createAnswerQuestion({
          question_id: question.id,
          student_id: currentUser.id,
          ...payload,
        });
      });

      const results = await Promise.all(tasks);
      const submitted = results.filter(Boolean).length;

      notification.success({
        message: "Jawaban disubmit",
        description: submitted
          ? `Sebanyak ${submitted} jawaban berhasil dikirim.`
          : "Tidak ada jawaban yang dikirim.",
      });
    } catch (error) {
      notification.error({
        message: "Gagal submit jawaban",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      setSubmittingSection(null);
    }
  };

  const documentsTab = (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Title level={4} style={{ marginBottom: 0 }}>
        Dokumen
      </Title>
      <Text type="secondary">
        Unggah dokumen sesuai format yang ditentukan.
      </Text>

      <Form form={docForm} layout="vertical" onFinish={handleSubmitDocuments}>
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          {countryDocuments.length ? (
            countryDocuments.map((doc) => (
              <Card
                key={doc.id}
                size="small"
                style={{
                  borderRadius: 14,
                  borderColor: "#e5e7eb",
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
                }}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} md={8}>
                    <Space align="start">
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 12,
                          display: "grid",
                          placeItems: "center",
                          background: "#eef2ff",
                          color: "#4338ca",
                        }}
                      >
                        <FileTextOutlined />
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 16 }}>
                          {doc.label}
                        </Text>
                        <div style={{ marginTop: 6 }}>
                          <Space size={6} wrap>
                            <Tag color="blue">
                              {resolveFileTypeLabel(doc.file_type)}
                            </Tag>
                            {doc.required ? (
                              <Tag color="red">Wajib</Tag>
                            ) : (
                              <Tag>Opsional</Tag>
                            )}
                            {doc.translation_needed === "yes" ? (
                              <Tag color="gold">Perlu terjemahan</Tag>
                            ) : null}
                          </Space>
                        </div>
                      </div>
                    </Space>
                  </Col>

                  <Col xs={24} md={16}>
                    <Form.Item
                      label="Upload Dokumen"
                      name={["documents", String(doc.id)]}
                      valuePropName="fileList"
                      getValueFromEvent={normalizeUpload}
                      rules={
                        doc.required
                          ? [{ required: true, message: "Dokumen wajib diunggah" }]
                          : undefined
                      }
                    >
                      <Upload.Dragger
                        onChange={(info) => {
                          if (info.file.status === "done") {
                            const response = info.file.response as
                              | { url?: string }
                              | undefined;
                            notification.success({
                              message: "Upload berhasil",
                              description: `${doc.label} berhasil diunggah${
                                response?.url ? "." : ", namun URL belum tersedia."
                              }`,
                            });
                          }
                        }}
                        beforeUpload={(file) => {
                          const renamed = buildAutoFileName(
                            doc.auto_rename_pattern,
                            file as File,
                            {
                              student_name:
                                currentUser?.name ?? currentUser?.email ?? "student",
                              document_label: doc.label,
                              internal_code: doc.internal_code,
                              country_name: currentUser?.stage?.country?.name,
                            },
                          );
                          return new File([file], renamed, { type: file.type });
                        }}
                        customRequest={async ({ file, onSuccess, onError }) => {
                          try {
                            const safeName = sanitizeFileName(
                              (file as File).name || "document",
                            );
                            const userId = currentUser?.id ?? "anonymous";
                            const path = `documents/${userId}/${doc.id}/${safeName}`;

                            const result = await uploadDocument({
                              file: file as File,
                              path,
                              content_type: (file as File).type,
                            });
                            onSuccess?.(result, file as File);
                          } catch (err: any) {
                            onError?.(err);
                          }
                        }}
                        accept={resolveAccept(doc.file_type)}
                        maxCount={1}
                        style={{ padding: 12, borderRadius: 12 }}
                      >
                        <Space direction="vertical" size={4}>
                          <UploadOutlined />
                          <Text>Seret file ke sini atau klik untuk memilih</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {resolveFileTypeLabel(doc.file_type)}
                          </Text>
                        </Space>
                      </Upload.Dragger>
                    </Form.Item>

                    {doc.auto_rename_pattern ? (
                      <>
                        <Divider style={{ margin: "8px 0" }} />
                        <Text type="secondary">
                          Pola nama otomatis: {doc.auto_rename_pattern}
                        </Text>
                      </>
                    ) : null}

                    <Form.Item shouldUpdate noStyle>
                      {({ getFieldValue }) => {
                        const fileList =
                          getFieldValue(["documents", String(doc.id)]) ?? [];
                        const file = Array.isArray(fileList)
                          ? fileList[0]
                          : undefined;
                        if (!file || file.status !== "done") return null;
                        const response = file.response as
                          | { url?: string }
                          | undefined;
                        return (
                          <>
                            <Divider style={{ margin: "8px 0" }} />
                            <Space size={8}>
                              <LinkOutlined />
                              {response?.url ? (
                                <a
                                  href={response.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: "#2563eb" }}
                                >
                                  {file.name}
                                </a>
                              ) : (
                                <Text>{file.name}</Text>
                              )}
                            </Space>
                          </>
                        );
                      }}
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            ))
          ) : (
            <Text type="secondary">Belum ada dokumen untuk negara ini.</Text>
          )}
        </Space>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
          <Button type="primary" htmlType="submit" loading={submittingDocuments}>
            Submit Dokumen
          </Button>
        </div>
      </Form>
    </Space>
  );

  const items = (bases ?? []).map((base) => ({
    key: base.id,
    label: base.name,
    children: (() => {
      const baseQuestions = (questions ?? []).filter(
        (question) => question.base_id === base.id,
      );
      return (
        <Form
          layout="vertical"
          onFinish={(values) => handleSubmitAnswers(base.id, baseQuestions, values)}
        >
          <Row gutter={[16, 16]}>
            {baseQuestions.map((question) => (
              <Col key={question.id} xs={24} md={12}>
                <Form.Item
                  label={question.text}
                  name={question.id}
                  rules={
                    question.required
                      ? [{ required: true, message: "Field is required" }]
                      : undefined
                  }
                >
                  {renderQuestionField(question)}
                </Form.Item>
              </Col>
            ))}
          </Row>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 16,
            }}
          >
            <Button
              type="primary"
              htmlType="submit"
              loading={
                submittingSection === base.id &&
                (creatingAnswerQuestion || updatingAnswerQuestion)
              }
            >
              Submit Jawaban
            </Button>
          </div>
        </Form>
      );
    })(),
  }));

  return (
    <Card style={{ borderRadius: 16 }} loading={basesLoading || questionsLoading}>
      <Tabs
        activeKey={activeTab ?? resolvedBaseId}
        onChange={(key) => setActiveTab(key)}
        items={[
          ...items,
          { key: "documents", label: "Dokumen", children: documentsTab },
        ]}
      />
    </Card>
  );
}
