"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Divider,
  Empty,
  Flex,
  Image,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckCircleFilled,
  CheckCircleOutlined,
  CheckOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  CloseCircleFilled,
  CloseCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  ExportOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileProtectOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  SignatureOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useAnswerDocumentApprovals } from "@/app/hooks/use-answer-document-approvals";
import { useAuth } from "@/app/utils/use-auth";
import type { AnswerDocumentApprovalsDataModel } from "@/app/models/answer-document-approvals";
import type { UserDataModel } from "@/app/models/user";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";
import styles from "../detail.module.css";

const { Title, Text } = Typography;

type DocumentsComponentProps = {
  student_id: string;
  student?: UserDataModel | null;
};

type DocumentStateItem = {
  id: string;
  label: string;
  internal_code?: string;
  required: boolean;
  translation_needed?: string;
  answer_document_id?: string;
  file_url?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  created_at?: string | null;
  status?: string | null;
  approval_status: "approved" | "rejected" | "pending" | "not_uploaded";
  approval_note?: string | null;
  is_verified_signature?: boolean;
};

type StatementLetterData = {
  submitted: boolean;
  signatureUrl: string;
  fileName: string;
  submittedAt: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const time = new Date(value);
  if (Number.isNaN(time.getTime())) return "-";
  const formatted = time.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return formatted.replace(/\./g, ":");
};

const normalizeBoolean = (value: unknown): boolean => {
  if (value === true) return true;
  if (value === 1) return true;
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
};

const normalizeStatementLetterData = (
  student?: UserDataModel | null,
): StatementLetterData => {
  return {
    submitted: normalizeBoolean(student?.statement_letter_submitted),
    signatureUrl: String(student?.statement_letter_file_url ?? "").trim(),
    fileName: String(student?.statement_letter_file_name ?? "").trim(),
    submittedAt: String(student?.statement_letter_submitted_at ?? "").trim(),
  };
};

const getStatementLetterStatusMeta = (isSubmitted: boolean) => {
  if (isSubmitted) {
    return {
      label: "Sudah ditandatangani",
      color: "green",
      icon: <CheckCircleOutlined />,
      description:
        "Student sudah membaca, menyetujui, dan menandatangani surat pernyataan perpanjangan visa.",
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
      "Student belum menyelesaikan tanda tangan surat pernyataan perpanjangan visa.",
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
        padding: 12,
        borderRadius: 12,
        border: "1px solid #f1f5f9",
        background: "#f8fafc",
      }}
    >
      <Flex align="center" gap={10}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#eff6ff",
            color: "#2563eb",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            fontSize: 15,
          }}
        >
          {icon}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <Text type="secondary" style={{ display: "block", fontSize: 11, marginBottom: 1 }}>
            {label}
          </Text>
          <Text strong style={{ color: "#0f172a", fontSize: 13, wordBreak: "break-word" }}>
            {value || "-"}
          </Text>
        </div>
      </Flex>
    </div>
  );
}

function StatementLetterCard({
  student,
  onPreviewSignature,
}: {
  student?: UserDataModel | null;
  onPreviewSignature?: (url: string) => void;
}) {
  const statementLetter = useMemo(
    () => normalizeStatementLetterData(student),
    [student],
  );
  const statementLetterStatus = getStatementLetterStatusMeta(
    statementLetter.submitted,
  );

  return (
    <Card
      styles={{ body: { padding: 18 } }}
      style={{
        borderRadius: 16,
        borderColor: "#e2e8f0",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        background: "#ffffff",
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
      }}
    >
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
          <Space align="start" size={10}>
            <Avatar
              size={40}
              icon={<FileProtectOutlined />}
              style={{
                background: "#eff6ff",
                color: "#2563eb",
              }}
            />

            <div>
              <Title level={5} style={{ marginBottom: 2, fontSize: 15, color: "#0f172a" }}>
                Surat Pernyataan Visa
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Persetujuan dan tanda tangan student.
              </Text>
            </div>
          </Space>

          <Tag
            color={statementLetterStatus.color}
            icon={statementLetterStatus.icon}
            style={{
              borderRadius: 999,
              padding: "2px 10px",
              marginRight: 0,
              fontWeight: 600,
              fontSize: 11,
            }}
          >
            {statementLetterStatus.label}
          </Tag>
        </Flex>

        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            background: statementLetterStatus.alertBackground,
            border: `1px solid ${statementLetterStatus.alertBorder}`,
          }}
        >
          <Text
            style={{
              display: "block",
              color: statementLetterStatus.alertColor,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            {statementLetterStatus.description}
          </Text>
        </div>

        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <ConsentInfoItem
            icon={<SignatureOutlined />}
            label="Status Tanda Tangan"
            value={
              statementLetter.submitted
                ? "Sudah ditandatangani"
                : "Belum ditandatangani"
            }
          />

          <ConsentInfoItem
            icon={<FileTextOutlined />}
            label="Waktu Submit"
            value={formatDate(statementLetter.submittedAt)}
          />

          <ConsentInfoItem
            icon={<FileImageOutlined />}
            label="File Tanda Tangan"
            value={
              statementLetter.signatureUrl ? (
                <Text style={{ color: "#16a34a" }}>Tersedia</Text>
              ) : (
                <Text type="secondary">Belum tersedia</Text>
              )
            }
          />
        </Space>

        <Divider style={{ margin: "4px 0" }} />

        {statementLetter.signatureUrl ? (
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              background: "#ffffff",
            }}
          >
            <Text
              strong
              style={{
                display: "block",
                marginBottom: 8,
                fontSize: 12,
                color: "#0f172a",
              }}
            >
              Lihat Tanda Tangan
            </Text>

            <div
              style={{
                minHeight: 100,
                borderRadius: 8,
                border: "1px dashed #cbd5e1",
                background: "#f8fafc",
                display: "grid",
                placeItems: "center",
                padding: 10,
                overflow: "hidden",
              }}
            >
              <Image
                src={statementLetter.signatureUrl}
                alt="Tanda tangan surat pernyataan"
                style={{
                  maxHeight: 100,
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

        <Button
          block
          icon={<EyeOutlined />}
          disabled={!statementLetter.signatureUrl}
          onClick={() => {
            if (statementLetter.signatureUrl) {
              onPreviewSignature?.(statementLetter.signatureUrl);
            }
          }}
          style={{
            height: 38,
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Lihat Tanda Tangan
        </Button>
      </Space>
    </Card>
  );
}

async function downloadSingleFile(url: string, fileName: string): Promise<void> {
  try {
    const response = await fetch(url, { mode: "cors" });
    if (!response.ok) throw new Error("Gagal mengambil file");
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);
  } catch {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export default function DocumentsComponent({
  student_id,
  student,
}: DocumentsComponentProps) {
  const { notification, message } = App.useApp();
  const { user_id, role } = useAuth();
  const normalizedRole = (role ?? "").toLowerCase();
  const isConsultant = normalizedRole === "consultant";
  const isDirector = normalizedRole === "director";
  const canApprove = !isConsultant && !isDirector;
  const queryClient = useQueryClient();

  const [docNoteDrafts, setDocNoteDrafts] = useState<Record<string, string>>({});
  const [rejectModalDoc, setRejectModalDoc] = useState<DocumentStateItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [savingDocApprovalId, setSavingDocApprovalId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<
    "all" | "pending" | "approved" | "rejected" | "not_uploaded"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection mode & multiple download/delete states
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [downloadConfirmModalOpen, setDownloadConfirmModalOpen] = useState(false);
  const [docsToDownload, setDocsToDownload] = useState<DocumentStateItem[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  // Multiple delete states
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [docsToDelete, setDocsToDelete] = useState<DocumentStateItem[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  // Mobile viewport detection
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{
    url: string;
    rawUrl?: string;
    name?: string;
    label: string;
    type?: string;
  } | null>(null);
  const [imgError, setImgError] = useState(false);
  const [htmlPreviewContent, setHtmlPreviewContent] = useState<string | null>(null);
  const [htmlPreviewLoading, setHtmlPreviewLoading] = useState(false);

  const handleOpenPreview = useCallback(
    (url: string, name?: string, label?: string, type?: string, rawUrl?: string) => {
      setImgError(false);
      setPreviewItem({
        url,
        rawUrl: rawUrl || url,
        name: name || label || "Berkas Dokumen",
        label: label || "Dokumen",
        type,
      });
      setPreviewModalOpen(true);
    },
    [],
  );

  useEffect(() => {
    if (!previewModalOpen || !previewItem?.url) {
      setHtmlPreviewContent(null);
      setHtmlPreviewLoading(false);
      return;
    }

    const urlLower = previewItem.url.toLowerCase();
    const nameLower = (previewItem.name || "").toLowerCase();
    const typeLower = (previewItem.type || "").toLowerCase();
    const isHtml =
      urlLower.includes(".html") ||
      urlLower.includes(".htm") ||
      nameLower.endsWith(".html") ||
      nameLower.endsWith(".htm") ||
      typeLower.includes("html") ||
      nameLower.includes("_cv");

    if (isHtml) {
      setHtmlPreviewLoading(true);
      fetch(previewItem.url)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil berkas HTML");
          return res.text();
        })
        .then((html) => {
          setHtmlPreviewContent(html);
        })
        .catch(() => {
          setHtmlPreviewContent(null);
        })
        .finally(() => {
          setHtmlPreviewLoading(false);
        });
    } else {
      setHtmlPreviewContent(null);
      setHtmlPreviewLoading(false);
    }
  }, [previewModalOpen, previewItem]);

  const { data: documentsManagement = [], fetchLoading: masterDocsLoading } = useDocuments({});
  const { data: stages = [], fetchLoading: stagesLoading } = useStagesManagement({});
  const {
    data: answerDocuments = [],
    fetchLoading: answerDocsLoading,
    onDelete: onDeleteAnswerDocument,
  } = useAnswerDocuments({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });
  const { data: documentApprovals = [], onCreate: onCreateDocumentApproval } =
    useAnswerDocumentApprovals({
      queryString: student_id ? `student_id=${student_id}` : undefined,
      enabled: Boolean(student_id),
    });

  const documentApprovalMap = useMemo(() => {
    const map = new Map<string, AnswerDocumentApprovalsDataModel>();
    (documentApprovals ?? []).forEach((approval) => {
      if (!approval?.answer_document_id) return;
      map.set(String(approval.answer_document_id), approval);
    });
    return map;
  }, [documentApprovals]);

  const latestAnswerByDocumentId = useMemo(() => {
    const map = new Map<string, (typeof answerDocuments)[number]>();
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

  // Susun daftar dokumen persyaratan sesuai negara student (selaras 100% dengan Student Dashboard)
  const allDocumentsWithState: DocumentStateItem[] = useMemo(() => {
    const countryId = student?.stage?.country_id;

    const stageDocs = countryId
      ? (stages ?? [])
          .filter((stage) => stage.country_id === countryId)
          .map((stage) => stage.document)
          .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
      : [];

    const docMap = new Map<string, {
      id: string;
      label: string;
      internal_code?: string;
      required: boolean;
      translation_needed?: string;
    }>();

    if (stageDocs.length > 0) {
      stageDocs.forEach((doc) => {
        if (doc?.id) {
          const idStr = String(doc.id);
          const masterMatch = (documentsManagement ?? []).find((d) => String(d.id) === idStr);
          const isReq = masterMatch !== undefined ? Boolean(masterMatch.required) : Boolean(doc.required);
          docMap.set(idStr, {
            id: idStr,
            label: doc.label ?? idStr,
            internal_code: doc.internal_code,
            required: isReq,
            translation_needed: doc.translation_needed,
          });
        }
      });
    } else {
      (documentsManagement ?? []).forEach((doc) => {
        if (doc?.id) {
          docMap.set(String(doc.id), {
            id: String(doc.id),
            label: doc.label ?? String(doc.id),
            internal_code: doc.internal_code,
            required: Boolean(doc.required),
            translation_needed: doc.translation_needed,
          });
        }
      });
    }

    // Pastikan berkas yang pernah diunggah selalu terdaftar
    (answerDocuments ?? []).forEach((ans) => {
      const docIdStr = String(ans.document_id);
      if (!docMap.has(docIdStr)) {
        const foundMaster = (documentsManagement ?? []).find((d) => String(d.id) === docIdStr);
        if (foundMaster) {
          docMap.set(docIdStr, {
            id: docIdStr,
            label: foundMaster.label ?? docIdStr,
            internal_code: foundMaster.internal_code,
            required: Boolean(foundMaster.required),
            translation_needed: foundMaster.translation_needed,
          });
        } else {
          docMap.set(docIdStr, {
            id: docIdStr,
            label: ans.file_name ?? "Dokumen Mahasiswa",
            required: false,
          });
        }
      }
    });

    const studentSignatureUrl =
      student?.document_consent_signature_url ||
      student?.statement_letter_file_url;

    return Array.from(docMap.values()).map((doc) => {
      const docIdStr = String(doc.id);
      const submitted =
        latestAnswerByDocumentId.get(docIdStr) ??
        (doc.internal_code ? latestAnswerByDocumentId.get(doc.internal_code) : undefined);

      const isStudentSignDoc = docIdStr === "doc_sign" || doc.internal_code === "STUDENT_SIGN";

      let fileUrl = submitted?.file_url ?? null;
      let fileName = submitted?.file_name ?? null;
      let createdAt = submitted?.created_at ?? null;
      let answerDocId = submitted?.id ? String(submitted.id) : undefined;
      let isVerifiedSignature = false;

      // Fallback otomatis tanda tangan onboarding
      if (!fileUrl && isStudentSignDoc && studentSignatureUrl) {
        fileUrl = studentSignatureUrl;
        fileName = "Tanda Tangan Digital Mahasiswa (Terverifikasi Onboarding)";
        createdAt = student?.created_at ?? null;
        isVerifiedSignature = true;
      }

      let approvalStatus: DocumentStateItem["approval_status"] = "not_uploaded";
      let approvalNote: string | null = null;

      if (fileUrl) {
        if (isVerifiedSignature) {
          approvalStatus = "approved";
          approvalNote = "Terverifikasi otomatis dari proses onboarding akun.";
        } else if (answerDocId) {
          const approval = documentApprovalMap.get(answerDocId);
          const rawStatus = (approval?.status ?? "pending").toLowerCase();
          if (rawStatus === "approved") approvalStatus = "approved";
          else if (rawStatus === "rejected") approvalStatus = "rejected";
          else approvalStatus = "pending";
          approvalNote = approval?.note ?? null;
        } else {
          approvalStatus = "pending";
        }
      }

      return {
        id: docIdStr,
        label: doc.label,
        internal_code: doc.internal_code,
        required: doc.required,
        translation_needed: doc.translation_needed,
        answer_document_id: answerDocId,
        file_url: fileUrl,
        file_name: fileName,
        created_at: createdAt,
        status: submitted?.status ?? (fileUrl ? "done" : null),
        approval_status: approvalStatus,
        approval_note: approvalNote,
        is_verified_signature: isVerifiedSignature,
      };
    });
  }, [
    student?.stage?.country_id,
    student?.document_consent_signature_url,
    student?.statement_letter_file_url,
    student?.created_at,
    stages,
    documentsManagement,
    answerDocuments,
    latestAnswerByDocumentId,
    documentApprovalMap,
  ]);

  // Ringkasan Metrics
  const totalDocs = allDocumentsWithState.length;
  const uploadedDocs = allDocumentsWithState.filter((d) => Boolean(d.file_url)).length;
  const approvedDocs = allDocumentsWithState.filter((d) => d.approval_status === "approved").length;
  const rejectedDocs = allDocumentsWithState.filter((d) => d.approval_status === "rejected").length;
  const pendingReviewDocs = allDocumentsWithState.filter((d) => d.approval_status === "pending").length;
  const notUploadedDocs = allDocumentsWithState.filter((d) => d.approval_status === "not_uploaded").length;
  const requiredDocs = allDocumentsWithState.filter((d) => d.required).length;
  const requiredUploaded = allDocumentsWithState.filter((d) => d.required && Boolean(d.file_url)).length;

  const progressPercent = totalDocs ? Math.round((uploadedDocs / totalDocs) * 100) : 0;

  // Filter daftar dokumen
  const filteredDocuments = useMemo(() => {
    return allDocumentsWithState.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = q
        ? item.label.toLowerCase().includes(q) ||
          String(item.internal_code ?? "").toLowerCase().includes(q) ||
          String(item.file_name ?? "").toLowerCase().includes(q)
        : true;
      if (!matchesSearch) return false;

      if (filterCategory === "pending") return item.approval_status === "pending";
      if (filterCategory === "approved") return item.approval_status === "approved";
      if (filterCategory === "rejected") return item.approval_status === "rejected";
      if (filterCategory === "not_uploaded") return item.approval_status === "not_uploaded";
      return true;
    });
  }, [allDocumentsWithState, searchQuery, filterCategory]);

  // Multiple download helpers and actions
  const filteredUploadedDocs = useMemo(
    () => filteredDocuments.filter((d) => Boolean(d.file_url)),
    [filteredDocuments],
  );

  const isAllSelected = useMemo(
    () =>
      filteredUploadedDocs.length > 0 &&
      filteredUploadedDocs.every((d) => selectedDocIds.includes(d.id)),
    [filteredUploadedDocs, selectedDocIds],
  );

  const isIndeterminate = useMemo(() => {
    const selectedCountInFiltered = filteredUploadedDocs.filter((d) =>
      selectedDocIds.includes(d.id),
    ).length;
    return (
      selectedCountInFiltered > 0 &&
      selectedCountInFiltered < filteredUploadedDocs.length
    );
  }, [filteredUploadedDocs, selectedDocIds]);

  const handleToggleSelectDoc = useCallback(
    (docId: string, checked: boolean) => {
      setSelectedDocIds((prev) => {
        if (checked) {
          return Array.from(new Set([...prev, docId]));
        }
        return prev.filter((id) => id !== docId);
      });
    },
    [],
  );

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const nextIds = Array.from(
          new Set([...selectedDocIds, ...filteredUploadedDocs.map((d) => d.id)]),
        );
        setSelectedDocIds(nextIds);
      } else {
        const filteredIds = new Set(filteredUploadedDocs.map((d) => d.id));
        setSelectedDocIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      }
    },
    [filteredUploadedDocs, selectedDocIds],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedDocIds([]);
  }, []);

  const handleEnterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const handleExitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedDocIds([]);
  }, []);

  const handleOpenDownloadSelectedModal = useCallback(() => {
    const targets = allDocumentsWithState.filter(
      (d) => selectedDocIds.includes(d.id) && Boolean(d.file_url),
    );
    if (targets.length === 0) {
      notification.warning({
        message: "Peringatan",
        description: "Pilih minimal satu berkas dokumen yang telah diunggah untuk diunduh.",
      });
      return;
    }
    setDocsToDownload(targets);
    setDownloadConfirmModalOpen(true);
  }, [allDocumentsWithState, selectedDocIds, notification]);

  const handleOpenDownloadAllModal = useCallback(() => {
    const targets = allDocumentsWithState.filter((d) => Boolean(d.file_url));
    if (targets.length === 0) {
      notification.warning({
        message: "Peringatan",
        description: "Belum ada berkas dokumen yang diunggah oleh mahasiswa.",
      });
      return;
    }
    setDocsToDownload(targets);
    setDownloadConfirmModalOpen(true);
  }, [allDocumentsWithState, notification]);

  const handleCancelDownload = useCallback(() => {
    setDownloadConfirmModalOpen(false);
    message.info("Pengunduhan berkas dibatalkan.");
  }, [message]);

  const handleConfirmDownload = useCallback(async () => {
    if (!docsToDownload.length) return;
    setIsDownloading(true);

    notification.info({
      message: "Memulai Pengunduhan",
      description: `Sedang memproses dan mengunduh ${docsToDownload.length} berkas dokumen...`,
    });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < docsToDownload.length; i++) {
      const doc = docsToDownload[i];
      if (!doc.file_url) continue;
      const fileName = doc.file_name || `${doc.label}.pdf`;
      try {
        await downloadSingleFile(doc.file_url, fileName);
        successCount++;
      } catch {
        failCount++;
      }

      if (i < docsToDownload.length - 1) {
        await new Promise((r) => setTimeout(r, 350));
      }
    }

    setIsDownloading(false);
    setDownloadConfirmModalOpen(false);

    if (failCount === 0) {
      notification.success({
        message: "Unduhan Berhasil",
        description: `Seluruh ${successCount} berkas dokumen berhasil diunduh.`,
      });
    } else if (successCount > 0) {
      notification.warning({
        message: "Unduhan Sebagian Berhasil",
        description: `${successCount} berkas berhasil diunduh, ${failCount} berkas mengalami kendala.`,
      });
    } else {
      notification.error({
        message: "Unduhan Gagal",
        description: "Terjadi kesalahan saat mengunduh berkas dokumen.",
      });
    }
  }, [docsToDownload, notification]);

  const handleOpenDeleteSelectedModal = useCallback(() => {
    const targets = allDocumentsWithState.filter(
      (d) => selectedDocIds.includes(d.id) && Boolean(d.file_url),
    );
    if (targets.length === 0) {
      notification.warning({
        message: "Peringatan",
        description: "Pilih minimal satu berkas dokumen yang telah diunggah untuk dihapus.",
      });
      return;
    }
    setDocsToDelete(targets);
    setDeleteConfirmModalOpen(true);
  }, [allDocumentsWithState, selectedDocIds, notification]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmModalOpen(false);
    message.info("Penghapusan berkas dibatalkan.");
  }, [message]);

  const handleConfirmDelete = useCallback(async () => {
    if (!docsToDelete.length) return;
    setIsDeleting(true);

    notification.info({
      message: "Memproses Penghapusan",
      description: `Sedang menghapus ${docsToDelete.length} berkas dokumen terpilih...`,
    });

    let successCount = 0;
    let failCount = 0;

    for (const doc of docsToDelete) {
      try {
        const matchingAnswers = (answerDocuments ?? []).filter(
          (ans) =>
            String(ans.document_id) === doc.id ||
            (doc.internal_code && String(ans.document_id) === String(doc.internal_code)) ||
            (doc.answer_document_id && String(ans.id) === doc.answer_document_id),
        );

        if (matchingAnswers.length > 0) {
          await Promise.all(
            matchingAnswers.map((ans) => onDeleteAnswerDocument(ans.id)),
          );
          successCount++;
        } else if (doc.answer_document_id) {
          await onDeleteAnswerDocument(doc.answer_document_id);
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ["answer-documents"] });
    queryClient.invalidateQueries({ queryKey: ["document-approvals"] });
    queryClient.invalidateQueries({ queryKey: ["students"] });

    setIsDeleting(false);
    setDeleteConfirmModalOpen(false);
    setSelectedDocIds([]);
    setIsSelectionMode(false);

    if (failCount === 0) {
      notification.success({
        message: "Penghapusan Berhasil",
        description: `Seluruh ${successCount} berkas dokumen berhasil dihapus.`,
      });
    } else if (successCount > 0) {
      notification.warning({
        message: "Penghapusan Sebagian Berhasil",
        description: `${successCount} berkas berhasil dihapus, ${failCount} berkas gagal dihapus.`,
      });
    } else {
      notification.error({
        message: "Penghapusan Gagal",
        description: "Terjadi kesalahan saat menghapus berkas dokumen.",
      });
    }
  }, [docsToDelete, answerDocuments, onDeleteAnswerDocument, queryClient, notification]);

  const handleApproveDocument = useCallback(
    async (item: DocumentStateItem) => {
      if (!user_id) {
        notification.error({
          message: "Akses Ditolak",
          description: "Sesi login admission telah berakhir. Silakan login kembali.",
        });
        return;
      }
      if (!item.answer_document_id) {
        notification.info({
          message: "Dokumen Terverifikasi",
          description: "Dokumen ini sudah berstatus terverifikasi otomatis dari sistem.",
        });
        return;
      }

      setSavingDocApprovalId(item.id);
      try {
        // Jangan bawa note penolakan lama saat setujui ulang, kecuali admin mengetik draft catatan baru
        const draftNote = docNoteDrafts[item.answer_document_id];
        const noteValue =
          draftNote !== undefined
            ? draftNote.trim()
            : item.approval_status === "rejected"
            ? ""
            : (item.approval_note ?? "").trim();

        await onCreateDocumentApproval({
          answer_document_id: item.answer_document_id,
          student_id,
          reviewer_id: user_id,
          status: "approved",
          note: noteValue || undefined,
        });

        // Bersihkan draft note jika ada
        setDocNoteDrafts((prev) => {
          const next = { ...prev };
          delete next[item.answer_document_id!];
          delete next[item.id];
          return next;
        });

        // Invalidate related queries to ensure UI updates immediately
        await queryClient.invalidateQueries({ queryKey: ["answer-document-approvals"] });
        await queryClient.invalidateQueries({ queryKey: ["answer-documents"] });
        await queryClient.invalidateQueries({ queryKey: ["user", student_id] });

        notification.success({
          message: "Dokumen Disetujui",
          description: `Berkas "${item.label}" telah disetujui untuk pengajuan visa.`,
        });
      } catch (error) {
        notification.error({
          message: "Gagal Menyetujui Dokumen",
          description: error instanceof Error ? error.message : "Terjadi kendala saat menyimpan data.",
        });
      } finally {
        setSavingDocApprovalId(null);
      }
    },
    [docNoteDrafts, notification, onCreateDocumentApproval, queryClient, student_id, user_id],
  );

  const handleOpenRejectModal = (item: DocumentStateItem, customInitialNote?: string) => {
    setRejectModalDoc(item);
    const initialReason =
      customInitialNote ??
      docNoteDrafts[item.answer_document_id ?? item.id] ??
      (item.approval_status === "rejected" ? item.approval_note ?? "" : "");
    setRejectReason(initialReason);
  };

  const handleConfirmReject = async () => {
    if (!rejectModalDoc) return;
    if (!user_id) {
      notification.error({
        message: "Akses Ditolak",
        description: "Sesi login admission telah berakhir. Silakan login kembali.",
      });
      return;
    }
    const answerDocId = rejectModalDoc.answer_document_id;
    if (!answerDocId) {
      notification.warning({
        message: "Dokumen Belum Diunggah",
        description: "Student belum mengunggah berkas pada slot ini.",
      });
      setRejectModalDoc(null);
      return;
    }

    setSavingDocApprovalId(rejectModalDoc.id);
    try {
      await onCreateDocumentApproval({
        answer_document_id: answerDocId,
        student_id,
        reviewer_id: user_id,
        status: "rejected",
        note: rejectReason || "Dokumen belum memenuhi persyaratan. Mohon unggah ulang berkas yang sesuai.",
      });

      // Bersihkan draft note jika ada
      setDocNoteDrafts((prev) => {
        const next = { ...prev };
        if (rejectModalDoc.answer_document_id) delete next[rejectModalDoc.answer_document_id];
        delete next[rejectModalDoc.id];
        return next;
      });

      // Invalidate queries to refresh UI immediately
      await queryClient.invalidateQueries({ queryKey: ["answer-document-approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["answer-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["user", student_id] });

      notification.success({
        message: "Penolakan Dokumen Disimpan",
        description: `Catatan revisi untuk "${rejectModalDoc.label}" telah dikirim ke student.`,
      });
      setRejectModalDoc(null);
      setRejectReason("");
    } catch (error) {
      notification.error({
        message: "Gagal Menyimpan Penolakan",
        description: error instanceof Error ? error.message : "Terjadi kendala.",
      });
    } finally {
      setSavingDocApprovalId(null);
    }
  };

  const isLoading = masterDocsLoading || stagesLoading || answerDocsLoading;

  return (
    <>
      <Row gutter={[20, 20]} style={{ width: "100%", margin: 0 }}>
        <Col xs={24} xl={16} style={{ minWidth: 0, maxWidth: "100%", paddingLeft: 0, paddingRight: 0 }}>
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {/* 1. Header Card Kelengkapan & Negara (Identik dengan Student Portal) */}
            <Card
              className={styles.docHeaderCard}
              styles={{ body: { padding: "18px 20px" } }}
            >
              <Row gutter={[16, 16]} align="middle" justify="space-between">
                <Col xs={24} md={14} style={{ minWidth: 0 }}>
                  <Flex align="flex-start" gap={12}>
                    <div className={styles.sectionHeaderIcon}>
                      <FolderOpenOutlined />
                    </div>

                    <Space direction="vertical" size={4} style={{ width: "100%", minWidth: 0 }}>
                      <div className={styles.sectionHeaderTitle}>
                        Required Documents
                      </div>
                      <div className={styles.sectionHeaderSubtitle}>
                        Verifikasi kelayakan berkas mahasiswa
                      </div>

                      <Space size={8} wrap style={{ marginTop: 4 }}>
                        {student?.stage?.country?.name ? (
                          <Tag
                            style={{
                              borderRadius: 999,
                              paddingInline: 12,
                              paddingBlock: 2,
                              borderColor: "#bfdbfe",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              fontWeight: 500,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <GlobalOutlined />
                            <span>{student.stage.country.name}</span>
                          </Tag>
                        ) : (
                          <Tag
                            style={{
                              borderRadius: 999,
                              paddingInline: 12,
                              paddingBlock: 2,
                              borderColor: "#bfdbfe",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              fontWeight: 500,
                            }}
                          >
                            Semua Dokumen Persyaratan
                          </Tag>
                        )}

                        {student?.visa_type ? (
                          <Tag
                            style={{
                              borderRadius: 999,
                              paddingInline: 12,
                              paddingBlock: 2,
                              borderColor: "#c7d2fe",
                              background: "#eef2ff",
                              color: "#4338ca",
                              fontWeight: 500,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <SafetyCertificateOutlined />
                            <span>{student.visa_type}</span>
                          </Tag>
                        ) : null}

                        <Tag
                          style={{
                            borderRadius: 999,
                            paddingInline: 12,
                            paddingBlock: 2,
                            borderColor: "#bbf7d0",
                            background: "#f0fdf4",
                            color: "#15803d",
                            fontWeight: 500,
                          }}
                        >
                          Pemeriksaan Admisi
                        </Tag>
                      </Space>
                    </Space>
                  </Flex>
                </Col>

                {/* Progress Metric Card */}
                <Col xs={24} md={10} style={{ minWidth: 0 }}>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 14,
                      padding: "14px 18px",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                      <Text strong style={{ fontSize: 13, color: "#1e293b" }}>
                        Kelengkapan Dokumen
                      </Text>
                      <Text strong style={{ fontSize: 13, color: progressPercent === 100 ? "#16a34a" : "#2563eb" }}>
                        {uploadedDocs} dari {totalDocs} ({progressPercent}%)
                      </Text>
                    </div>
                    <Progress
                      percent={progressPercent}
                      strokeColor={{
                        "0%": "#3b82f6",
                        "100%": "#10b981",
                      }}
                      showInfo={false}
                      size="small"
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "#64748b", flexWrap: "wrap", gap: 4 }}>
                      <span>Wajib: {requiredUploaded} dari {requiredDocs}</span>
                      <span>Disetujui: {approvedDocs}</span>
                    </div>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* 2. Daftar Dokumen Persyaratan (Gaya Card List Identik Student) */}
            <Card
              className={styles.docListCard}
              styles={{ body: { padding: "20px 24px" } }}
              loading={isLoading}
            >
              {/* Header: Judul Dokumen di kiri, Tombol Pilih Biru di pojok kanan */}
              <div className={styles.docHeaderTopRow}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 600, fontSize: 16 }}>
                    Daftar Dokumen ({filteredDocuments.length})
                  </Title>
                  <Text style={{ color: "#64748b", fontSize: 13, wordBreak: "break-word" }}>
                    Periksa keabsahan berkas mahasiswa dan tentukan status persetujuan.
                  </Text>
                </div>

                <div className={styles.docHeaderAction}>
                  {!isSelectionMode ? (
                    <Button
                      type="primary"
                      icon={<CheckSquareOutlined />}
                      onClick={handleEnterSelectionMode}
                      disabled={uploadedDocs === 0}
                      style={{
                        backgroundColor: "#1b3d6d",
                        borderColor: "#1b3d6d",
                        color: "#ffffff",
                        borderRadius: 8,
                        fontWeight: 600,
                        height: 36,
                        padding: "0 18px",
                        fontSize: 13,
                        boxShadow: "0 1px 2px rgba(27, 61, 109, 0.15)",
                      }}
                    >
                      Pilih
                    </Button>
                  ) : (
                    <Button
                      onClick={handleExitSelectionMode}
                      style={{
                        borderRadius: 8,
                        fontWeight: 600,
                        height: 36,
                        padding: "0 18px",
                        fontSize: 13,
                        backgroundColor: "#f8fafc",
                        borderColor: "#cbd5e1",
                        color: "#334155",
                      }}
                    >
                      Batal Pilih
                    </Button>
                  )}
                </div>
              </div>

              {/* Baris Kontrol: Input Pencarian & Filter Kategori */}
              <div className={styles.docSearchFilterRow} style={{ marginBottom: 18 }}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 14 }} />}
                  placeholder="Cari dokumen..."
                  allowClear
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.docSearchInput}
                />

                <Select
                  value={filterCategory}
                  onChange={(val) => setFilterCategory(val)}
                  className={styles.docCategorySelect}
                  options={[
                    { value: "all", label: `Semua Dokumen (${totalDocs})` },
                    { value: "pending", label: `Perlu Review (${pendingReviewDocs})` },
                    { value: "approved", label: `Disetujui (${approvedDocs})` },
                    { value: "rejected", label: `Perlu Revisi (${rejectedDocs})` },
                    { value: "not_uploaded", label: `Belum Diunggah (${notUploadedDocs})` },
                  ]}
                />
              </div>

              {filteredDocuments.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Tidak ada dokumen yang sesuai dengan kriteria filter."
                  style={{ padding: "30px 0" }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {filteredDocuments.map((item) => {
                    const isUploaded = Boolean(item.file_url);
                    const isApproved = item.approval_status === "approved";
                    const isRejected = item.approval_status === "rejected";
                    const isPending = item.approval_status === "pending";

                    // Background & border bersih dan konsisten
                    let rowBg = "#ffffff";
                    let rowBorder = "#e2e8f0";
                    if (isApproved) {
                      rowBg = "#ffffff";
                      rowBorder = "#e2e8f0";
                    } else if (isRejected) {
                      rowBg = "#fffafa";
                      rowBorder = "#fecaca";
                    } else if (!isUploaded) {
                      rowBg = "#f8fafc";
                      rowBorder = "#f1f5f9";
                    }

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                          padding: "14px 18px",
                          borderRadius: 12,
                          border: `1px solid ${rowBorder}`,
                          background: rowBg,
                          transition: "all 0.2s ease",
                          width: "100%",
                          boxSizing: "border-box",
                        }}
                      >
                        <div className={styles.docItemRow}>
                          {/* Sisi Kiri: Icon, Label, File Name, Badges */}
                          <div className={styles.docItemLeft}>
                            {isSelectionMode && (
                              isUploaded ? (
                                <Checkbox
                                  checked={selectedDocIds.includes(item.id)}
                                  onChange={(e) => handleToggleSelectDoc(item.id, e.target.checked)}
                                  style={{ marginRight: 6 }}
                                />
                              ) : (
                                <Tooltip title="Berkas belum diunggah">
                                  <Checkbox disabled style={{ marginRight: 6, opacity: 0.35 }} />
                                </Tooltip>
                              )
                            )}

                            <div
                              style={{
                                width: 38,
                                height: 38,
                                borderRadius: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: isApproved
                                  ? "#dcfce7"
                                  : isRejected
                                  ? "#fee2e2"
                                  : isUploaded
                                  ? "#e0e7ff"
                                  : "#f1f5f9",
                                color: isApproved
                                  ? "#16a34a"
                                  : isRejected
                                  ? "#dc2626"
                                  : isUploaded
                                  ? "#4338ca"
                                  : "#64748b",
                                fontSize: 18,
                                flexShrink: 0,
                              }}
                            >
                              {isApproved ? (
                                <CheckCircleFilled />
                              ) : isRejected ? (
                                <CloseCircleFilled />
                              ) : isUploaded ? (
                                <FilePdfOutlined />
                              ) : (
                                <FileTextOutlined />
                              )}
                            </div>

                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 5 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                  {item.required ? (
                                    <Tag color="error" style={{ margin: 0, fontSize: 10.5, borderRadius: 4, paddingInline: 6, lineHeight: "18px", height: 20 }}>
                                      Required
                                    </Tag>
                                  ) : (
                                    <Tag style={{ margin: 0, fontSize: 10.5, borderRadius: 4, paddingInline: 6, lineHeight: "18px", height: 20, background: "#f1f5f9", color: "#64748b", border: "none" }}>
                                      Optional
                                    </Tag>
                                  )}

                                  {String(item.translation_needed ?? "").toUpperCase() === "YES" && (
                                    <Tag color="purple" style={{ margin: 0, fontSize: 10.5, borderRadius: 4, paddingInline: 6, lineHeight: "18px", height: 20 }}>
                                      Sworn
                                    </Tag>
                                  )}

                                  {isRejected ? (
                                    <Tag color="error" style={{ margin: 0, fontSize: 10.5, borderRadius: 999, fontWeight: 600, lineHeight: "18px", height: 20 }}>
                                      Needs Revision
                                    </Tag>
                                  ) : !isUploaded ? (
                                    <Tag style={{ margin: 0, fontSize: 10.5, borderRadius: 999, background: "#e2e8f0", color: "#64748b", border: "none", lineHeight: "18px", height: 20 }}>
                                      Not Uploaded
                                    </Tag>
                                  ) : null}
                                </div>

                                <Text strong style={{ fontSize: 13, color: "#1e293b", lineHeight: 1.4, margin: 0, wordBreak: "break-word" }}>
                                  {item.label}
                                </Text>
                              </div>

                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
                                {isUploaded ? (
                                  <>
                                    <Text style={{ color: "#334155", fontSize: 12, wordBreak: "break-all" }}>
                                      {item.file_name ?? "Berkas Dokumen"}
                                    </Text>
                                    {item.created_at ? (
                                      <span>Diunggah: {formatDate(item.created_at)}</span>
                                    ) : null}
                                  </>
                                ) : (
                                  <Text type="secondary" style={{ fontSize: 12 }}>
                                    Mahasiswa belum mengunggah berkas pada persyaratan ini.
                                  </Text>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Sisi Kanan: Action Buttons */}
                          <div className={styles.docItemRight}>
                            {isUploaded ? (
                              <>
                                {/* Tombol Preview File */}
                                <Tooltip
                                  title={isMobileScreen ? undefined : "Lihat"}
                                  trigger={["hover"]}
                                  destroyTooltipOnHide
                                >
                                  <Button
                                    size="middle"
                                    icon={<EyeOutlined />}
                                    className={styles.docActionBtn}
                                    onClick={(e) => {
                                      (e.currentTarget as HTMLElement)?.blur();
                                      const previewUrl = buildFilePreviewUrl(
                                        item.file_url!,
                                        item.file_name ?? `${item.label}.pdf`,
                                        item.file_type || undefined,
                                        "raw",
                                      );
                                      handleOpenPreview(
                                        previewUrl || item.file_url!,
                                        item.file_name ?? item.label,
                                        item.label,
                                        item.file_type || undefined,
                                        item.file_url || undefined,
                                      );
                                    }}
                                  />
                                </Tooltip>

                                {/* Jika dokumen sudah disetujui */}
                                {isApproved ? (
                                  <>
                                    <Tag
                                      color="success"
                                      style={{
                                        margin: 0,
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <CheckOutlined /> Approved
                                    </Tag>

                                    {/* Ikon pensil kecil di ujung kanan — hanya untuk admisi dan dokumen yang belum dikunci */}
                                    {canApprove && !item.is_verified_signature && (
                                      <Tooltip title="Batalkan persetujuan dokumen ini">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<EditOutlined />}
                                          onClick={() => handleOpenRejectModal(item)}
                                          style={{
                                            color: "#94a3b8",
                                            marginLeft: 4,
                                          }}
                                        />
                                      </Tooltip>
                                    )}
                                  </>
                                ) : isRejected ? (
                                  /* Jika dokumen sudah ditolak / perlu revisi */
                                  <>
                                    <Tag
                                      color="error"
                                      style={{
                                        margin: 0,
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <CloseOutlined /> Needs Revision
                                    </Tag>

                                    {/* Tombol Setujui kembali jika mahasiswa sudah mengunggah berkas yang benar */}
                                    {canApprove && (
                                      <Tooltip title="Setujui Ulang">
                                        <Button
                                          size="middle"
                                          type="primary"
                                          icon={<CheckOutlined />}
                                          className={styles.docActionBtn}
                                          onClick={() => handleApproveDocument(item)}
                                          loading={savingDocApprovalId === item.id}
                                          style={{
                                            backgroundColor: "#16a34a",
                                            borderColor: "#16a34a",
                                          }}
                                        />
                                      </Tooltip>
                                    )}
                                  </>
                                ) : (
                                  /* Jika dokumen baru / pending review */
                                  canApprove ? (
                                    <>
                                      {/* Tombol Setujui */}
                                      <Tooltip title="Setujui">
                                        <Button
                                          size="middle"
                                          type="primary"
                                          icon={<CheckOutlined />}
                                          className={styles.docActionBtn}
                                          onClick={() => handleApproveDocument(item)}
                                          loading={savingDocApprovalId === item.id}
                                          disabled={item.is_verified_signature}
                                          style={{
                                            backgroundColor: "#16a34a",
                                            borderColor: "#16a34a",
                                          }}
                                        />
                                      </Tooltip>

                                      {/* Tombol Tolak */}
                                      <Tooltip title="Tolak">
                                        <Button
                                          size="middle"
                                          danger
                                          icon={<CloseOutlined />}
                                          className={styles.docActionBtn}
                                          onClick={() => handleOpenRejectModal(item)}
                                          disabled={item.is_verified_signature}
                                        />
                                      </Tooltip>
                                    </>
                                  ) : (
                                    <Tag
                                      color="processing"
                                      style={{
                                        margin: 0,
                                        borderRadius: 8,
                                        fontSize: 12,
                                        padding: "4px 10px",
                                        fontWeight: 600,
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 4,
                                      }}
                                    >
                                      <ClockCircleOutlined /> Awaiting Review
                                    </Tag>
                                  )
                                )}
                              </>
                            ) : (
                              <Tag style={{ borderRadius: 8, padding: "4px 10px", color: "#94a3b8" }}>
                                Awaiting Upload
                              </Tag>
                            )}
                          </div>
                        </div>

                        {/* Catatan Revisi / Approval jika ada */}
                        {item.approval_note ? (
                          <div
                            style={{
                              marginTop: 4,
                              padding: "8px 12px",
                              borderRadius: 8,
                              background: isRejected ? "#fef2f2" : "#f8fafc",
                              border: `1px solid ${isRejected ? "#fecaca" : "#e2e8f0"}`,
                              fontSize: 12,
                              color: isRejected ? "#991b1b" : "#475569",
                            }}
                          >
                            <strong>Catatan Admisi:</strong> {item.approval_note}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Bar: Hanya tampil saat Mode Pilih (isSelectionMode) aktif */}
              {isSelectionMode && (
                <div className={styles.docBatchActionBar}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={(e) => handleToggleSelectAll(e.target.checked)}
                      disabled={filteredUploadedDocs.length === 0}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#334155" }}>
                        Pilih Semua ({filteredUploadedDocs.length} berkas)
                      </span>
                    </Checkbox>
                    {selectedDocIds.length > 0 && (
                      <Tag color="blue" style={{ borderRadius: 6, fontWeight: 600, margin: 0 }}>
                        {selectedDocIds.length} Terpilih
                      </Tag>
                    )}
                  </div>

                  <div className={styles.docBatchActionsRight}>
                    <Button
                      onClick={handleExitSelectionMode}
                      style={{ fontSize: 13, borderRadius: 8 }}
                    >
                      Batal Pilih
                    </Button>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={handleOpenDownloadSelectedModal}
                      disabled={selectedDocIds.length === 0}
                      style={{ borderRadius: 8, fontSize: 13, fontWeight: 500 }}
                    >
                      Unduh ({selectedDocIds.length})
                    </Button>
                    <Button
                      onClick={handleOpenDownloadAllModal}
                      disabled={uploadedDocs === 0}
                      style={{ borderRadius: 8, fontSize: 13, fontWeight: 500 }}
                    >
                      Unduh Semua ({uploadedDocs})
                    </Button>
                    <Button
                      danger
                      type="default"
                      icon={<DeleteOutlined />}
                      onClick={handleOpenDeleteSelectedModal}
                      disabled={selectedDocIds.length === 0}
                      style={{ borderRadius: 8, fontSize: 13, fontWeight: 500 }}
                    >
                      Hapus ({selectedDocIds.length})
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </Space>
        </Col>

        {/* Kolom Kanan: Surat Pernyataan Visa Card */}
        <Col xs={24} xl={8} style={{ minWidth: 0, maxWidth: "100%", paddingLeft: 0, paddingRight: 0 }}>
          <StatementLetterCard
            student={student}
            onPreviewSignature={(url) => {
              const previewUrl = buildFilePreviewUrl(
                url,
                "Tanda_Tangan_Surat_Pernyataan.png",
                "image/png",
                "raw",
              );
              handleOpenPreview(
                previewUrl || url,
                "Tanda_Tangan_Surat_Pernyataan.png",
                "Tanda Tangan Surat Pernyataan",
                "image/png",
                url,
              );
            }}
          />
        </Col>
      </Row>

      {/* Modal 1: Penolakan Dokumen & Catatan Revisi */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CloseCircleOutlined style={{ color: "#dc2626", fontSize: 18 }} />
            <span>Tolak Dokumen & Minta Unggah Ulang</span>
          </div>
        }
        open={Boolean(rejectModalDoc)}
        onCancel={() => setRejectModalDoc(null)}
        onOk={handleConfirmReject}
        okText="Kirim Penolakan"
        okButtonProps={{ danger: true, loading: Boolean(savingDocApprovalId) }}
        cancelText="Batal"
      >
        <Space direction="vertical" size={14} style={{ width: "100%", marginTop: 8 }}>
          <Alert
            type="warning"
            showIcon
            message={
              <span>
                Dokumen: <strong>{rejectModalDoc?.label}</strong>
              </span>
            }
            description="Status dokumen akan diubah menjadi Perlu Revisi, dan mahasiswa akan menerima instruksi untuk mengunggah ulang berkas yang sesuai."
          />

          <div>
            <Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
              Alasan Penolakan / Catatan Perbaikan untuk Student:
            </Text>
            <Input.TextArea
              rows={4}
              placeholder="Contoh: Berkas buram atau tidak terbaca, masa berlaku sudah habis, atau nama di dokumen tidak sesuai..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </div>
        </Space>
      </Modal>

      {/* Modal 2: File Preview Pop-up */}
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <FileTextOutlined style={{ color: "#2563eb", fontSize: 18, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: isMobileScreen ? 14 : 15,
                  color: "#0f172a",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                Lihat Dokumen - {previewItem?.label || "Berkas"}
              </div>
              {previewItem?.name && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    fontWeight: 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {previewItem.name}
                </div>
              )}
            </div>
          </div>
        }
        open={previewModalOpen}
        onCancel={() => setPreviewModalOpen(false)}
        footer={
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: isMobileScreen ? "stretch" : "flex-end",
              gap: 8,
              width: "100%",
            }}
          >
            <Button
              key="close"
              onClick={() => setPreviewModalOpen(false)}
              style={isMobileScreen ? { flex: 1, minWidth: 80 } : undefined}
            >
              Tutup
            </Button>
            {previewItem?.url && (
              <Button
                key="new-tab"
                icon={<ExportOutlined />}
                href={previewItem.rawUrl || previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                style={isMobileScreen ? { flex: 1, minWidth: 120 } : undefined}
              >
                Buka di Tab Baru
              </Button>
            )}
            {previewItem?.url && (
              <Button
                key="download"
                type="primary"
                icon={<DownloadOutlined />}
                href={previewItem.rawUrl || previewItem.url}
                target="_blank"
                rel="noopener noreferrer"
                style={isMobileScreen ? { width: "100%" } : undefined}
              >
                Unduh Berkas
              </Button>
            )}
          </div>
        }
        width={isMobileScreen ? "calc(100vw - 16px)" : 900}
        style={{
          top: isMobileScreen ? 12 : 36,
          maxWidth: "100%",
          paddingBottom: isMobileScreen ? 12 : 24,
        }}
        styles={{
          body: {
            padding: isMobileScreen ? "12px 14px" : "16px 20px",
            maxHeight: isMobileScreen ? "calc(82vh - 110px)" : "75vh",
            overflowY: "auto",
          },
        }}
      >
        {previewItem?.url ? (() => {
          const urlLower = previewItem.url.toLowerCase();
          const nameLower = (previewItem.name || "").toLowerCase();
          const typeLower = (previewItem.type || "").toLowerCase();

          const isPdf =
            urlLower.includes(".pdf") ||
            nameLower.endsWith(".pdf") ||
            typeLower.includes("pdf");

          const isHtml =
            urlLower.includes(".html") ||
            urlLower.includes(".htm") ||
            nameLower.endsWith(".html") ||
            nameLower.endsWith(".htm") ||
            typeLower.includes("html") ||
            nameLower.includes("_cv");

          const isImage =
            urlLower.match(/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i) ||
            nameLower.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) ||
            typeLower.includes("image");

          if (isHtml) {
            if (htmlPreviewLoading) {
              return (
                <div style={{ textAlign: "center", padding: 60 }}>
                  <Spin tip="Memuat pratinjau dokumen..." />
                </div>
              );
            }
            return (
              <div style={{ background: "#f8fafc", padding: 10, borderRadius: 8 }}>
                <iframe
                  srcDoc={htmlPreviewContent || undefined}
                  src={!htmlPreviewContent ? previewItem.url : undefined}
                  style={{
                    width: "100%",
                    height: isMobileScreen ? 400 : 600,
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    background: "#ffffff",
                  }}
                  title={`Pratinjau ${previewItem.name || "Dokumen"}`}
                />
              </div>
            );
          }

          if (isPdf) {
            if (isMobileScreen) {
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "24px 16px",
                    background: "#f8fafc",
                    borderRadius: 12,
                    border: "1px dashed #cbd5e1",
                    textAlign: "center",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: "50%",
                      background: "#fee2e2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FilePdfOutlined style={{ fontSize: 30, color: "#dc2626" }} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: "#0f172a",
                        marginBottom: 6,
                        wordBreak: "break-word",
                      }}
                    >
                      {previewItem.name || "Berkas PDF"}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        lineHeight: 1.5,
                        maxWidth: 300,
                        margin: "0 auto",
                      }}
                    >
                      Peramban seluler tidak mengizinkan tampilan PDF langsung di dalam bingkai ini. Silakan buka berkas di tab baru atau unduh langsung untuk melihatnya.
                    </div>
                  </div>
                  <Space direction="vertical" size={10} style={{ width: "100%", maxWidth: 280 }}>
                    <Button
                      type="primary"
                      icon={<ExportOutlined />}
                      size="large"
                      block
                      href={previewItem.rawUrl || previewItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ borderRadius: 8, background: "#2563eb", height: 40, fontWeight: 500 }}
                    >
                      Buka PDF di Tab Baru
                    </Button>
                    <Button
                      icon={<DownloadOutlined />}
                      size="large"
                      block
                      href={previewItem.rawUrl || previewItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ borderRadius: 8, height: 40 }}
                    >
                      Unduh Berkas PDF
                    </Button>
                  </Space>
                </div>
              );
            }

            return (
              <iframe
                src={previewItem.url}
                style={{ width: "100%", height: 600, border: "none", borderRadius: 8 }}
                title={`Pratinjau ${previewItem.name || "PDF"}`}
              />
            );
          }

          if (isImage) {
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: isMobileScreen ? 240 : 380,
                  background: "#f8fafc",
                  borderRadius: 8,
                  padding: isMobileScreen ? 8 : 16,
                }}
              >
                {imgError ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "24px 16px",
                      textAlign: "center",
                      gap: 12,
                    }}
                  >
                    <FileImageOutlined style={{ fontSize: 40, color: "#94a3b8" }} />
                    <div style={{ fontSize: 13, color: "#64748b" }}>
                      Gambar belum dapat dimuat secara langsung di sini.
                    </div>
                    <Button
                      icon={<ExportOutlined />}
                      href={previewItem.rawUrl || previewItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                    >
                      Buka Gambar di Tab Baru
                    </Button>
                  </div>
                ) : (
                  <img
                    src={previewItem.url}
                    alt={previewItem.name || "Dokumen"}
                    onError={() => {
                      if (previewItem.rawUrl && previewItem.rawUrl !== previewItem.url) {
                        setPreviewItem((prev) => (prev ? { ...prev, url: prev.rawUrl! } : null));
                      } else {
                        setImgError(true);
                      }
                    }}
                    style={{
                      maxWidth: "100%",
                      maxHeight: isMobileScreen ? "48vh" : 580,
                      objectFit: "contain",
                      borderRadius: 8,
                      boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                    }}
                  />
                )}
              </div>
            );
          }

          return (
            <iframe
              src={previewItem.url}
              style={{
                width: "100%",
                height: isMobileScreen ? 400 : 600,
                border: "none",
                borderRadius: 8,
              }}
              title={`Pratinjau ${previewItem.name || "Dokumen"}`}
            />
          );
        })() : (
          <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
            Tidak ada pratinjau yang tersedia
          </div>
        )}
      </Modal>

      {/* Modal 3: Konfirmasi Unduh Berkas Massal (Multiple Download) */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#eff6ff",
                color: "#2563eb",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              <DownloadOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                Konfirmasi Unduh Berkas
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>
                Unduh berkas dokumen mahasiswa secara massal
              </div>
            </div>
          </Flex>
        }
        open={downloadConfirmModalOpen}
        onCancel={isDownloading ? undefined : handleCancelDownload}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancelDownload}
            disabled={isDownloading}
          >
            Batal
          </Button>,
          <Button
            key="confirm"
            type="primary"
            icon={<DownloadOutlined />}
            loading={isDownloading}
            onClick={handleConfirmDownload}
            style={{ borderRadius: 8 }}
          >
            Mulai Mengunduh ({docsToDownload.length})
          </Button>,
        ]}
        width={540}
        destroyOnClose
      >
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <Text style={{ fontSize: 13, color: "#334155" }}>
            Anda akan mengunduh <strong>{docsToDownload.length}</strong> berkas dokumen mahasiswa
            {student?.name ? <span> (<strong>{student.name}</strong>)</span> : null} langsung ke perangkat Anda.
          </Text>

          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {docsToDownload.map((doc, idx) => (
              <Flex key={doc.id || idx} align="center" justify="space-between" gap={8} style={{ fontSize: 12 }}>
                <Flex align="center" gap={8} style={{ minWidth: 0, flex: 1 }}>
                  <FilePdfOutlined style={{ color: "#2563eb", flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.label}
                  </span>
                </Flex>
                <span style={{ color: "#64748b", fontSize: 11, flexShrink: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.file_name ?? "Berkas"}
                </span>
              </Flex>
            ))}
          </div>

          <Alert
            type="info"
            showIcon
            message="Catatan Unduhan"
            description="Berkas akan diunduh secara berurutan ke folder unduhan browser Anda. Pastikan browser mengizinkan unduhan otomatis multi-berkas."
            style={{ borderRadius: 8, fontSize: 12 }}
          />
        </div>
      </Modal>

      {/* Modal 4: Konfirmasi Hapus Berkas Terpilih (Multiple Delete) */}
      <Modal
        title={
          <Flex align="center" gap={10}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: "#fee2e2",
                color: "#dc2626",
                display: "grid",
                placeItems: "center",
                fontSize: 16,
              }}
            >
              <DeleteOutlined />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#0f172a" }}>
                Konfirmasi Hapus Berkas
              </div>
              <div style={{ fontSize: 12, fontWeight: 400, color: "#64748b" }}>
                Hapus berkas dokumen terpilih mahasiswa secara permanen
              </div>
            </div>
          </Flex>
        }
        open={deleteConfirmModalOpen}
        onCancel={isDeleting ? undefined : handleCancelDelete}
        footer={[
          <Button
            key="cancel"
            onClick={handleCancelDelete}
            disabled={isDeleting}
          >
            Batal
          </Button>,
          <Button
            key="confirm"
            danger
            type="primary"
            icon={<DeleteOutlined />}
            loading={isDeleting}
            onClick={handleConfirmDelete}
            style={{ borderRadius: 8 }}
          >
            Hapus ({docsToDelete.length})
          </Button>,
        ]}
        width={540}
        destroyOnClose
      >
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <Alert
            type="error"
            showIcon
            message="Peringatan Penghapusan Berkas"
            description="Tindakan ini akan menghapus berkas dokumen yang telah diunggah oleh mahasiswa dari sistem. Mahasiswa harus mengunggah ulang jika berkas ini dibutuhkan kembali."
            style={{ borderRadius: 8, fontSize: 12 }}
          />

          <Text style={{ fontSize: 13, color: "#334155" }}>
            Anda akan menghapus <strong>{docsToDelete.length}</strong> berkas dokumen mahasiswa
            {student?.name ? <span> (<strong>{student.name}</strong>)</span> : null}:
          </Text>

          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              background: "#fffafa",
              border: "1px solid #fee2e2",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {docsToDelete.map((doc, idx) => (
              <Flex key={doc.id || idx} align="center" justify="space-between" gap={8} style={{ fontSize: 12 }}>
                <Flex align="center" gap={8} style={{ minWidth: 0, flex: 1 }}>
                  <FileTextOutlined style={{ color: "#dc2626", flexShrink: 0 }} />
                  <span style={{ fontWeight: 500, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {doc.label}
                  </span>
                </Flex>
                <span style={{ color: "#64748b", fontSize: 11, flexShrink: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {doc.file_name ?? "Berkas"}
                </span>
              </Flex>
            ))}
          </div>
        </div>
      </Modal>

    </>
  );
}
