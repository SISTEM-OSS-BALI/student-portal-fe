"use client";

import { useMemo } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  CheckCircleFilled,
  EyeOutlined,
  FileTextOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useDocumentTranslations } from "@/app/hooks/use-document-translations";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";
import styles from "../detail.module.css";

type TranslationComponentProps = {
  student_id: string;
  student_name: string;
  student_country: string;
  translation_quota: string | number;
};

type TranslationRow = {
  key: string;
  document_id: string;
  label: string;
  original_file_url?: string | null;
  original_file_name?: string | null;
  translated_file_url?: string | null;
  translated_file_name?: string | null;
  updated_at?: string | null;
  status: "translated" | "not_translated";
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const getStatusColor = (status: TranslationRow["status"]) => {
  if (status === "translated") return "green";
  return "default";
};

const getStatusLabel = (status: TranslationRow["status"]) => {
  if (status === "translated") return "Sudah Diterjemahkan";
  return "Belum Diterjemahkan";
};

export default function TranslationComponent({
  student_id,
}: TranslationComponentProps) {
  const { data: documentsManagement = [] } = useDocuments({});
  const { data: answerDocuments = [] } = useAnswerDocuments({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });
  const { data: documentTranslations = [] } = useDocumentTranslations({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });

  const translationRequiredDocuments = useMemo(() => {
    return documentsManagement.filter(
      (doc) => String(doc.translation_needed ?? "").toLowerCase() === "yes",
    );
  }, [documentsManagement]);

  const answerDocumentMap = useMemo(() => {
    const map = new Map<string, (typeof answerDocuments)[number]>();
    answerDocuments.forEach((item) => {
      if (!item?.document_id) return;
      map.set(String(item.document_id), item);
    });
    return map;
  }, [answerDocuments]);

  const translationMap = useMemo(() => {
    const map = new Map<string, (typeof documentTranslations)[number]>();
    documentTranslations.forEach((item) => {
      if (!item?.document_id) return;
      map.set(String(item.document_id), item);
    });
    return map;
  }, [documentTranslations]);

  const rows = useMemo<TranslationRow[]>(() => {
    return translationRequiredDocuments.map((doc) => {
      const documentId = String(doc.id);
      const originalDocument = answerDocumentMap.get(documentId);
      const translatedDocument = translationMap.get(documentId);
      const isTranslated = Boolean(translatedDocument?.file_url);

      return {
        key: documentId,
        document_id: documentId,
        label: doc.label ?? documentId,
        original_file_url: originalDocument?.file_url ?? null,
        original_file_name: originalDocument?.file_name ?? null,
        translated_file_url: translatedDocument?.file_url ?? null,
        translated_file_name: translatedDocument?.file_name ?? null,
        updated_at: translatedDocument?.updated_at ?? originalDocument?.updated_at ?? null,
        status: isTranslated ? "translated" : "not_translated",
      };
    });
  }, [answerDocumentMap, translationMap, translationRequiredDocuments]);

  const translatedCount = useMemo(
    () => rows.filter((row) => row.status === "translated").length,
    [rows],
  );

  const notTranslatedCount = useMemo(
    () => rows.filter((row) => row.status === "not_translated").length,
    [rows],
  );

  const columns = useMemo<ColumnsType<TranslationRow>>(
    () => [
      {
        title: "Document Name",
        dataIndex: "label",
        key: "label",
        render: (_, record) => (
          <Space align="center" size={10}>
            <Avatar
              size={28}
              icon={<FileTextOutlined />}
              style={{ background: "#eef2ff", color: "#4f46e5" }}
            />
            <Typography.Text strong>{record.label}</Typography.Text>
          </Space>
        ),
      },
      {
        title: "Status Translation",
        dataIndex: "status",
        key: "status",
        render: (value: TranslationRow["status"]) => (
          <Tag color={getStatusColor(value)}>{getStatusLabel(value)}</Tag>
        ),
      },
      {
        title: "Updated At",
        dataIndex: "updated_at",
        key: "updated_at",
        render: (value: string | null | undefined) => formatDate(value),
      },
      {
        title: "Dokumen Asli",
        key: "original_preview",
        render: (_, record) => (
          <Button
            icon={<EyeOutlined />}
            disabled={!record.original_file_url}
            href={
              record.original_file_url
                ? buildFilePreviewUrl(
                    record.original_file_url,
                    record.original_file_name ?? `${record.label}.pdf`,
                  )
                : undefined
            }
            target={record.original_file_url ? "_blank" : undefined}
            style={{ borderRadius: 8 }}
          >
            Lihat Asli
          </Button>
        ),
      },
      {
        title: "Dokumen Translate",
        key: "translated_preview",
        render: (_, record) => (
          <Space size={8}>
            <Button
              icon={<EyeOutlined />}
              disabled={!record.translated_file_url}
              href={
                record.translated_file_url
                  ? buildFilePreviewUrl(
                      record.translated_file_url,
                      record.translated_file_name ??
                        `${record.label}-translation.pdf`,
                    )
                  : undefined
              }
              target={record.translated_file_url ? "_blank" : undefined}
              style={{ borderRadius: 8 }}
            >
              Lihat Terjemahan
            </Button>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: "100%", minWidth: 0 }}>
      {/* Standardized Section Header Card */}
      <Card
        className={styles.sectionHeaderCard}
        styles={{ body: { padding: 0 } }}
      >
        <Flex justify="space-between" align="center" gap={12}>
          <Flex align="center" gap={12} style={{ minWidth: 0, flex: "1 1 auto" }}>
            <div className={styles.sectionHeaderIcon}>
              <TranslationOutlined />
            </div>
            <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <div className={styles.sectionHeaderTitle}>
                Penerjemahan Tersumpah
              </div>
              <div className={styles.sectionHeaderSubtitle}>
                Dokumen terjemahan resmi mahasiswa
              </div>
            </div>
          </Flex>

          <Tag
            color="blue"
            style={{
              margin: 0,
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              padding: "1px 8px",
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              flexShrink: 0,
            }}
          >
            {translatedCount} Selesai · {notTranslatedCount} Belum
          </Tag>
        </Flex>
      </Card>

      <Card
        styles={{ body: { padding: 16 } }}
        style={{
          borderRadius: 16,
          borderColor: "#e2e8f0",
          boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
          width: "100%",
          overflow: "hidden",
        }}
      >
        {/* Desktop Table View */}
        <div className={styles.desktopTableOnly}>
          <Table
            columns={columns}
            dataSource={rows}
            rowKey="key"
            pagination={false}
            locale={{
              emptyText: "Tidak ada dokumen yang membutuhkan translation.",
            }}
            scroll={{ x: 760 }}
          />
        </div>

        {/* Mobile Responsive Cards View */}
        <div className={styles.mobileCardListOnly}>
          {rows.length === 0 ? (
            <div style={{ textAlign: "center", padding: "16px 0", color: "#64748b" }}>
              Tidak ada dokumen yang membutuhkan translation.
            </div>
          ) : (
            rows.map((row) => (
              <div
                key={row.key}
                style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "12px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <Typography.Text strong style={{ fontSize: 13.5, color: "#0f172a", flex: 1 }}>
                    {row.label}
                  </Typography.Text>
                  <Tag
                    color={getStatusColor(row.status)}
                    style={{ margin: 0, fontSize: 10.5, borderRadius: 6, fontWeight: 600, padding: "1px 6px" }}
                  >
                    {getStatusLabel(row.status)}
                  </Tag>
                </div>

                {row.updated_at && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Diperbarui {formatDate(row.updated_at)}
                  </Typography.Text>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    disabled={!row.original_file_url}
                    href={
                      row.original_file_url
                        ? buildFilePreviewUrl(row.original_file_url, row.original_file_name ?? `${row.label}.pdf`)
                        : undefined
                    }
                    target={row.original_file_url ? "_blank" : undefined}
                    style={{ flex: 1, borderRadius: 6, height: 32, fontSize: 12 }}
                  >
                    Lihat Asli
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    icon={<EyeOutlined />}
                    disabled={!row.translated_file_url}
                    href={
                      row.translated_file_url
                        ? buildFilePreviewUrl(row.translated_file_url, row.translated_file_name ?? `${row.label}-translation.pdf`)
                        : undefined
                    }
                    target={row.translated_file_url ? "_blank" : undefined}
                    style={{ flex: 1, borderRadius: 6, height: 32, fontSize: 12, background: "#1b3d6d", borderColor: "#1b3d6d" }}
                  >
                    Lihat Terjemahan
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
