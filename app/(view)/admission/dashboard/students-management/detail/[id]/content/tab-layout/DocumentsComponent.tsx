"use client";

import { useCallback, useMemo, useState } from "react";
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Flex,
  Image,
  Input,
  Row,
  Space,
  Switch,
  Tag,
  Table,
  Typography,
} from "antd";
import {
  CameraOutlined,
  CheckCircleOutlined,
  CheckOutlined,
  CloseCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  FileImageOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  SignatureOutlined,
} from "@ant-design/icons";

import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { useAnswerDocumentApprovals } from "@/app/hooks/use-answer-document-approvals";
import { useAuth } from "@/app/utils/use-auth";
import type { AnswerDocumentApprovalsDataModel } from "@/app/models/answer-document-approvals";
import type { UserDataModel } from "@/app/models/user";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";

type DocumentsComponentProps = {
  student_id: string;
  student?: UserDataModel | null;
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

type ConsentData = {
  signed: boolean;
  signatureUrl: string;
  proofPhotoUrl: string;
  signedAt: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";

  const time = new Date(value);

  if (Number.isNaN(time.getTime())) return "-";

  return time.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getApprovalColor = (status?: string) => {
  const value = (status ?? "pending").toLowerCase();

  if (value === "approved") return "green";
  if (value === "rejected") return "red";
  if (value === "pending") return "gold";

  return "default";
};

const normalizeBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (value === 1) return true;

  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  return normalized === "true" || normalized === "1" || normalized === "yes";
};

const normalizeConsentData = (student?: UserDataModel | null): ConsentData => {
  return {
    signed: normalizeBoolean(student?.document_consent_signed),
    signatureUrl: String(student?.document_consent_signature_url ?? "").trim(),
    proofPhotoUrl: String(
      student?.document_consent_proof_photo_url ?? "",
    ).trim(),
    signedAt: String(student?.document_consent_signed_at ?? "").trim(),
  };
};

const getConsentStatusMeta = (isSigned: boolean) => {
  if (isSigned) {
    return {
      label: "Sudah ditandatangani",
      color: "green",
      icon: <CheckCircleOutlined />,
      description:
        "Student sudah menyetujui dan menandatangani surat pernyataan penyerahan dokumen.",
      alertBackground: "#f0fdf4",
      alertBorder: "#bbf7d0",
      alertColor: "#166534",
    };
  }

  return {
    label: "Belum ditandatangani",
    color: "red",
    icon: <CloseCircleOutlined />,
    description:
      "Student belum menyelesaikan tanda tangan surat pernyataan penyerahan dokumen.",
    alertBackground: "#fff7ed",
    alertBorder: "#fed7aa",
    alertColor: "#9a3412",
  };
};

function ConsentInfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 16,
        border: "1px solid #eef2f7",
        background: "#ffffff",
      }}
    >
      <Flex align="flex-start" gap={12}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            background: "#eef2ff",
            color: "#4f46e5",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            fontSize: 16,
          }}
        >
          {icon}
        </div>

        <div style={{ minWidth: 0 }}>
          <Typography.Text
            type="secondary"
            style={{
              display: "block",
              fontSize: 12,
              marginBottom: 2,
            }}
          >
            {label}
          </Typography.Text>

          <Typography.Text
            style={{
              color: "#0f172a",
              fontSize: 14,
              lineHeight: 1.5,
              wordBreak: "break-word",
            }}
          >
            {value || "-"}
          </Typography.Text>
        </div>
      </Flex>
    </div>
  );
}

function DocumentConsentCard({ student }: { student?: UserDataModel | null }) {
  const consent = useMemo(() => normalizeConsentData(student), [student]);
  const consentStatus = getConsentStatusMeta(consent.signed);

  return (
    <Card
      bodyStyle={{ padding: 18 }}
      style={{
        borderRadius: 18,
        borderColor: "#e2e8f0",
        boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
        background:
          "linear-gradient(135deg, #ffffff 0%, #fbfcff 55%, #f8f7ff 100%)",
      }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Flex align="flex-start" justify="space-between" gap={12}>
          <Space align="start" size={12}>
            <Avatar
              size={44}
              icon={<FileProtectOutlined />}
              style={{
                background: "#eef2ff",
                color: "#4f46e5",
              }}
            />

            <Space direction="vertical" size={2}>
              <Typography.Title level={5} style={{ marginBottom: 0 }}>
                Surat Pernyataan Penyerahan Dokumen
              </Typography.Title>

              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Ringkasan persetujuan dan bukti tanda tangan student.
              </Typography.Text>
            </Space>
          </Space>

          <Tag
            color={consentStatus.color}
            icon={consentStatus.icon}
            style={{
              borderRadius: 999,
              padding: "4px 10px",
              marginRight: 0,
              fontWeight: 600,
            }}
          >
            {consentStatus.label}
          </Tag>
        </Flex>

        <div
          style={{
            padding: 14,
            borderRadius: 18,
            background: consentStatus.alertBackground,
            border: `1px solid ${consentStatus.alertBorder}`,
          }}
        >
          <Typography.Text
            style={{
              display: "block",
              color: consentStatus.alertColor,
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {consentStatus.description}
          </Typography.Text>
        </div>

        {!student ? (
          <div
            style={{
              padding: 14,
              borderRadius: 18,
              background: "#fff7ed",
              border: "1px solid #fed7aa",
            }}
          >
            <Typography.Text
              style={{
                display: "block",
                color: "#9a3412",
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Data student belum dikirim ke komponen dokumen. Pastikan
              DocumentsComponent menerima props student.
            </Typography.Text>
          </div>
        ) : null}

        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <ConsentInfoItem
            icon={<SignatureOutlined />}
            label="Status Tanda Tangan"
            value={
              consent.signed ? "Sudah ditandatangani" : "Belum ditandatangani"
            }
          />

          <ConsentInfoItem
            icon={<FileTextOutlined />}
            label="Tanggal Ditandatangani"
            value={formatDate(consent.signedAt)}
          />

          <ConsentInfoItem
            icon={<FileImageOutlined />}
            label="File Tanda Tangan"
            value={
              consent.signatureUrl ? (
                <Typography.Text style={{ color: "#15803d" }}>
                  Tersedia
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary">
                  Belum tersedia
                </Typography.Text>
              )
            }
          />

          <ConsentInfoItem
            icon={<CameraOutlined />}
            label="Bukti Foto"
            value={
              consent.proofPhotoUrl ? (
                <Typography.Text style={{ color: "#15803d" }}>
                  Tersedia
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary">
                  Belum tersedia
                </Typography.Text>
              )
            }
          />
        </Space>

        <Divider style={{ margin: "4px 0" }} />

        {consent.signatureUrl ? (
          <div
            style={{
              padding: 14,
              borderRadius: 18,
              border: "1px solid #eef2f7",
              background: "#ffffff",
            }}
          >
            <Typography.Text
              strong
              style={{
                display: "block",
                marginBottom: 10,
                color: "#0f172a",
              }}
            >
              Preview Tanda Tangan
            </Typography.Text>

            <div
              style={{
                minHeight: 120,
                borderRadius: 14,
                border: "1px dashed #cbd5e1",
                background: "linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)",
                display: "grid",
                placeItems: "center",
                padding: 12,
                overflow: "hidden",
              }}
            >
              <Image
                src={consent.signatureUrl}
                alt="Tanda tangan surat pernyataan"
                style={{
                  maxHeight: 120,
                  objectFit: "contain",
                }}
                fallback=""
              />
            </div>
          </div>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Tanda tangan belum tersedia"
          />
        )}

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Button
            block
            icon={<EyeOutlined />}
            disabled={!consent.signatureUrl}
            href={consent.signatureUrl || undefined}
            target={consent.signatureUrl ? "_blank" : undefined}
            style={{
              height: 42,
              borderRadius: 14,
              fontWeight: 600,
            }}
          >
            Lihat Tanda Tangan
          </Button>

          <Button
            block
            icon={<CameraOutlined />}
            disabled={!consent.proofPhotoUrl}
            href={consent.proofPhotoUrl || undefined}
            target={consent.proofPhotoUrl ? "_blank" : undefined}
            style={{
              height: 42,
              borderRadius: 14,
              fontWeight: 600,
            }}
          >
            Lihat Bukti Foto
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

export default function DocumentsComponent({
  student_id,
  student,
}: DocumentsComponentProps) {
  const { notification } = App.useApp();
  const { user_id } = useAuth();

  const [docNoteDrafts, setDocNoteDrafts] = useState<Record<string, string>>(
    {},
  );
  const [savingDocApprovalId, setSavingDocApprovalId] = useState<string | null>(
    null,
  );
  const [savingDocApprovalStatus, setSavingDocApprovalStatus] = useState<
    string | null
  >(null);
  const [showPendingDocsOnly, setShowPendingDocsOnly] = useState(false);

  const { data: documentsManagement } = useDocuments({});
  const { data: answerDocuments, fetchLoading } = useAnswerDocuments({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });
  const { data: documentApprovals, onCreate: onCreateDocumentApproval } =
    useAnswerDocumentApprovals({
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

  const handleApproveDocument = useCallback(
    async (answerDocumentId: string, status: "approved" | "rejected") => {
      if (!user_id) {
        notification.error({
          message: "Reviewer tidak ditemukan",
          description: "Silakan login ulang sebagai admission.",
        });
        return;
      }

      setSavingDocApprovalId(answerDocumentId);
      setSavingDocApprovalStatus(status);

      try {
        const existing = documentApprovalMap.get(answerDocumentId);
        const noteValue =
          docNoteDrafts[answerDocumentId] ?? existing?.note ?? "";

        await onCreateDocumentApproval({
          answer_document_id: answerDocumentId,
          student_id,
          reviewer_id: user_id,
          status,
          note: noteValue ? noteValue : undefined,
        });

        notification.success({
          message:
            status === "approved"
              ? "Dokumen berhasil disetujui"
              : "Dokumen berhasil ditolak",
          description:
            status === "approved"
              ? "Status dokumen student sudah diperbarui."
              : "Status penolakan dokumen student sudah disimpan.",
        });
      } catch (error) {
        notification.error({
          message: "Gagal menyimpan approval dokumen",
          description:
            error instanceof Error ? error.message : "Coba lagi beberapa saat.",
        });
      } finally {
        setSavingDocApprovalId(null);
        setSavingDocApprovalStatus(null);
      }
    },
    [
      docNoteDrafts,
      documentApprovalMap,
      notification,
      onCreateDocumentApproval,
      student_id,
      user_id,
    ],
  );

  const documentColumns = useMemo(
    () => [
      {
        title: "Nama Dokumen",
        key: "name",
        render: (record: DocumentRow) => (
          <Space align="center" size={12}>
            <Avatar
              size={36}
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
        render: (value: string) => (
          <Tag
            color={getApprovalColor(value)}
            style={{
              borderRadius: 999,
              fontWeight: 600,
            }}
          >
            {(value ?? "pending").toUpperCase()}
          </Tag>
        ),
      },
      {
        title: "Tanggal Upload",
        dataIndex: "created_at",
        key: "upload_date",
        render: (value: string | null | undefined) => formatDate(value),
      },
      {
        title: "Validasi",
        key: "validation",
        render: (record: DocumentRow) => {
          const hasUrl = Boolean(record.file_url);

          return (
            <Space size={8}>
              <Button
                shape="circle"
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
              />

              <Button
                shape="circle"
                type="default"
                icon={<CheckOutlined />}
                onClick={() =>
                  handleApproveDocument(String(record.id), "approved")
                }
                loading={
                  savingDocApprovalId === String(record.id) &&
                  savingDocApprovalStatus === "approved"
                }
              />

              <Button
                shape="circle"
                danger
                icon={<CloseOutlined />}
                onClick={() =>
                  handleApproveDocument(String(record.id), "rejected")
                }
                loading={
                  savingDocApprovalId === String(record.id) &&
                  savingDocApprovalStatus === "rejected"
                }
              />
            </Space>
          );
        },
      },
    ],
    [handleApproveDocument, savingDocApprovalId, savingDocApprovalStatus],
  );

  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} xl={16}>
        <Card
          bodyStyle={{ padding: 18 }}
          style={{
            borderRadius: 18,
            borderColor: "#e2e8f0",
            boxShadow: "0 10px 26px rgba(15, 23, 42, 0.05)",
          }}
          loading={fetchLoading}
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Flex align="center" justify="space-between" gap={16} wrap>
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
            </Flex>

            {filteredItems.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  showPendingDocsOnly
                    ? "Tidak ada dokumen pending."
                    : "Belum ada dokumen yang diunggah."
                }
              />
            ) : (
              <Table
                columns={documentColumns}
                dataSource={documentRows}
                rowKey={(record) => String(record.id ?? record.label ?? "")}
                pagination={false}
                expandable={{
                  expandedRowRender: (record: DocumentRow) => (
                    <Space
                      direction="vertical"
                      size={8}
                      style={{ width: "100%" }}
                    >
                      <Typography.Text type="secondary">
                        Catatan approval dokumen
                      </Typography.Text>

                      <Input.TextArea
                        value={
                          docNoteDrafts[String(record.id)] ??
                          record.approval_note ??
                          ""
                        }
                        onChange={(event) =>
                          setDocNoteDrafts((prev) => ({
                            ...prev,
                            [String(record.id)]: event.target.value,
                          }))
                        }
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        placeholder="Catatan approval dokumen (opsional)"
                        style={{ maxWidth: 520 }}
                      />
                    </Space>
                  ),
                  expandRowByClick: true,
                  showExpandColumn: false,
                }}
              />
            )}
          </Space>
        </Card>
      </Col>

      <Col xs={24} xl={8}>
        <DocumentConsentCard student={student} />
      </Col>
    </Row>
  );
}
