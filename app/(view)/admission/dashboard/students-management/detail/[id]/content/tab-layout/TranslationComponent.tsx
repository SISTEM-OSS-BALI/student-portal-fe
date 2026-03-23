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
} from "antd";
import {
  CloudUploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  GlobalOutlined,
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
};

export default function TranslationComponent({
  student_id,
  student_name,
  student_country,
  translation_quota,
}: TranslationComponentProps) {
  const { notification } = App.useApp();
  const { user_id } = useAuth();
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
        });

        const pageCount = await fetchPageCount(result.url);
        if (pageCount === undefined) {
          throw new Error("Gagal menghitung jumlah halaman dokumen.");
        }
        const remainingQuota = Number(translation_quota ?? 0);
        const requiredQuota = pageCount;
        if (requiredQuota > remainingQuota) {
          const quotaError = new Error("translation_quota_exceeded_local");
          (quotaError as any).requiredQuota = requiredQuota;
          (quotaError as any).remainingQuota = remainingQuota;
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
      } catch (err: any) {
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
      onCreate,
      onUpdate,
      queryClient,
      student_country,
      student_id,
      student_name,
      translation_quota,
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
      } catch (err: any) {
        notification.error({
          message: "Gagal menghapus",
          description: err?.message ?? "Terjadi kesalahan saat menghapus.",
        });
      }
    },
    [onDelete, queryClient, student_id],
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
          const isUploading = uploadingId === record.document_id;
          const canDelete = Boolean(record.translation_id);
          return (
            <Space size={8}>
              <Button
                icon={<EyeOutlined />}
                disabled={!fileUrl}
                href={fileUrl ?? undefined}
                target={fileUrl ? "_blank" : undefined}
              />
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
            </Space>
          );
        },
      },
    ],
    [handleDelete, handleUpload, uploadingId],
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
                <Link href={fileUrl} target="_blank" rel="noreferrer">
                  Buka Dokumen
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
    <Card
      bodyStyle={{ padding: 16 }}
      style={{
        borderRadius: 16,
        border: "none",
        background: "linear-gradient(135deg, #1d4ed8, #2563eb, #1e40af)",
        color: "#fff",
        boxShadow: "0 12px 28px rgba(30, 64, 175, 0.35)",
      }}
    >
      <Flex align="center" justify="space-between" style={{ width: "100%" }}>
        <Space align="center" size={12}>
          <Avatar
            size={44}
            icon={<TranslationOutlined />}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.35)",
            }}
          />
          <Space direction="vertical" size={0}>
            <Typography.Text style={{ color: "#dbeafe", fontSize: 12 }}>
              Translation Quota
            </Typography.Text>
            <Typography.Title level={4} style={{ color: "#fff", margin: 0 }}>
              {translation_quota}
            </Typography.Title>
          </Space>
        </Space>

        <Avatar
          size={36}
          icon={<PlusOutlined />}
          onClick={() => handleOpenModal()}
          style={{
            background: "#facc15",
            color: "#1e3a8a",
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.25)",
          }}
        />
      </Flex>
    </Card>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <TranslationHeader translation_quota={Number(translation_quota)} />

      <Card
        bodyStyle={{ padding: 16 }}
        style={{
          borderRadius: 16,
          borderColor: "#e2e8f0",
          boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Tabs
          defaultActiveKey="translation"
          items={[
            {
              key: "translation",
              label: "Dokumen Terjemahan",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
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
                </Space>
              ),
            },
            {
              key: "original",
              label: "Dokumen Asli",
              children: (
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
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
    </Space>
  );
}
