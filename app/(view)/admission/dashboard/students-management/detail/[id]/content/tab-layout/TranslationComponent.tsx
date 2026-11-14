"use client";

import {
  Avatar,
  Button,
  Card,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  Upload,
  Popconfirm,
  Flex,
  Modal,
  Form,
  InputNumber,
  App,
  Empty,
} from "antd";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  PlusOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useDocumentTranslations } from "@/app/hooks/use-document-translations";
import { useCountDocumentsPage } from "@/app/hooks/use-count-documents-page";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useAuth } from "@/app/utils/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { usePatchQuotaTranslation } from "@/app/hooks/use-users";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";
import styles from "../detail.module.css";

const statusColor = (value: string) => {
  const key = value.toLowerCase();
  if (key === "completed" || key === "approved") return "green";
  if (key === "in progress") return "blue";
  if (key === "pending") return "gold";
  if (key === "not started") return "default";
  return "default";
};

type DocumentWithUrl = {
  file_url?: string | null;
  url?: string | null;
  public_url?: string | null;
};

type TranslationRow = DocumentWithUrl & {
  id?: string;
  translation_id?: string;
  label?: string;
  document_id?: string;
  updated_at?: string | null;
  status?: string | null;
  file_name?: string | null;
  file_path?: string | null;
  file_type?: string | null;
  page_count?: number | null;
  is_existing_translation?: boolean;
};

type TranslationQuotaError = Error & {
  requiredQuota?: number;
  remainingQuota?: number;
};

type ApiError = Error & {
  response?: {
    data?: {
      error?: {
        code?: string;
      };
    };
  };
};

const getDocumentUrl = (doc: TranslationRow) =>
  doc.file_url ?? doc.public_url ?? doc.url ?? null;

const PageCountTag = ({ url }: { url?: string | null }) => {
  const { count, isLoading } = useCountDocumentsPage(url ?? undefined);
  if (!url) return <Tag>Pages: -</Tag>;
  if (isLoading) return <Tag color="blue">Pages: ...</Tag>;
  return <Tag color="blue">Pages: {count ?? "-"}</Tag>;
};

const fetchPageCount = async (url: string) => {
  const result = await api.post("/api/documents/page-count", { url });
  const payload = result.data?.result ?? result.data;
  return typeof payload?.page_count === "number"
    ? payload.page_count
    : undefined;
};

const sanitizeFileName = (name: string) =>
  name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9._-]/g, "");

const getFileExt = (name: string) => {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// function countRemainingTranslations(translation_quota: number, count_page: number) {
//   const remaining = translation_quota - count_page;
//   return remaining < 0 ? 0 : remaining;
// }

const buildAutoFileName = (
  pattern: string | null | undefined,
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
  next = next.replaceAll(
    "{documentLabel}",
    context.document_label ?? "document",
  );
  next = next.replaceAll("{internalCode}", context.internal_code ?? "DOC");
  next = next.replaceAll("{country}", context.country_name ?? "country");
  next = next.replaceAll("{ext}", ext.replace(".", ""));
  if (ext && !next.toLowerCase().endsWith(ext.toLowerCase())) {
    next = `${next}${ext}`;
  }
  return sanitizeFileName(next);
};

const resolveAccept = (fileType?: string | null) => {
  if (!fileType) return undefined;
  const key = fileType.toLowerCase();
  if (key === "pdf") return ".pdf";
  if (key === "png") return ".png";
  if (key === "jpg" || key === "jpeg") return ".jpg,.jpeg";
  if (key === "image") return ".png,.jpg,.jpeg";
  return undefined;
};

type TranslationComponentProps = {
  student_id: string;
  student_name?: string;
  student_country?: string;
  translation_quota?: number;
  student_has_initial_translations?: boolean;
};

export default function TranslationComponent({
  student_id,
  student_name,
  student_country,
  translation_quota,
  student_has_initial_translations,
}: TranslationComponentProps) {
  const { notification } = App.useApp();
  const { user_id, role } = useAuth();
  const normalizedRole = (role ?? "").toLowerCase();
  const isConsultant = normalizedRole === "consultant";
  const isDirector = normalizedRole === "director";
  const canManage = !isConsultant && !isDirector;
  const { uploadDocument } = useDocumentUpload();
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [quotaForm] = Form.useForm<{ translation_quota: number }>();
  const { data: documentsManagement = [] } = useDocuments({});
  const { data: answerDocuments = [] } = useAnswerDocuments({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });
  const {
    data: documentTranslations = [],
    onCreate,
    onUpdate,
    onDelete,
  } = useDocumentTranslations({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });

  const { onPatch, onPatchLoading } = usePatchQuotaTranslation();

  const handlePatchQuotaTranslation = async (values: {
    translation_quota?: number;
  }) => {
    if (values.translation_quota === undefined || values.translation_quota === null) {
      return;
    }
    await onPatch({
      id: student_id,
      quota: values.translation_quota,
    });
    quotaForm.resetFields();
    setModalVisible(false);
  };

  const translationDocIdSet = useMemo(() => {
    return new Set(
      documentsManagement
        .filter(
          (doc) => String(doc.translation_needed ?? "").toLowerCase() === "yes",
        )
        .map((doc) => String(doc.id)),
    );
  }, [documentsManagement]);

  const docLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    documentsManagement.forEach((doc) => {
      if (!doc?.id) return;
      map.set(String(doc.id), doc.label ?? String(doc.id));
    });
    return map;
  }, [documentsManagement]);

  const docFileTypeMap = useMemo(() => {
    const map = new Map<string, string>();
    documentsManagement.forEach((doc) => {
      if (!doc?.id) return;
      if (doc.file_type) {
        map.set(String(doc.id), doc.file_type);
      }
    });
    return map;
  }, [documentsManagement]);

  const docPatternMap = useMemo(() => {
    const map = new Map<string, string>();
    documentsManagement.forEach((doc) => {
      if (!doc?.id) return;
      if (doc.auto_rename_pattern) {
        map.set(String(doc.id), doc.auto_rename_pattern);
      }
    });
    return map;
  }, [documentsManagement]);

  const docInternalCodeMap = useMemo(() => {
    const map = new Map<string, string>();
    documentsManagement.forEach((doc) => {
      if (!doc?.id) return;
      if (doc.internal_code) {
        map.set(String(doc.id), doc.internal_code);
      }
    });
    return map;
  }, [documentsManagement]);

  const originalUploads = useMemo(() => {
    return answerDocuments
      .filter((doc) => translationDocIdSet.has(String(doc.document_id)))
      .map((doc) => ({
        ...doc,
        label: docLabelMap.get(String(doc.document_id)) ?? doc.document_id,
      }));
  }, [answerDocuments, docLabelMap, translationDocIdSet]);

  const originalUploadMap = useMemo(() => {
    const map = new Map<string, TranslationRow>();
    originalUploads.forEach((item) => {
      if (!item.document_id) return;
      map.set(String(item.document_id), item as TranslationRow);
    });
    return map;
  }, [originalUploads]);

  const translationMap = useMemo(() => {
    const map = new Map<string, (typeof documentTranslations)[number]>();
    documentTranslations.forEach((item) => {
      if (!item.document_id) return;
      map.set(String(item.document_id), item);
    });
    return map;
  }, [documentTranslations]);

  const translationRows: TranslationRow[] = useMemo(() => {
    return Array.from(translationDocIdSet).map((docId) => {
      const translation = translationMap.get(docId);
      return {
        translation_id: translation?.id,
        document_id: docId,
        label: docLabelMap.get(docId) ?? docId,
        file_url: translation?.file_url ?? null,
        file_path: translation?.file_path ?? null,
        file_name: translation?.file_name ?? null,
        file_type: translation?.file_type ?? docFileTypeMap.get(docId) ?? null,
        page_count: translation?.page_count ?? null,
        is_existing_translation: translation?.is_existing_translation ?? false,
        status:
          translation?.status ?? (translation ? "pending" : "not started"),
        updated_at: translation?.updated_at ?? null,
      };
    });
  }, [docFileTypeMap, docLabelMap, translationDocIdSet, translationMap]);

  const handleUpload = useCallback(
    async (file: File, row: TranslationRow) => {
      if (!student_id || !row.document_id) {
        notification.error({
          message: "Upload gagal",
          description: "Student atau dokumen belum tersedia.",
        });
        return;
      }
      if (!user_id) {
        notification.error({
          message: "Upload gagal",
          description: "User tidak terautentikasi.",
        });
        return;
      }

      const pattern = docPatternMap.get(row.document_id);
      const safeName = buildAutoFileName(pattern, file, {
        student_name: student_name ?? student_id,
        document_label: row.label,
        internal_code: docInternalCodeMap.get(row.document_id),
        country_name: student_country,
      });
      const path = `translations/${student_id}/${row.document_id}/${safeName}`;
      setUploadingId(row.document_id);

      try {
        const result = await uploadDocument({
          file,
          path,
          content_type: file.type,
          student_folder_key: `${student_name ?? "student"}-${student_id}`,
        });

        const pageCount = await fetchPageCount(result.url);
        if (pageCount === undefined) {
          throw new Error("Gagal menghitung jumlah halaman dokumen.");
        }
        const remainingQuota = Number(translation_quota ?? 0);
        const shouldDeductQuota = !(
          row.is_existing_translation ||
          (!row.translation_id && student_has_initial_translations)
        );
        const previousPageCount =
          row.translation_id && typeof row.page_count === "number"
            ? row.page_count
            : 0;
        const requiredQuota = shouldDeductQuota
          ? Math.max(0, pageCount - previousPageCount)
          : 0;
        if (requiredQuota > remainingQuota) {
          const quotaError: TranslationQuotaError = new Error(
            "translation_quota_exceeded_local",
          );
          quotaError.requiredQuota = requiredQuota;
          quotaError.remainingQuota = remainingQuota;
          throw quotaError;
        }

        const payload = {
          student_id,
          document_id: row.document_id,
          uploader_id: user_id,
          file_url: result.url,
          file_path: result.path,
          file_name: safeName,
          file_type: file.type,
          page_count: pageCount,
          is_existing_translation:
            row.is_existing_translation ||
            (!row.translation_id && Boolean(student_has_initial_translations)),
          status: "pending",
        };

        if (row.translation_id) {
          await onUpdate({ id: row.translation_id, payload });
        } else {
          await onCreate(payload);
        }
        await queryClient.invalidateQueries({
          queryKey: ["document-translations"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["user", student_id],
        });

        notification.success({
          message: "Upload berhasil",
          description: `${row.label ?? "Dokumen"} berhasil diunggah (${pageCount} halaman).`,
        });
      } catch (error) {
        const err = error as TranslationQuotaError & ApiError;
        if (err?.message === "translation_quota_exceeded_local") {
          const requiredQuota = Number(err?.requiredQuota ?? 0);
          const remainingQuota = Number(err?.remainingQuota ?? 0);
          notification.warning({
            message: "Kuota translate tidak cukup",
            description: `Dokumen butuh ${requiredQuota} halaman, sisa kuota saat ini ${remainingQuota}.`,
          });
          throw err;
        }
        const apiCode = err?.response?.data?.error?.code;
        if (apiCode === "translation_quota_exceeded") {
          notification.error({
            message: "Kuota translate tidak cukup",
            description:
              "Jumlah halaman dokumen melebihi sisa kuota translate student.",
          });
          throw err;
        }
        notification.error({
          message: "Upload gagal",
          description: err?.message ?? "Terjadi kesalahan saat mengunggah.",
        });
        throw err;
      } finally {
        setUploadingId(null);
      }
    },
    [
      docInternalCodeMap,
      docPatternMap,
      notification,
      onCreate,
      onUpdate,
      queryClient,
      student_country,
      student_id,
      student_name,
      translation_quota,
      student_has_initial_translations,
      uploadDocument,
      user_id,
    ],
  );

  const handleDelete = useCallback(
    async (row: TranslationRow) => {
      if (!row.translation_id) return;
      try {
        await onDelete(row.translation_id);
        await queryClient.invalidateQueries({
          queryKey: ["document-translations"],
        });
        await queryClient.invalidateQueries({
          queryKey: ["user", student_id],
        });
        notification.success({
          message: "Dokumen dihapus",
          description: `${row.label ?? "Dokumen"} berhasil dihapus.`,
        });
      } catch (error) {
        const err = error as ApiError;
        notification.error({
          message: "Gagal menghapus",
          description: err?.message ?? "Terjadi kesalahan saat menghapus.",
        });
      }
    },
    [notification, onDelete, queryClient, student_id],
  );

  const handleDownloadMerged = useCallback(
    async (row: TranslationRow) => {
      if (!row.document_id) return;
      const original = originalUploadMap.get(String(row.document_id));
      const originalUrl = original ? getDocumentUrl(original) : null;
      const translationUrl = getDocumentUrl(row);

      if (!originalUrl || !translationUrl) {
        notification.warning({
          message: "Tidak bisa download",
          description: "Dokumen asli atau terjemahan belum tersedia.",
        });
        return;
      }

      try {
        const pattern = docPatternMap.get(row.document_id);
        const mergedFile = new File([], "merged.pdf", {
          type: "application/pdf",
        });
        const safeName = buildAutoFileName(pattern, mergedFile, {
          student_name: student_name ?? student_id,
          document_label: row.label,
          internal_code: docInternalCodeMap.get(row.document_id),
          country_name: student_country,
        });
        const response = await api.post(
          "/api/documents/merge-pdf",
          {
            original_url: originalUrl,
            translation_url: translationUrl,
            file_name: safeName,
          },
          { responseType: "blob" },
        );
        downloadBlob(response.data as Blob, safeName);
      } catch (error) {
        const err = error as ApiError;
        notification.error({
          message: "Gagal download",
          description: err?.message ?? "Terjadi kesalahan saat merge dokumen.",
        });
      }
    },
    [
      docInternalCodeMap,
      docPatternMap,
      notification,
      originalUploadMap,
      student_country,
      student_id,
      student_name,
    ],
  );

  const translationColumns: ColumnsType<TranslationRow> = useMemo(
    () => [
      {
        title: "Document Name",
        dataIndex: "label",
        key: "label",
        render: (_, record) => (
          <Space align="center" size={8}>
            <Avatar size={24} icon={<FileTextOutlined />} />
            <Typography.Text>{record.label}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Pages",
        key: "pages",
        render: (_, record) =>
          typeof record.page_count === "number" ? (
            <Tag color="blue">Pages: {record.page_count}</Tag>
          ) : (
            <PageCountTag url={getDocumentUrl(record)} />
          ),
      },
      {
        title: "Uploaded By",
        key: "uploaded_by",
        render: (_, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>
              {record.file_url ? "Admission" : "-"}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.updated_at ?? "-"}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value) => (
          <Tag color={statusColor(value ?? "not started")}>
            {(value ?? "not started").toUpperCase()}
          </Tag>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_, record) => {
          const fileUrl = getDocumentUrl(record);
          const original = record.document_id
            ? originalUploadMap.get(String(record.document_id))
            : undefined;
          const originalUrl = original ? getDocumentUrl(original) : null;
          const canDownloadMerged = Boolean(originalUrl && fileUrl);
          const isUploading = uploadingId === record.document_id;
          const canDelete = Boolean(record.translation_id);
          return (
            <Space size={8}>
              <Button
                icon={<EyeOutlined />}
                disabled={!fileUrl}
                href={
                  fileUrl
                    ? buildFilePreviewUrl(
                        fileUrl,
                        record.file_name ?? `${record.label ?? "document"}.pdf`,
                        record.file_type,
                      )
                    : undefined
                }
                target={fileUrl ? "_blank" : undefined}
                style={{ borderRadius: 8 }}
              >
                Lihat
              </Button>
              <Button
                icon={<DownloadOutlined />}
                disabled={!canDownloadMerged}
                onClick={() => handleDownloadMerged(record)}
              />
              {canManage && (
                <Upload
                  showUploadList={false}
                  accept={resolveAccept(record.file_type)}
                  customRequest={async ({ file, onSuccess, onError }) => {
                    try {
                      await handleUpload(file as File, record);
                      onSuccess?.({}, file as File);
                    } catch (error) {
                      onError?.(error as Error);
                    }
                  }}
                >
                  <Button icon={<CloudUploadOutlined />} loading={isUploading} />
                </Upload>
              )}
              {canManage && (
                <Popconfirm
                  title="Hapus dokumen terjemahan?"
                  okText="Hapus"
                  cancelText="Batal"
                  onConfirm={() => handleDelete(record)}
                  disabled={!canDelete}
                >
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    disabled={!canDelete}
                  />
                </Popconfirm>
              )}
            </Space>
          );
        },
      },
    ],
    [canManage, handleDelete, handleDownloadMerged, handleUpload, originalUploadMap, uploadingId],
  );

  const originalColumns: ColumnsType<TranslationRow> = useMemo(
    () => [
      {
        title: "Document Name",
        dataIndex: "label",
        key: "label",
        render: (_, record) => (
          <Space align="center" size={8}>
            <Avatar size={24} icon={<FileTextOutlined />} />
            <Typography.Text>{record.label}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Pages",
        key: "pages",
        render: (_, record) => <PageCountTag url={getDocumentUrl(record)} />,
      },
      {
        title: "URL Dokumen",
        key: "url",
        render: (_, record) => {
          const fileUrl = getDocumentUrl(record);
          return (
            <Tag color={fileUrl ? "blue" : "default"}>
              {fileUrl ? (
                <Link
                  href={buildFilePreviewUrl(
                    fileUrl,
                    record.file_name ?? `${record.label ?? "document"}.pdf`,
                    record.file_type,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  Lihat Dokumen
                </Link>
              ) : (
                "URL Tidak Tersedia"
              )}
            </Tag>
          );
        },
      },
    ],
    [],
  );

  const handleOpenModal = () => {
    setModalVisible(true);
  };

  const TranslationHeader = ({
    translation_quota,
  }: {
    translation_quota: number;
  }) => (
    <div className={styles.translationHeaderCard} style={{ height: "auto", minHeight: "unset" }}>
      <div className={styles.translationHeaderRow}>
        <div className={styles.translationHeaderLeft}>
          <div className={styles.translationHeaderIcon}>
            <TranslationOutlined />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div className={styles.sectionHeaderTitle}>
              Sworn Translation
            </div>
            <div className={styles.sectionHeaderSubtitle}>
              Kelola dokumen terjemahan resmi
            </div>
          </div>
        </div>

        <div className={styles.translationHeaderRight}>
          <Tag
            color="blue"
            style={{
              borderRadius: 6,
              padding: "1px 8px",
              fontSize: 11,
              fontWeight: 600,
              margin: 0,
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              flexShrink: 0,
            }}
          >
            Kuota {translation_quota}
          </Tag>
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenModal()}
              style={{
                borderRadius: 8,
                height: 36,
                fontWeight: 600,
                fontSize: 13,
                background: "#1b3d6d",
                borderColor: "#1b3d6d",
                flexShrink: 0,
              }}
            >
              <span className={styles.desktopBtnText}>Tambah Dokumen</span>
              <span className={styles.mobileBtnText}>Tambah</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: "100%", minWidth: 0 }}>
      <TranslationHeader translation_quota={Number(translation_quota)} />

      <Card
        bodyStyle={{ padding: 16 }}
        className={styles.translationTableCard}
      >
        <Tabs
          defaultActiveKey="translation"
          style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
          items={[
            {
              key: "translation",
              label: "Dokumen Terjemahan",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
                  <div className={styles.desktopTableOnly}>
                    <div className={styles.tableWrapper}>
                      <Table
                        columns={translationColumns}
                        dataSource={translationRows}
                        rowKey={(record, index) =>
                          String(
                            record.id ??
                              record.document_id ??
                              record.file_url ??
                              index,
                          )
                        }
                        pagination={false}
                        locale={{
                          emptyText: "Belum ada dokumen terjemahan yang diunggah.",
                        }}
                        scroll={{ x: 900 }}
                      />
                    </div>
                  </div>

                  <div className={styles.mobileCardListOnly}>
                    {translationRows.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Belum ada dokumen terjemahan yang diunggah."
                      />
                    ) : (
                      translationRows.map((record, index) => {
                        const fileUrl = getDocumentUrl(record);
                        const original = record.document_id
                          ? originalUploadMap.get(String(record.document_id))
                          : undefined;
                        const originalUrl = original ? getDocumentUrl(original) : null;
                        const canDownloadMerged = Boolean(originalUrl && fileUrl);
                        const isUploading = uploadingId === record.document_id;
                        const canDelete = Boolean(record.translation_id);

                        return (
                          <div
                            key={String(
                              record.id ??
                                record.document_id ??
                                record.file_url ??
                                index,
                            )}
                            className={styles.mobileTransCard}
                          >
                            <div className={styles.mobileTransHeader}>
                              <Space align="center" size={8} style={{ minWidth: 0, flex: 1 }}>
                                <Avatar size={24} icon={<FileTextOutlined />} style={{ flexShrink: 0 }} />
                                <Typography.Text strong style={{ wordBreak: "break-word", fontSize: 13 }}>
                                  {record.label}
                                </Typography.Text>
                              </Space>
                              <Tag
                                color={statusColor(record.status ?? "not started")}
                                style={{ margin: 0, flexShrink: 0, fontSize: 11 }}
                              >
                                {(record.status ?? "not started").toUpperCase()}
                              </Tag>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                              <div>
                                {typeof record.page_count === "number" ? (
                                  <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                                    Pages: {record.page_count}
                                  </Tag>
                                ) : (
                                  <PageCountTag url={getDocumentUrl(record)} />
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: "#64748b" }}>
                                Uploaded by {record.file_url ? "Admission" : "-"}
                                {record.updated_at ? ` (${record.updated_at})` : ""}
                              </div>
                            </div>

                            <div className={styles.mobileTransActions}>
                              <Button
                                size="small"
                                icon={<EyeOutlined />}
                                disabled={!fileUrl}
                                href={
                                  fileUrl
                                    ? buildFilePreviewUrl(
                                        fileUrl,
                                        record.file_name ?? `${record.label ?? "document"}.pdf`,
                                        record.file_type,
                                      )
                                    : undefined
                                }
                                target={fileUrl ? "_blank" : undefined}
                                className={styles.mobileTransBtn}
                              >
                                Lihat
                              </Button>

                              <Button
                                size="small"
                                icon={<DownloadOutlined />}
                                disabled={!canDownloadMerged}
                                onClick={() => handleDownloadMerged(record)}
                                className={styles.mobileTransBtn}
                              >
                                Unduh Gabungan
                              </Button>

                              {canManage && (
                                <Upload
                                  showUploadList={false}
                                  accept={resolveAccept(record.file_type)}
                                  customRequest={async ({ file, onSuccess, onError }) => {
                                    try {
                                      await handleUpload(file as File, record);
                                      onSuccess?.({}, file as File);
                                    } catch (error) {
                                      onError?.(error as Error);
                                    }
                                  }}
                                >
                                  <Button
                                    size="small"
                                    icon={<CloudUploadOutlined />}
                                    loading={isUploading}
                                    className={styles.mobileTransBtn}
                                  >
                                    Upload
                                  </Button>
                                </Upload>
                              )}

                              {canManage && (
                                <Popconfirm
                                  title="Hapus dokumen terjemahan?"
                                  okText="Hapus"
                                  cancelText="Batal"
                                  onConfirm={() => handleDelete(record)}
                                  disabled={!canDelete}
                                >
                                  <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                    disabled={!canDelete}
                                    className={styles.mobileTransBtn}
                                  >
                                    Hapus
                                  </Button>
                                </Popconfirm>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Space>
              ),
            },
            {
              key: "original",
              label: "Dokumen Asli",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}>
                  <div className={styles.desktopTableOnly}>
                    <div className={styles.tableWrapper}>
                      <Table
                        columns={originalColumns}
                        dataSource={originalUploads as TranslationRow[]}
                        rowKey={(record, index) =>
                          String(
                            record.id ??
                              record.document_id ??
                              record.file_url ??
                              index,
                          )
                        }
                        pagination={false}
                        locale={{
                          emptyText: "Belum ada dokumen yang diunggah.",
                        }}
                        scroll={{ x: 800 }}
                      />
                    </div>
                  </div>

                  <div className={styles.mobileCardListOnly}>
                    {originalUploads.length === 0 ? (
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="Belum ada dokumen yang diunggah."
                      />
                    ) : (
                      (originalUploads as TranslationRow[]).map((record, index) => {
                        const fileUrl = getDocumentUrl(record);
                        return (
                          <div
                            key={String(
                              record.id ??
                                record.document_id ??
                                record.file_url ??
                                index,
                            )}
                            className={styles.mobileTransCard}
                          >
                            <div className={styles.mobileTransHeader}>
                              <Space align="center" size={8} style={{ minWidth: 0, flex: 1 }}>
                                <Avatar size={24} icon={<FileTextOutlined />} style={{ flexShrink: 0 }} />
                                <Typography.Text strong style={{ wordBreak: "break-word", fontSize: 13 }}>
                                  {record.label}
                                </Typography.Text>
                              </Space>
                              <PageCountTag url={getDocumentUrl(record)} />
                            </div>

                            <div className={styles.mobileTransActions}>
                              {fileUrl ? (
                                <Button
                                  size="small"
                                  icon={<EyeOutlined />}
                                  href={buildFilePreviewUrl(
                                    fileUrl,
                                    record.file_name ?? `${record.label ?? "document"}.pdf`,
                                    record.file_type,
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.mobileTransBtn}
                                >
                                  Lihat Dokumen
                                </Button>
                              ) : (
                                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                  URL Tidak Tersedia
                                </Typography.Text>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Space>
              ),
            },
          ]}
        />
      </Card>
      <Modal
        open={modalVisible}
        onCancel={() => {
          quotaForm.resetFields();
          setModalVisible(false);
        }}
        title="Tambah Kuota Translate"
        footer={null}
      >
        <Form
          form={quotaForm}
          layout="vertical"
          onFinish={handlePatchQuotaTranslation}
        >
          <Form.Item
            name="translation_quota"
            label="Kuota Translate"
            rules={[
              { required: true, message: "Kuota wajib diisi" },
              { type: "number", min: 0, message: "Kuota minimal 0" },
            ]}
          >
            <InputNumber
              placeholder="Masukkan kuota translate"
              style={{ width: "100%" }}
              min={0}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={onPatchLoading}>
              Simpan
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
