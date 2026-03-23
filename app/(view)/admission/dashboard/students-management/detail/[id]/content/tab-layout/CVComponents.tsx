"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Input,
  Modal,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import OnlyOfficeEditor from "@/app/components/OnlyOfficeEditor";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import { useQuestions } from "@/app/hooks/use-questions";
import { useAuth } from "@/app/utils/use-auth";
import type { AnswerApprovalsDataModel } from "@/app/models/answer-approvals";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import { useGenerateCvAi } from "@/app/hooks/use-generate-cv-ai";
import axios from "axios";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useUser } from "@/app/hooks/use-users";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";

type CVComponentsProps = {
  student_id: string;
};

type GeneratePayloadAnswer = {
  answer_id: string;
  question_id: string;
  question: string;
  input_type?: string;
  base_id: string;
  base_name: string;
  value: string;
  selected_option_ids?: string[];
};

type GenerateResultCandidate = {
  file_url?: string;
  url?: string;
  response?: string;
  message?: string;
  file_base64?: string;
  generated_file_name?: string;
  generated_mime_type?: string;
  result?: {
    file_url?: string;
    url?: string;
    response?: string;
    message?: string;
    file_base64?: string;
    generated_file_name?: string;
    generated_mime_type?: string;
  };
  data?: {
    file_url?: string;
    url?: string;
    response?: string;
    message?: string;
    file_base64?: string;
    generated_file_name?: string;
    generated_mime_type?: string;
  };
};

const CV_TEMPLATE_PUBLIC_PATH =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_CV_TEMPLATE_PUBLIC_PATH) ||
  "/assets/file/Template CV.docx";

const WORD_DOCUMENT_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ONLYOFFICE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_ONLYOFFICE_URL?.trim()) ||
  "";
const ONLYOFFICE_CALLBACK_BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_ONLYOFFICE_CALLBACK_BASE_URL?.trim()) ||
  "";

const formatAnswerValue = (
  answer: AnswerQuestionDataModel,
  optionLabelMap: Map<string, string>,
  inputType?: string,
) => {
  const rawText = answer.answer_text?.trim() ?? "";
  if (inputType === "DATE") {
    const dateValue = rawText ? new Date(rawText) : null;
    if (dateValue && !Number.isNaN(dateValue.getTime())) {
      return dateValue.toLocaleDateString();
    }
  }
  if (answer.selected_option_ids?.length) {
    const labels = answer.selected_option_ids.map(
      (id) => optionLabelMap.get(id) ?? id,
    );
    return labels.join(", ");
  }
  return rawText || "-";
};

const parseDate = (value: unknown) => {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
};

const pickGeneratedResponse = (raw: unknown): string | null => {
  const data = raw as GenerateResultCandidate | null;
  const candidates = [
    data?.response,
    data?.result?.response,
    data?.data?.response,
    data?.message,
    data?.result?.message,
    data?.data?.message,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
};

const extractGenerateErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : "Terjadi kesalahan.";
  }

  const data = error.response?.data;
  return (
    data?.error?.details ||
    data?.error?.message ||
    data?.details ||
    data?.message ||
    error.message ||
    "Terjadi kesalahan."
  );
};

const pickGeneratedFileBase64 = (raw: unknown): string | null => {
  const data = raw as GenerateResultCandidate | null;
  const candidates = [
    data?.file_base64,
    data?.result?.file_base64,
    data?.data?.file_base64,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
};

const pickGeneratedFileName = (raw: unknown): string | null => {
  const data = raw as GenerateResultCandidate | null;
  const candidates = [
    data?.generated_file_name,
    data?.result?.generated_file_name,
    data?.data?.generated_file_name,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
};

const pickGeneratedMimeType = (raw: unknown): string | null => {
  const data = raw as GenerateResultCandidate | null;
  const candidates = [
    data?.generated_mime_type,
    data?.result?.generated_mime_type,
    data?.data?.generated_mime_type,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
};

const base64ToFile = (
  base64: string,
  fileName: string,
  mimeType = WORD_DOCUMENT_MIME_TYPE,
) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new File([bytes], fileName, { type: mimeType });
};

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const isWordDocument = (
  fileUrl?: string | null,
  fileName?: string | null,
  mimeType?: string | null,
) => {
  const normalizedMimeType = String(mimeType ?? "").toLowerCase();
  if (
    normalizedMimeType.includes("wordprocessingml") ||
    normalizedMimeType.includes("msword")
  ) {
    return true;
  }

  const candidate = String(fileName || fileUrl || "").toLowerCase();
  return /\.(docx|doc)(?:[?#].*)?$/i.test(candidate);
};

export default function CVComponents({ student_id }: CVComponentsProps) {
  const { notification } = App.useApp();
  const { user_id } = useAuth();

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingApprovalId, setSavingApprovalId] = useState<string | null>(null);
  const [savingApprovalStatus, setSavingApprovalStatus] = useState<
    string | null
  >(null);

  const [generatedCvUrl, setGeneratedCvUrl] = useState<string | null>(null);
  const [generatedCvPath, setGeneratedCvPath] = useState<string | null>(null);
  const [generatedCvFileName, setGeneratedCvFileName] = useState<string | null>(
    null,
  );
  const [generatedCvMimeType, setGeneratedCvMimeType] = useState<string | null>(
    null,
  );
  const [generatedCvContent, setGeneratedCvContent] = useState<string | null>(
    null,
  );
  const [isOnlyOfficeOpen, setIsOnlyOfficeOpen] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const { data: studentData } = useUser({ id: student_id });
  const { data: questionBases } = useQuestionBases({});
  const { onGenerateCvAi, onGenerateCvAiLoading } = useGenerateCvAi();
  const { uploadDocument } = useDocumentUpload();
  const { data: documents = [] } = useDocuments({});
  const { data: questions } = useQuestions({});
  const { data: answerQuestions, fetchLoading } = useAnswerQuestions({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
    withNotification: false,
  });
  const { data: answerApprovals, onCreate: onCreateApproval } =
    useAnswerApprovals({
      queryString: student_id ? `student_id=${student_id}` : undefined,
      enabled: Boolean(student_id),
    });
  const {
    data: answerDocuments = [],
    onCreate: onCreateAnswerDocuments,
    onUpdate: onUpdateAnswerDocument,
  } = useAnswerDocuments({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const questionMap = useMemo(() => {
    const map = new Map<string, QuestionDataModel>();
    (questions ?? []).forEach((question) => {
      map.set(String(question.id), question);
    });
    return map;
  }, [questions]);

  const baseMap = useMemo(() => {
    const map = new Map<string, string>();
    (questionBases ?? []).forEach((base) => {
      map.set(String(base.id), base.name ?? String(base.id));
    });
    return map;
  }, [questionBases]);

  const approvalMap = useMemo(() => {
    const map = new Map<string, AnswerApprovalsDataModel>();
    (answerApprovals ?? []).forEach((approval) => {
      if (!approval?.answer_id) return;
      map.set(String(approval.answer_id), approval);
    });
    return map;
  }, [answerApprovals]);

  const cvDocument = useMemo(() => {
    return documents.find((doc) => {
      const label = String(doc.label ?? "").toLowerCase();
      const code = String(doc.internal_code ?? "").toLowerCase();
      return (
        label === "cv" ||
        label.includes("curriculum vitae") ||
        label.includes("resume") ||
        code === "cv" ||
        code.includes("curriculum")
      );
    });
  }, [documents]);

  const existingCvAnswerDocument = useMemo(() => {
    if (!cvDocument?.id) return undefined;
    return answerDocuments.find(
      (doc) => String(doc.document_id) === String(cvDocument.id),
    );
  }, [answerDocuments, cvDocument?.id]);

  const answerGroupsMap = useMemo(() => {
    const groups = new Map<
      string,
      {
        baseId: string;
        baseName: string;
        items: Array<{
          id: string;
          question: string;
          answer: string;
          inputType?: string;
        }>;
      }
    >();

    (answerQuestions ?? []).forEach((answer) => {
      const question = questionMap.get(String(answer.question_id));
      if (!question) return;

      const hasAnswer =
        Boolean(answer.answer_text && answer.answer_text.trim()) ||
        (answer.selected_option_ids?.length ?? 0) > 0;
      if (!hasAnswer) return;

      const optionLabelMap = new Map<string, string>();
      (question.options ?? []).forEach((option) => {
        optionLabelMap.set(String(option.id), option.label ?? option.value);
      });

      const baseId = String(question.base_id);
      const baseName = baseMap.get(baseId) ?? "Question Base";
      const existing = groups.get(baseId) ?? {
        baseId,
        baseName,
        items: [],
      };

      existing.items.push({
        id: String(answer.id),
        question: question.text,
        answer: formatAnswerValue(answer, optionLabelMap, question.input_type),
        inputType: question.input_type,
      });

      groups.set(baseId, existing);
    });

    return groups;
  }, [answerQuestions, baseMap, questionMap]);

  const tabItems = useMemo(() => {
    const fromBases = (questionBases ?? []).map((base) => {
      const baseId = String(base.id);
      const grouped = answerGroupsMap.get(baseId);
      return {
        key: baseId,
        label: base.name ?? "Section",
        items: grouped?.items ?? [],
      };
    });

    if (fromBases.length > 0) return fromBases;

    const fromAnswersOnly = Array.from(answerGroupsMap.values()).map(
      (group) => ({
        key: group.baseId,
        label: group.baseName,
        items: group.items,
      }),
    );
    if (fromAnswersOnly.length > 0) return fromAnswersOnly;

    return [
      { key: "personal", label: "Data Pribadi", items: [] },
      { key: "education", label: "Pendidikan", items: [] },
      { key: "experience", label: "Pengalaman", items: [] },
      { key: "skills", label: "Skill & Bahasa", items: [] },
      { key: "certificate", label: "Sertifikat", items: [] },
    ];
  }, [answerGroupsMap, questionBases]);

  const cvStatus = useMemo(() => {
    const approvals = Array.from(approvalMap.values());
    if (
      approvals.some((item) => (item.status ?? "").toLowerCase() === "rejected")
    ) {
      return { label: "Revision Needed", color: "red" as const };
    }
    if (
      approvals.length > 0 &&
      approvals.every(
        (item) => (item.status ?? "").toLowerCase() === "approved",
      )
    ) {
      return { label: "Ready for Director", color: "green" as const };
    }
    return { label: "Pending Admission", color: "gold" as const };
  }, [approvalMap]);

  const timeline = useMemo(() => {
    const submitted = (answerQuestions ?? [])
      .map((item) => item.created_at)
      .filter(Boolean)
      .map((value) => parseDate(value))
      .filter((v): v is Date => Boolean(v))
      .sort((a, b) => a.getTime() - b.getTime())[0];

    const admission = Array.from(approvalMap.values())
      .map((item) => item.updated_at)
      .filter(Boolean)
      .map((value) => parseDate(value))
      .filter((v): v is Date => Boolean(v))
      .sort((a, b) => a.getTime() - b.getTime())
      .at(-1);

    return {
      submittedAt: submitted ? submitted.toLocaleString() : "Pending",
      admissionAt: admission ? admission.toLocaleString() : "Pending",
    };
  }, [answerQuestions, approvalMap]);

  const previewCvUrl = generatedCvUrl ?? existingCvAnswerDocument?.file_url ?? null;
  const previewCvPath =
    generatedCvPath ?? existingCvAnswerDocument?.file_path ?? null;
  const previewCvFileName =
    generatedCvFileName ?? existingCvAnswerDocument?.file_name ?? null;
  const previewCvMimeType =
    generatedCvMimeType ?? existingCvAnswerDocument?.file_type ?? null;
  const onlyOfficeEnabled = Boolean(ONLYOFFICE_URL);
  const previewOnlyOfficeCallbackUrl = useMemo(() => {
    if (!previewCvPath) {
      return "";
    }

    const baseUrl =
      ONLYOFFICE_CALLBACK_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    if (!baseUrl) {
      return "";
    }

    return `${baseUrl.replace(/\/+$/, "")}/api/generate-cv-ai/onlyoffice/callback?path=${encodeURIComponent(
      previewCvPath,
    )}&bucket=student-portal`;
  }, [previewCvPath]);
  const hasGeneratedCv = Boolean(previewCvUrl || generatedCvContent);

  const generateAnswersPayload = useMemo<GeneratePayloadAnswer[]>(() => {
    const rows: GeneratePayloadAnswer[] = [];

    (answerQuestions ?? []).forEach((answer) => {
      const question = questionMap.get(String(answer.question_id));
      if (!question) return;

      const hasAnswer =
        Boolean(answer.answer_text && answer.answer_text.trim()) ||
        (answer.selected_option_ids?.length ?? 0) > 0;
      if (!hasAnswer) return;

      const optionLabelMap = new Map<string, string>();
      (question.options ?? []).forEach((option) => {
        optionLabelMap.set(String(option.id), option.label ?? option.value);
      });

      const baseId = String(question.base_id);
      rows.push({
        answer_id: String(answer.id),
        question_id: String(question.id),
        question: question.text,
        input_type: question.input_type,
        base_id: baseId,
        base_name: baseMap.get(baseId) ?? "Question Base",
        value: formatAnswerValue(answer, optionLabelMap, question.input_type),
        selected_option_ids: (answer.selected_option_ids ?? []).map(String),
      });
    });

    return rows;
  }, [answerQuestions, baseMap, questionMap]);

  const handleApprove = useCallback(
    async (answerId: string, status: "approved" | "rejected") => {
      if (!user_id) {
        notification.error({
          message: "Reviewer tidak ditemukan",
          description: "Silakan login ulang sebagai admission.",
        });
        return;
      }

      setSavingApprovalId(answerId);
      setSavingApprovalStatus(status);
      try {
        const existing = approvalMap.get(answerId);
        const noteValue = noteDrafts[answerId] ?? existing?.note ?? "";
        await onCreateApproval({
          answer_id: answerId,
          student_id,
          reviewer_id: user_id,
          status,
          note: noteValue ? noteValue : undefined,
        });
      } catch (error) {
        notification.error({
          message: "Gagal menyimpan approval",
          description:
            error instanceof Error ? error.message : "Coba lagi beberapa saat.",
        });
      } finally {
        setSavingApprovalId(null);
        setSavingApprovalStatus(null);
      }
    },
    [
      approvalMap,
      noteDrafts,
      notification,
      onCreateApproval,
      student_id,
      user_id,
    ],
  );

  const handleGenerateCv = useCallback(async () => {
    if (!student_id) {
      notification.warning({
        message: "Student ID kosong",
        description: "Tidak bisa generate CV tanpa student_id.",
      });
      return;
    }

    if (generateAnswersPayload.length === 0) {
      notification.warning({
        message: "Belum ada data",
        description: "Isi form jawaban terlebih dahulu sebelum generate CV.",
      });
      return;
    }

    try {
      const templatePath = CV_TEMPLATE_PUBLIC_PATH;
      const templateUrl =
        typeof window !== "undefined"
          ? new URL(templatePath, window.location.origin).toString()
          : templatePath;
      const templateRes = await fetch(templateUrl, { cache: "no-store" });
      if (!templateRes.ok) {
        throw new Error("Template CV tidak dapat diunduh.");
      }
      const templateBuffer = await templateRes.arrayBuffer();
      const templateBase64 = arrayBufferToBase64(templateBuffer);

      const result = await onGenerateCvAi({
        student_id,
        student_name: studentData?.name ?? undefined,
        template_path: templatePath,
        template_url: templateUrl,
        template_base64: templateBase64,
        answers: generateAnswersPayload,
        sections: tabItems.map((tab) => ({
          key: tab.key,
          label: tab.label,
          items: tab.items,
        })),
        meta: {
          cv_status: cvStatus.label,
          submitted_at: timeline.submittedAt,
          admission_at: timeline.admissionAt,
        },
      });

      const fileBase64 = pickGeneratedFileBase64(result);
      const generatedFileName =
        pickGeneratedFileName(result) ??
        `${(studentData?.name ?? "student").replace(/\s+/g, "_")}_CV.docx`;
      const generatedMimeType =
        pickGeneratedMimeType(result) ?? WORD_DOCUMENT_MIME_TYPE;
      const generatedResponse = pickGeneratedResponse(result);
      if (!fileBase64) {
        throw new Error("Response generate tidak berisi file Word.");
      }

      const wordFile = base64ToFile(
        fileBase64,
        generatedFileName,
        generatedMimeType,
      );
      const uploadPath = `generate-cv-ai/${student_id}/${generatedFileName}`;
      const uploaded = await uploadDocument({
        file: wordFile,
        path: uploadPath,
        content_type: generatedMimeType,
      });

      if (cvDocument?.id) {
        const payload = {
          student_id,
          document_id: String(cvDocument.id),
          file_url: uploaded.url,
          file_path: uploaded.path,
          file_name: generatedFileName,
          file_type: generatedMimeType,
          status: "generated",
        };

        if (existingCvAnswerDocument?.id) {
          await onUpdateAnswerDocument({
            id: existingCvAnswerDocument.id,
            payload,
          });
        } else {
          await onCreateAnswerDocuments([payload]);
        }
      }

      if (objectUrlRef.current && objectUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      objectUrlRef.current = uploaded.url;
      setGeneratedCvUrl(uploaded.url);
      setGeneratedCvPath(uploaded.path);
      setGeneratedCvFileName(generatedFileName);
      setGeneratedCvMimeType(generatedMimeType);
      setGeneratedCvContent(generatedResponse);

      notification.success({
        message: "Generate CV AI berhasil",
        description: cvDocument?.id
          ? "Word CV berhasil dibuat, diupload ke Supabase, dan tersimpan di data dokumen."
          : "Word CV berhasil dibuat dan diupload ke Supabase.",
      });
    } catch (error) {
      notification.error({
        message: "Generate CV AI gagal",
        description: extractGenerateErrorMessage(error),
      });
    }
  }, [
    cvStatus.label,
    generateAnswersPayload,
    existingCvAnswerDocument?.id,
    cvDocument?.id,
    notification,
    onGenerateCvAi,
    onCreateAnswerDocuments,
    onUpdateAnswerDocument,
    student_id,
    studentData?.name,
    tabItems,
    timeline.admissionAt,
    timeline.submittedAt,
    uploadDocument,
  ]);
  const handlePreviewCv = useCallback(() => {
    if (!previewCvUrl) {
      notification.info(
        generatedCvContent
          ? {
              message: "Dokumen Word belum tersedia",
              description:
                "Hasil generate teks sudah ada di panel, tetapi file Word belum tersedia.",
            }
          : {
              message: "Belum ada dokumen Word",
              description: "Silakan generate CV terlebih dahulu.",
            },
      );
      return;
    }

    const absoluteUrl = new URL(
      previewCvUrl,
      window.location.origin,
    ).toString();

    if (!onlyOfficeEnabled) {
      notification.info({
        message: "OnlyOffice belum dikonfigurasi",
        description:
          "Preview edit di browser akan aktif setelah NEXT_PUBLIC_ONLYOFFICE_URL diset.",
      });
      return;
    }

    if (!previewCvPath || !isWordDocument(absoluteUrl, previewCvFileName, previewCvMimeType)) {
      notification.warning({
        message: "Dokumen belum siap diedit",
        description:
          "File Word atau path penyimpanan belum lengkap untuk dibuka di editor browser.",
      });
      return;
    }

    setIsOnlyOfficeOpen(true);
  }, [
    generatedCvContent,
    notification,
    onlyOfficeEnabled,
    previewCvFileName,
    previewCvMimeType,
    previewCvPath,
    previewCvUrl,
  ]);

  const handleSubmitForReview = useCallback(() => {
    if (!hasGeneratedCv) {
      notification.warning({
        message: "CV belum dibuat",
        description: "Generate CV AI dulu sebelum submit ke Director.",
      });
      return;
    }

    if (cvStatus.label !== "Ready for Director") {
      notification.warning({
        message: "Belum siap dikirim",
        description: "Pastikan semua jawaban sudah di-approve Admission.",
      });
      return;
    }

    notification.success({
      message: "Ready for Director",
      description: "CV sudah siap dikirim untuk review Director.",
    });
  }, [cvStatus.label, hasGeneratedCv, notification]);

  return (
    <Row gutter={[16, 16]}>
      <Col span={16}>
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 22,
            borderColor: "#d8dee9",
            overflow: "hidden",
          }}
          loading={fetchLoading}
        >
          <Tabs
            defaultActiveKey={tabItems[0]?.key}
            items={tabItems.map((tab) => ({
              key: tab.key,
              label: (
                <Typography.Text
                  strong
                  style={{ fontSize: 15, color: "#4b5563" }}
                >
                  {tab.label}
                </Typography.Text>
              ),
              children: (
                <div style={{ padding: 16 }}>
                  {tab.items.length === 0 ? (
                    <Typography.Text type="secondary">
                      Belum ada jawaban pada section ini.
                    </Typography.Text>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {tab.items.map((item) => {
                        const isLongAnswer =
                          item.inputType === "TEXTAREA" ||
                          item.answer.length > 90;
                        const status = (
                          approvalMap.get(item.id)?.status ?? "pending"
                        ).toLowerCase();
                        const currentNote =
                          approvalMap.get(item.id)?.note ?? "";
                        const noteValue = noteDrafts[item.id] ?? currentNote;

                        return (
                          <Col
                            key={item.id}
                            xs={24}
                            md={isLongAnswer ? 24 : 12}
                          >
                            <Space
                              direction="vertical"
                              size={8}
                              style={{ width: "100%" }}
                            >
                              <Typography.Text
                                strong
                                style={{ fontSize: 16, color: "#1f2937" }}
                              >
                                {item.question}
                              </Typography.Text>

                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "1fr auto auto",
                                  gap: 10,
                                  alignItems: "center",
                                }}
                              >
                                <div
                                  style={{
                                    minHeight: isLongAnswer ? 92 : 48,
                                    padding: "10px 14px",
                                    borderRadius: 12,
                                    border: "1px solid #d6dae2",
                                    background: "#f8fafc",
                                    fontSize: 17,
                                    color: "#1f2937",
                                    lineHeight: 1.4,
                                  }}
                                >
                                  {item.answer}
                                </div>

                                <Button
                                  shape="circle"
                                  size="middle"
                                  icon={
                                    <CheckOutlined
                                      style={{ color: "#16a34a" }}
                                    />
                                  }
                                  onClick={() =>
                                    handleApprove(item.id, "approved")
                                  }
                                  loading={
                                    savingApprovalId === item.id &&
                                    savingApprovalStatus === "approved"
                                  }
                                  style={{
                                    width: 42,
                                    height: 42,
                                    borderColor: "#9be3b7",
                                    background:
                                      status === "approved"
                                        ? "#d7f7e5"
                                        : "#ffffff",
                                  }}
                                />

                                <Button
                                  shape="circle"
                                  size="middle"
                                  icon={
                                    <CloseOutlined
                                      style={{ color: "#ef4444" }}
                                    />
                                  }
                                  onClick={() =>
                                    handleApprove(item.id, "rejected")
                                  }
                                  loading={
                                    savingApprovalId === item.id &&
                                    savingApprovalStatus === "rejected"
                                  }
                                  style={{
                                    width: 42,
                                    height: 42,
                                    borderColor: "#f6b9b9",
                                    background:
                                      status === "rejected"
                                        ? "#fee2e2"
                                        : "#ffffff",
                                  }}
                                />
                              </div>

                              <Space
                                align="start"
                                size={8}
                                style={{ width: "100%" }}
                              >
                                <Tag
                                  color={
                                    status === "approved"
                                      ? "green"
                                      : status === "rejected"
                                        ? "red"
                                        : "gold"
                                  }
                                  style={{ marginTop: 6 }}
                                >
                                  {status.toUpperCase()}
                                </Tag>

                                <Input.TextArea
                                  value={noteValue}
                                  onChange={(event) =>
                                    setNoteDrafts((prev) => ({
                                      ...prev,
                                      [item.id]: event.target.value,
                                    }))
                                  }
                                  autoSize={{ minRows: 1, maxRows: 2 }}
                                  placeholder="Keterangan approval/reject"
                                  style={{ maxWidth: 420 }}
                                />
                              </Space>
                            </Space>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </div>
              ),
            }))}
          />
        </Card>
      </Col>

      <Col span={8}>
        <Card
          style={{ borderRadius: 18, borderColor: "#d8dee9" }}
          bodyStyle={{ padding: 24 }}
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Space direction="vertical" size={2}>
              <Typography.Title level={3} style={{ margin: 0 }}>
                CV Status & Preview
              </Typography.Title>
              <Typography.Text type="secondary">Current Status</Typography.Text>
            </Space>

            <Tag
              color={cvStatus.color}
              style={{
                width: "fit-content",
                padding: "4px 14px",
                borderRadius: 999,
                fontWeight: 600,
              }}
            >
              {cvStatus.label}
            </Tag>

            <Divider style={{ margin: "4px 0 8px" }} />

            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              <Space align="start" size={10}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    marginTop: 6,
                    borderRadius: "50%",
                    border: "3px solid #22c55e",
                  }}
                />
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>Student Submitted</Typography.Text>
                  <Typography.Text type="secondary">
                    {String(timeline.submittedAt)}
                  </Typography.Text>
                </Space>
              </Space>

              <Space align="start" size={10}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    marginTop: 6,
                    borderRadius: "50%",
                    border: "3px solid #22c55e",
                  }}
                />
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>Admission Approval</Typography.Text>
                  <Typography.Text type="secondary">
                    {String(timeline.admissionAt)}
                  </Typography.Text>
                </Space>
              </Space>

              <Space align="start" size={10}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    marginTop: 6,
                    borderRadius: "50%",
                    border: "3px solid #cbd5e1",
                  }}
                />
                <Space direction="vertical" size={0}>
                  <Typography.Text strong style={{ color: "#94a3b8" }}>
                    Director Approval
                  </Typography.Text>
                  <Typography.Text type="secondary">Pending</Typography.Text>
                </Space>
              </Space>
            </Space>

            {previewCvUrl && (
              <Typography.Text
                type="secondary"
                style={{ wordBreak: "break-all" }}
              >
                Generated Word: {previewCvUrl}
              </Typography.Text>
            )}

            {!onlyOfficeEnabled && (
              <Typography.Text type="secondary">
                Preview edit di browser membutuhkan konfigurasi
                {" `NEXT_PUBLIC_ONLYOFFICE_URL` "}.
                File Word tetap tersimpan ke Supabase setelah generate berhasil.
              </Typography.Text>
            )}

            {/* {generatedCvContent && (
              <div
                style={{
                  maxHeight: 220,
                  overflow: "auto",
                  padding: 14,
                  borderRadius: 14,
                  border: "1px solid #d8dee9",
                  background: "#f8fafc",
                  whiteSpace: "pre-wrap",
                  color: "#1f2937",
                  lineHeight: 1.6,
                }}
              >
                {generatedCvContent}
              </div>
            )} */}

            <Space
              direction="vertical"
              size={10}
              style={{ width: "100%", marginTop: 8 }}
            >
              <Button
                type="primary"
                size="large"
                block
                icon={<FileTextOutlined />}
                loading={onGenerateCvAiLoading}
                style={{ borderRadius: 999, height: 44 }}
                onClick={handleGenerateCv}
              >
                Generate CV AI
              </Button>

              <Button
                size="large"
                block
                icon={<EyeOutlined />}
                disabled={!previewCvUrl}
                style={{ borderRadius: 999, height: 44 }}
                onClick={previewCvUrl ? handlePreviewCv : undefined}
              >
                Preview/Edit Word
              </Button>

              <Button
                type="primary"
                size="large"
                block
                disabled={!hasGeneratedCv}
                style={{ borderRadius: 999, height: 44 }}
                onClick={handleSubmitForReview}
              >
                Submit for Review
              </Button>
            </Space>

            <div
              style={{
                marginTop: 4,
                padding: "14px 14px",
                borderRadius: 14,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
              }}
            >
              <Typography.Text style={{ color: "#1d4ed8", lineHeight: 1.5 }}>
                CV digenerate otomatis ke format Word dari jawaban form.
                Pastikan data sudah lengkap dan ter-approve sebelum submit ke
                Director.
              </Typography.Text>
            </div>
          </Space>
        </Card>
      </Col>
      <Modal
        open={isOnlyOfficeOpen}
        onCancel={() => setIsOnlyOfficeOpen(false)}
        footer={null}
        destroyOnHidden
        width="95vw"
        style={{ top: 16 }}
        styles={{ body: { padding: 0, height: "85vh" } }}
        title={previewCvFileName ?? "Editor Word"}
      >
        {previewCvUrl &&
        previewCvPath &&
        onlyOfficeEnabled &&
        previewOnlyOfficeCallbackUrl ? (
          <OnlyOfficeEditor
            callbackUrl={previewOnlyOfficeCallbackUrl}
            documentTitle={previewCvFileName ?? "CV.docx"}
            documentUrl={previewCvUrl}
            editorUrl={ONLYOFFICE_URL}
          />
        ) : null}
      </Modal>
    </Row>
  );
}
