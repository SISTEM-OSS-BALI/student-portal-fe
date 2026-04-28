"use client";

import { useMemo, type CSSProperties } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
  notification,
} from "antd";
import {
  CheckCircleFilled,
  CloudUploadOutlined,
  FileTextOutlined,
  InfoCircleFilled,
  LinkOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { useAuth } from "@/app/utils/use-auth";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useUser } from "@/app/hooks/use-users";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";
import type {
  AnswerDocumentDataModel,
  AnswerDocumentPayloadCreateModel,
} from "@/app/models/question";

const { Text, Title } = Typography;

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

const getFileExt = (name: string) => {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
};

const formatUploadDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const resolveAccept = (fileType?: string) => {
  if (!fileType) return undefined;
  const normalized = fileType.toLowerCase();

  if (normalized.includes("pdf")) return ".pdf";
  if (
    normalized.includes("image") ||
    normalized.includes("jpg") ||
    normalized.includes("jpeg") ||
    normalized.includes("png")
  ) {
    return "image/*";
  }
  if (normalized.includes("doc")) return ".doc,.docx";

  return undefined;
};

const resolveFileTypeLabel = (fileType?: string) => {
  if (!fileType) return "Semua tipe file";
  return fileType;
};

const normalizeUpload = (e: { fileList?: UploadFile[] } | UploadFile[] | undefined) => {
  if (Array.isArray(e)) return e;
  return e?.fileList ?? [];
};

type UploadedDocumentResponse = {
  url?: string;
  path?: string;
};

type UploadedDocumentFile = UploadFile<UploadedDocumentResponse>;

type DocumentFormValues = {
  documents?: Record<string, UploadedDocumentFile[] | undefined>;
};

type CustomRequestOptions = Parameters<
  NonNullable<UploadProps["customRequest"]>
>[0];

type DocumentStatusInfo = {
  color: string;
  background: string;
  label: string;
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

const getDocumentStatusInfo = (
  draftFile?: UploadedDocumentFile,
  existingFile?: AnswerDocumentDataModel,
): DocumentStatusInfo => {
  if (draftFile?.status === "uploading") {
    return {
      label: "Uploading",
      color: "#2563eb",
      background: "#eff6ff",
    };
  }

  if (draftFile?.status === "done") {
    return {
      label: "Ready to submit",
      color: "#16a34a",
      background: "#ecfdf5",
    };
  }

  if (draftFile?.status === "error") {
    return {
      label: "Upload failed",
      color: "#dc2626",
      background: "#fef2f2",
    };
  }

  if (existingFile?.file_url) {
    return {
      label: "Uploaded",
      color: "#16a34a",
      background: "#ecfdf5",
    };
  }

  return {
    label: "Not uploaded",
    color: "#ef4444",
    background: "#fff1f2",
  };
};

const summaryCardStyle = {
  borderRadius: 20,
  borderColor: "#dbe5ff",
  boxShadow: "0 18px 40px rgba(37, 99, 235, 0.08)",
} satisfies CSSProperties;

const guidelineItems = [
  "Use a scanner or high-quality camera.",
  "Make sure all text is clear and readable.",
  "Upload full-page documents, not cropped photos.",
  "Match your name and date of birth with your passport.",
  "Only upload your own documents.",
];

export default function CountryDocumentComponent() {
  const [docForm] = Form.useForm<DocumentFormValues>();
  const watchedDocuments = Form.useWatch("documents", docForm);

  const { user_id } = useAuth();
  const { data: currentUser, fetchLoading: userLoading } = useUser({ id: user_id });
  const { data: stages, fetchLoading: stagesLoading } = useStagesManagement({});
  const { uploadDocument } = useDocumentUpload();

  const {
    data: answerDocuments,
    fetchLoading: answerDocumentsLoading,
    onCreate: submitDocuments,
    onCreateLoading: submittingDocuments,
  } = useAnswerDocuments({
    queryString: currentUser?.id ? `student_id=${currentUser.id}` : undefined,
    enabled: Boolean(currentUser?.id),
  });

  const countryDocuments = useMemo(() => {
    const countryId = currentUser?.stage?.country_id;
    if (!countryId) return [];

    const docs = (stages ?? [])
      .filter((stage) => stage.country_id === countryId)
      .map((stage) => stage.document)
      .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));

    const unique = new Map(docs.map((doc) => [String(doc.id), doc]));
    return Array.from(unique.values());
  }, [stages, currentUser]);

  const documentMap = useMemo(() => {
    return new Map(countryDocuments.map((doc) => [String(doc.id), doc]));
  }, [countryDocuments]);

  const latestAnswerByDocumentId = useMemo(() => {
    const map = new Map<string, AnswerDocumentDataModel>();

    (answerDocuments ?? []).forEach((item) => {
      const key = String(item.document_id);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, item);
        return;
      }

      const existingTime = Date.parse(existing.created_at);
      const nextTime = Date.parse(item.created_at);

      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        map.set(key, item);
      }
    });

    return map;
  }, [answerDocuments]);

  const documentsWithState = useMemo(() => {
    return countryDocuments.map((doc) => {
      const key = String(doc.id);
      const draftFile = watchedDocuments?.[key]?.[0];
      const submittedFile = latestAnswerByDocumentId.get(key);
      const statusInfo = getDocumentStatusInfo(draftFile, submittedFile);
      const isCompleted =
        draftFile?.status === "done" || Boolean(submittedFile?.file_url);

      return {
        doc,
        draftFile,
        submittedFile,
        statusInfo,
        isCompleted,
      };
    });
  }, [countryDocuments, latestAnswerByDocumentId, watchedDocuments]);

  const totalDocuments = documentsWithState.length;
  const uploadedDocuments = documentsWithState.filter((item) => item.isCompleted).length;
  const pendingDocuments = documentsWithState.filter(
    (item) => item.doc.required && !item.isCompleted,
  ).length;
  const optionalDocuments = documentsWithState.filter(
    (item) => !item.doc.required,
  ).length;
  const translationDocuments = documentsWithState.filter((item) =>
    String(item.doc.translation_needed ?? "").toUpperCase() === "YES",
  ).length;

  const progressPercent = totalDocuments
    ? Math.round((uploadedDocuments / totalDocuments) * 100)
    : 0;

  const handleSubmitDocuments = async (values: DocumentFormValues) => {
    const documents = values.documents ?? {};
    const pendingDocs: string[] = [];
    const payload: AnswerDocumentPayloadCreateModel[] = [];

    Object.entries(documents).forEach(([document_id, fileList]) => {
      const file = Array.isArray(fileList) ? fileList[0] : undefined;
      if (!file) return;

      const response = file.response;
      if (file.status !== "done" || !response?.url) {
        const label = documentMap.get(String(document_id))?.label;
        pendingDocs.push(label ?? String(document_id));
        return;
      }

      payload.push({
        document_id: String(document_id),
        student_id: currentUser?.id != null ? String(currentUser.id) : undefined,
        file_name: file.name,
        file_url: response.url,
        file_path: response.path,
        file_type: file.type,
        status: file.status,
      });
    });

    if (pendingDocs.length > 0) {
      notification.error({
        message: "Upload belum selesai",
        description: `Dokumen berikut belum selesai diunggah: ${pendingDocs.join(", ")}`,
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
      docForm.resetFields();
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

  return (
    <div
      style={{
        minHeight: "100%",
        padding: 24,
        borderRadius: 28,
      }}
    >
      <Form form={docForm} layout="vertical" onFinish={handleSubmitDocuments}>
        <Row gutter={[24, 24]} align="top">
          <Col xs={24} xl={16}>
            <Space direction="vertical" size={20} style={{ width: "100%" }}>
              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                <Title level={3} style={{ margin: 0 }}>
                  Upload Documents
                </Title>
                <Text type="secondary">
                  Please upload all required documents to continue your visa process.
                </Text>

                <Space size={8} wrap>
                  {currentUser?.stage?.country?.name ? (
                    <Tag
                      style={{
                        borderRadius: 999,
                        paddingInline: 10,
                        borderColor: "#bfdbfe",
                        background: "#eff6ff",
                        color: "#1d4ed8",
                      }}
                    >
                      {currentUser.stage.country.name}
                    </Tag>
                  ) : null}

                  {currentUser?.visa_type ? (
                    <Tag
                      style={{
                        borderRadius: 999,
                        paddingInline: 10,
                        borderColor: "#c7d2fe",
                        background: "#eef2ff",
                        color: "#4338ca",
                      }}
                    >
                      {currentUser.visa_type}
                    </Tag>
                  ) : null}

                  <Tag
                    style={{
                      borderRadius: 999,
                      paddingInline: 10,
                      borderColor: "#e5e7eb",
                      background: "#f8fafc",
                      color: "#475569",
                    }}
                  >
                    Auto rename enabled
                  </Tag>
                </Space>
              </Space>

              <Space direction="vertical" size={16} style={{ width: "100%" }}>
                {documentsWithState.length ? (
                  documentsWithState.map(
                    ({ doc, draftFile, submittedFile, statusInfo, isCompleted }) => (
                      <Card
                        key={doc.id}
                        loading={userLoading || stagesLoading || answerDocumentsLoading}
                        style={{
                          borderRadius: 18,
                          borderColor: "#dbe5ff",
                          boxShadow: "0 16px 36px rgba(15, 23, 42, 0.06)",
                        }}
                        styles={{ body: { padding: 18 } }}
                      >
                        <Space direction="vertical" size={14} style={{ width: "100%" }}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              alignItems: "flex-start",
                            }}
                          >
                            <Space align="start" size={12}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: 12,
                                  display: "grid",
                                  placeItems: "center",
                                  color: "#2563eb",
                                  background: "#eff6ff",
                                  flexShrink: 0,
                                }}
                              >
                                <FileTextOutlined />
                              </div>

                              <div>
                                <Text
                                  strong
                                  style={{
                                    display: "block",
                                    fontSize: 14,
                                    letterSpacing: 0.2,
                                  }}
                                >
                                  {String(doc.label).toUpperCase()}
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  {doc.notes ||
                                    `${doc.required ? "Required" : "Optional"} document for your application.`}
                                </Text>
                              </div>
                            </Space>

                            <span
                              style={{
                                whiteSpace: "nowrap",
                                borderRadius: 999,
                                padding: "4px 10px",
                                fontSize: 12,
                                fontWeight: 600,
                                color: statusInfo.color,
                                background: statusInfo.background,
                              }}
                            >
                              {statusInfo.label}
                            </span>
                          </div>

                          <Form.Item
                            style={{ marginBottom: 0 }}
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
                                  const response = info.file.response;
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
                              customRequest={async ({
                                file,
                                onSuccess,
                                onError,
                              }: CustomRequestOptions) => {
                                try {
                                  const typedFile = file as File;
                                  const safeName = sanitizeFileName(
                                    typedFile.name || "document",
                                  );
                                  const userId = currentUser?.id ?? "anonymous";
                                  const path = `documents/${userId}/${doc.id}/${safeName}`;

                                  const result = await uploadDocument({
                                    file: typedFile,
                                    path,
                                    content_type: typedFile.type,
                                  });

                                  onSuccess?.(result, typedFile);
                                } catch (err: unknown) {
                                  onError?.(
                                    err instanceof Error
                                      ? err
                                      : new Error("Upload gagal diproses"),
                                  );
                                }
                              }}
                              accept={resolveAccept(doc.file_type)}
                              maxCount={1}
                              style={{
                                borderRadius: 14,
                                background: isCompleted ? "#fbfdff" : "#f8fafc",
                                borderColor: isCompleted ? "#dbeafe" : "#e5e7eb",
                                padding: 18,
                              }}
                            >
                              <Space direction="vertical" size={4}>
                                <CloudUploadOutlined
                                  style={{ fontSize: 24, color: "#64748b" }}
                                />
                                <Text style={{ fontSize: 13 }}>
                                  Drag & drop file here or click to upload
                                </Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                  Max 10 MB · {resolveFileTypeLabel(doc.file_type)}
                                </Text>
                                <Button
                                  type="primary"
                                  size="small"
                                  style={{
                                    marginTop: 8,
                                    borderRadius: 999,
                                    paddingInline: 18,
                                  }}
                                >
                                  {isCompleted ? "Replace file" : "Browse files"}
                                </Button>
                              </Space>
                            </Upload.Dragger>
                          </Form.Item>

                          {doc.auto_rename_pattern ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "flex-start",
                                borderRadius: 12,
                                padding: "10px 12px",
                                background: "#f5f7ff",
                                color: "#4f46e5",
                                fontSize: 12,
                              }}
                            >
                              <InfoCircleFilled style={{ marginTop: 2 }} />
                              <span>
                                System will auto-rename your file to{" "}
                                <strong>{doc.auto_rename_pattern}</strong> for consistency.
                              </span>
                            </div>
                          ) : null}

                          {submittedFile?.file_url || draftFile?.status === "done" ? (
                            <>
                              <Divider style={{ margin: "2px 0" }} />
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  gap: 12,
                                  padding: "10px 12px",
                                  borderRadius: 12,
                                  border: "1px solid #edf2f7",
                                  background: "#ffffff",
                                }}
                              >
                                <Space size={10} align="start">
                                  <FileTextOutlined
                                    style={{ color: "#64748b", marginTop: 2 }}
                                  />
                                  <Space direction="vertical" size={0}>
                                    <Text strong style={{ fontSize: 13 }}>
                                      {draftFile?.name ||
                                        submittedFile?.file_name ||
                                        `${doc.label}.pdf`}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                      {draftFile?.status === "done"
                                        ? "Uploaded in this session"
                                        : submittedFile?.created_at
                                          ? `Uploaded ${formatUploadDate(submittedFile.created_at)}`
                                          : "Ready to submit"}
                                    </Text>
                                  </Space>
                                </Space>

                                <Space size={8}>
                                  {draftFile?.status === "uploading" ? (
                                    <span style={{ color: "#2563eb", fontSize: 12 }}>
                                      <LoadingOutlined /> Uploading...
                                    </span>
                                  ) : (
                                    <span
                                      style={{
                                        color: "#16a34a",
                                        fontSize: 12,
                                        fontWeight: 600,
                                      }}
                                    >
                                      <CheckCircleFilled /> File ready
                                    </span>
                                  )}

                                  {(draftFile?.response?.url || submittedFile?.file_url) && (
                                    <a
                                      href={buildFilePreviewUrl(
                                        draftFile?.response?.url ||
                                          submittedFile?.file_url,
                                        draftFile?.name ||
                                          submittedFile?.file_name ||
                                          `${doc.label}.pdf`,
                                      )}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: "#2563eb" }}
                                    >
                                      <LinkOutlined />
                                    </a>
                                  )}
                                </Space>
                              </div>
                            </>
                          ) : null}
                        </Space>
                      </Card>
                    ),
                  )
                ) : (
                  <Card style={{ borderRadius: 18, borderColor: "#e5e7eb" }}>
                    <Text type="secondary">Belum ada dokumen untuk negara ini.</Text>
                  </Card>
                )}
              </Space>
            </Space>
          </Col>

          <Col xs={24} xl={8}>
            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Card style={summaryCardStyle} styles={{ body: { padding: 18 } }}>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <Space direction="vertical" size={0}>
                      <Text strong>Overall Progress</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {uploadedDocuments} / {totalDocuments} documents uploaded
                      </Text>
                    </Space>
                    <Text
                      strong
                      style={{ color: "#2f61ff", fontSize: 24, lineHeight: 1 }}
                    >
                      {progressPercent}%
                    </Text>
                  </div>

                  <Progress
                    percent={progressPercent}
                    showInfo={false}
                    strokeColor="#2f61ff"
                    trailColor="#e5e7eb"
                  />

                  <Row gutter={[12, 12]}>
                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 24, color: "#111827" }}>
                          {uploadedDocuments}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Uploaded
                        </Text>
                      </Space>
                    </Col>

                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 24, color: "#111827" }}>
                          {pendingDocuments}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Pending upload
                        </Text>
                      </Space>
                    </Col>

                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 24, color: "#111827" }}>
                          {optionalDocuments}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Optional docs
                        </Text>
                      </Space>
                    </Col>

                    <Col span={12}>
                      <Space direction="vertical" size={0}>
                        <Text strong style={{ fontSize: 24, color: "#111827" }}>
                          {translationDocuments}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Need translation
                        </Text>
                      </Space>
                    </Col>
                  </Row>

                  <Button
                    type="primary"
                    block
                    size="large"
                    loading={submittingDocuments}
                    onClick={() => docForm.submit()}
                    style={{
                      borderRadius: 999,
                      height: 42,
                      background: "linear-gradient(90deg, #2f61ff 0%, #3563e9 100%)",
                      boxShadow: "0 12px 24px rgba(47, 97, 255, 0.22)",
                    }}
                  >
                    Submit for admission review
                  </Button>
                </Space>
              </Card>

              <Card
                style={{
                  ...summaryCardStyle,
                  background: "#f8fbff",
                }}
                styles={{ body: { padding: 18 } }}
              >
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  <Text strong style={{ color: "#1d4ed8" }}>
                    Upload guidelines
                  </Text>

                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      color: "#475569",
                      fontSize: 13,
                    }}
                  >
                    {guidelineItems.map((item) => (
                      <li key={item} style={{ marginBottom: 6 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
}