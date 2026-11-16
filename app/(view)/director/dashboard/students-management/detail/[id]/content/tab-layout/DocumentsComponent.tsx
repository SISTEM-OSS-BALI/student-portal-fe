"use client";

import { useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  Col,
  Flex,
  Row,
  Space,
  Switch,
  Tag,
  Table,
  Typography,
} from "antd";
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { useAnswerDocumentApprovals } from "@/app/hooks/use-answer-document-approvals";
import type { AnswerDocumentApprovalsDataModel } from "@/app/models/answer-document-approvals";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";
import styles from "../detail.module.css";

type DocumentsComponentProps = {
  student_id: string;
};

type DocumentRow = {
  id?: string;
  label?: string;
  file_url?: string | null;
  file_name?: string | null;
  created_at?: string | null;
  status?: string | null;
  approval_status?: string;
  approval_note?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "-";
  return time.toLocaleString();
};

const getApprovalColor = (status?: string) => {
  const value = (status ?? "pending").toLowerCase();
  if (value === "approved") return "green";
  if (value === "rejected") return "red";
  if (value === "pending") return "gold";
  return "default";
};

export default function DocumentsComponent({
  student_id,
}: DocumentsComponentProps) {
  const [showPendingDocsOnly, setShowPendingDocsOnly] = useState(false);

  const { data: documentsManagement } = useDocuments({});
  const { data: answerDocuments, fetchLoading } = useAnswerDocuments({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });
  const { data: documentApprovals } = useAnswerDocumentApprovals({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });

  const documentLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    (documentsManagement ?? []).forEach((doc) => {
      if (!doc?.id) return;
      map.set(String(doc.id), doc.label ?? String(doc.id));
    });
    return map;
  }, [documentsManagement]);

  const documentApprovalMap = useMemo(() => {
    const map = new Map<string, AnswerDocumentApprovalsDataModel>();
    (documentApprovals ?? []).forEach((approval) => {
      if (!approval?.answer_document_id) return;
      map.set(String(approval.answer_document_id), approval);
    });
    return map;
  }, [documentApprovals]);

  const items = useMemo(() => {
    const list = (answerDocuments ?? []).map((item) => ({
      ...item,
      label: documentLabelMap.get(String(item.document_id)) ?? item.document_id,
    }));
    return list.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  }, [answerDocuments, documentLabelMap]);

  const filteredItems = useMemo(() => {
    if (!showPendingDocsOnly) return items;
    return items.filter((item) => {
      const status =
        documentApprovalMap.get(String(item.id))?.status ?? "pending";
      return status.toLowerCase() === "pending";
    });
  }, [documentApprovalMap, items, showPendingDocsOnly]);

  const documentRows: DocumentRow[] = useMemo(() => {
    return filteredItems.map((item) => {
      const approval = documentApprovalMap.get(String(item.id));
      return {
        id: String(item.id),
        label: item.label,
        file_url: item.file_url,
        file_name: item.file_name,
        created_at: item.created_at,
        status: item.status,
        approval_status: approval?.status ?? "pending",
        approval_note: approval?.note ?? "",
      };
    });
  }, [documentApprovalMap, filteredItems]);

  const documentColumns = useMemo(
    () => [
      {
        title: "Document Name",
        key: "name",
        render: (record: DocumentRow) => (
          <Space align="center" size={12}>
            <Avatar
              size={32}
              icon={<FileTextOutlined />}
              style={{ background: "#f1f5f9", color: "#64748b" }}
            />
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{record.label}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {record.file_name ?? "Dokumen"}
              </Typography.Text>
            </Space>
          </Space>
        ),
      },
      {
        title: "Status",
        dataIndex: "approval_status",
        key: "status",
        render: (value: string) => {
          const raw = (value ?? "pending").toLowerCase();
          if (raw === "approved") {
            return (
              <Tag
                color="success"
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                }}
              >
                <CheckOutlined style={{ fontSize: 10 }} /> Disetujui
              </Tag>
            );
          }
          if (raw === "rejected") {
            return (
              <Tag
                color="error"
                style={{
                  margin: 0,
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 10px",
                }}
              >
                <CloseOutlined style={{ fontSize: 10 }} /> Perlu Revisi
              </Tag>
            );
          }
          return (
            <Tag
              style={{
                margin: 0,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 10px",
                color: "#64748b",
                background: "#f1f5f9",
                borderColor: "#e2e8f0",
              }}
            >
              <ClockCircleOutlined style={{ fontSize: 10 }} /> Menunggu
            </Tag>
          );
        },
      },
      {
        title: "Upload Date",
        dataIndex: "created_at",
        key: "upload_date",
        render: (value: string | null | undefined) => formatDate(value),
      },
      {
        title: "Lihat",
        key: "preview",
        render: (record: DocumentRow) => {
          const hasUrl = Boolean(record.file_url);
          return (
            <Space size={8}>
              <Button
                icon={<EyeOutlined />}
                disabled={!hasUrl}
                href={
                  hasUrl
                    ? buildFilePreviewUrl(
                        record.file_url,
                        record.file_name ?? `${record.label ?? "document"}.pdf`,
                      )
                    : undefined
                }
                target={hasUrl ? "_blank" : undefined}
                style={{ borderRadius: 8, fontSize: 13 }}
              >
                Lihat
              </Button>
            </Space>
          );
        },
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
        <Flex align="center" gap={12} style={{ minWidth: 0, width: "100%" }}>
          <div className={styles.sectionHeaderIcon}>
            <FolderOpenOutlined />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div className={styles.sectionHeaderTitle}>
              Dokumen Persyaratan
            </div>
            <div className={styles.sectionHeaderSubtitle}>
              Daftar kelayakan berkas mahasiswa
            </div>
          </div>
        </Flex>
      </Card>

      <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
      <Col xs={24} xl={16}>
        <Card
          styles={{ body: { padding: 16 } }}
          style={{
            borderRadius: 16,
            borderColor: "#e2e8f0",
            boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
          }}
          loading={fetchLoading}
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space direction="vertical" size={2}>
              <Typography.Title level={5} style={{ marginBottom: 0 }}>
                Required Documents
              </Typography.Title>
              <Typography.Text type="secondary">
                Daftar dokumen yang wajib diunggah oleh student.
              </Typography.Text>
            </Space>

            <Space align="center" size={8}>
              <Switch
                checked={showPendingDocsOnly}
                onChange={setShowPendingDocsOnly}
              />
              <Typography.Text>Hanya pending</Typography.Text>
            </Space>

            {filteredItems.length === 0 ? (
              <Typography.Text type="secondary">
                {showPendingDocsOnly
                  ? "Tidak ada dokumen pending."
                  : "Belum ada dokumen yang diunggah."}
              </Typography.Text>
            ) : (
              <Table
                columns={documentColumns}
                dataSource={documentRows}
                rowKey={(record) => String(record.id ?? record.label ?? "")}
                pagination={false}
                scroll={{ x: 600 }}
                expandable={{
                  expandedRowRender: (record: DocumentRow) => (
                    <Space direction="vertical" size={8} style={{ width: "100%" }}>
                      <Typography.Text type="secondary">
                        Catatan approval dokumen
                      </Typography.Text>
                      <Typography.Paragraph
                        style={{ marginBottom: 0, maxWidth: 520 }}
                      >
                        {record.approval_note?.trim() || "Belum ada catatan approval."}
                      </Typography.Paragraph>
                    </Space>
                  ),
                  expandRowByClick: true,
                  showExpandColumn: false,
                  rowExpandable: (record: DocumentRow) =>
                    Boolean(record.approval_note?.trim()),
                }}
              />
            )}
          </Space>
        </Card>
      </Col>
      <Col xs={24} xl={8}>
        <Card styles={{ body: { padding: 24 } }}>
          <Space direction="vertical" size={12}>
            <Typography.Title level={5} style={{ marginBottom: 0 }}>
              Surat Pernyataan Penyerahaan dokumen
            </Typography.Title>
            <Typography.Text type="secondary">
              1. Periksa nama file dan jenis dokumen untuk memastikan kesesuaian
              dengan persyaratan.
            </Typography.Text>
          </Space>
        </Card>
      </Col>
    </Row>
    </div>
  );
}
