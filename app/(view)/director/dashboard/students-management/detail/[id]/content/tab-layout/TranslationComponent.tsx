"use client";

import { useMemo } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
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
          >
            Lihat Dokumen Asli
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
            >
              Lihat Hasil Translate
            </Button>
          </Space>
        ),
      },
    ],
    [],
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            styles={{ body: { padding: 20 } }}
            style={{
              borderRadius: 16,
              borderColor: "#dbeafe",
              boxShadow: "0 10px 24px rgba(37, 99, 235, 0.08)",
            }}
          >
            <Space align="center" size={12}>
              <Avatar
                size={42}
                icon={<TranslationOutlined />}
                style={{ background: "#dbeafe", color: "#2563eb" }}
              />
              <Space direction="vertical" size={0}>
                <Typography.Text type="secondary">
                  Sudah di-translate
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {translatedCount}
                </Typography.Title>
              </Space>
            </Space>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            styles={{ body: { padding: 20 } }}
            style={{
              borderRadius: 16,
              borderColor: "#e5e7eb",
              boxShadow: "0 10px 24px rgba(15, 23, 42, 0.05)",
            }}
          >
            <Space align="center" size={12}>
              <Avatar
                size={42}
                icon={<CheckCircleFilled />}
                style={{ background: "#f3f4f6", color: "#6b7280" }}
              />
              <Space direction="vertical" size={0}>
                <Typography.Text type="secondary">
                  Belum di-translate
                </Typography.Text>
                <Typography.Title level={3} style={{ margin: 0 }}>
                  {notTranslatedCount}
                </Typography.Title>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        styles={{ body: { padding: 16 } }}
        style={{
          borderRadius: 16,
          borderColor: "#e2e8f0",
          boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
        }}
      >
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <Space direction="vertical" size={2}>
            <Typography.Title level={5} style={{ marginBottom: 0 }}>
              Status Dokumen Translation
            </Typography.Title>
            <Typography.Text type="secondary">
              Director dapat melihat dokumen asli, hasil translate, dan status
              apakah dokumen tersebut sudah diterjemahkan atau belum.
            </Typography.Text>
          </Space>

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
        </Space>
      </Card>
    </Space>
  );
}
