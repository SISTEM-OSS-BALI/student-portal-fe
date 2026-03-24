"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Input,
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
import { useGeneratedCvAiDocuments } from "@/app/hooks/use-generated-cv-ai-documents";
import { useUser } from "@/app/hooks/use-users";
import { useRouter } from "next/navigation";

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
const GENERATED_CV_FOLDER = "generate-cv-ai";

const WORD_DOCUMENT_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const ONLYOFFICE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_ONLYOFFICE_URL?.trim()) ||
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

export default function CVComponents({ student_id }: CVComponentsProps) {
  const router = useRouter();
  const { notification } = App.useApp();
  const { user_id } = useAuth();

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [savingApprovalId, setSavingApprovalId] = useState<string | null>(null);
  const [savingApprovalStatus, setSavingApprovalStatus] = useState<
    string | null
  >(null);

  const [generatedCvUrl, setGeneratedCvUrl] = useState<string | null>(null);
  const [generatedCvPath, setGeneratedCvPath] = useState<string | null>(null);
  const [generatedCvContent, setGeneratedCvContent] = useState<string | null>(
    null,
  );
  const objectUrlRef = useRef<string | null>(null);

  const { data: studentData } = useUser({ id: student_id });
  const { data: questionBases } = useQuestionBases({});
  const { onGenerateCvAi, onGenerateCvAiLoading } = useGenerateCvAi();
  const { uploadDocument } = useDocumentUpload();
  const { data: generatedCvDocuments = [], onUpsert: onUpsertGeneratedCvAi } =
    useGeneratedCvAiDocuments({
      studentId: student_id,
      enabled: Boolean(student_id),
    });
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

  const persistedCvDocument = useMemo(() => {
    const generatedPrefix = `${GENERATED_CV_FOLDER}/${student_id}/`;
    return [...generatedCvDocuments]
      .filter((doc) => {
        const filePath = String(doc.file_path ?? "");
        return (
          filePath.startsWith(generatedPrefix) ||
          String(doc.file_name ?? "").toLowerCase().includes("_cv.")
        );
      })
      .sort((a, b) => {
        const aTime = new Date(a.updated_at ?? a.created_at).getTime();
        const bTime = new Date(b.updated_at ?? b.created_at).getTime();
        return bTime - aTime;
      })[0];
  }, [generatedCvDocuments, student_id]);

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

  const reviewableAnswerIds = useMemo(
    () =>
      Array.from(answerGroupsMap.values()).flatMap((group) =>
        group.items.map((item) => item.id),
      ),
    [answerGroupsMap],
  );

  const approvalProgress = useMemo(() => {
    let approvedCount = 0;
    let rejectedCount = 0;

    reviewableAnswerIds.forEach((answerId) => {
      const status = (approvalMap.get(answerId)?.status ?? "").toLowerCase();
      if (status === "approved") approvedCount += 1;
      if (status === "rejected") rejectedCount += 1;
    });

    return {
      total: reviewableAnswerIds.length,
      approvedCount,
      rejectedCount,
      pendingCount: Math.max(
        reviewableAnswerIds.length - approvedCount - rejectedCount,
        0,
      ),
    };
  }, [approvalMap, reviewableAnswerIds]);

  const isReadyToGenerateCv =
    approvalProgress.total > 0 &&
    approvalProgress.approvedCount === approvalProgress.total &&
    approvalProgress.rejectedCount === 0;

  const cvStatus = useMemo(() => {
    if (approvalProgress.rejectedCount > 0) {
      return { label: "Revision Needed", color: "red" as const };
    }
    if (isReadyToGenerateCv) {
      return { label: "Ready for Director", color: "green" as const };
    }
    return { label: "Pending Admission", color: "gold" as const };
  }, [approvalProgress.rejectedCount, isReadyToGenerateCv]);

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

  const previewCvUrl = generatedCvUrl ?? persistedCvDocument?.file_url ?? null;
  const previewCvPath =
    generatedCvPath ?? persistedCvDocument?.file_path ?? null;
  const onlyOfficeEnabled = Boolean(ONLYOFFICE_URL);
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

    if (!isReadyToGenerateCv) {
      notification.warning({
        message: "Approval belum lengkap",
        description:
          approvalProgress.rejectedCount > 0
            ? "Masih ada jawaban yang ditolak. Perbaiki dan approve semua jawaban sebelum generate CV."
            : `Masih ada ${approvalProgress.pendingCount} jawaban yang belum di-approve. Generate CV hanya bisa dilakukan setelah semua jawaban approved.`,
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
      if (objectUrlRef.current && objectUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const localPreviewUrl = URL.createObjectURL(wordFile);
      objectUrlRef.current = localPreviewUrl;
      setGeneratedCvUrl(localPreviewUrl);
      setGeneratedCvPath(null);
      setGeneratedCvContent(generatedResponse);

      try {
        const uploadPath = `${GENERATED_CV_FOLDER}/${student_id}/${Date.now()}-${generatedFileName}`;
        const uploaded = await uploadDocument({
          file: wordFile,
          path: uploadPath,
          content_type: generatedMimeType,
        });

        const payload = {
          student_id,
          file_url: uploaded.url,
          file_path: uploaded.path,
          file_name: generatedFileName,
          file_type: generatedMimeType,
          status: "generated",
        };

        await onUpsertGeneratedCvAi(payload);

        objectUrlRef.current = localPreviewUrl;
        setGeneratedCvUrl(uploaded.url);
        setGeneratedCvPath(uploaded.path);

        notification.success({
          message: "Generate CV AI berhasil",
          description:
            "Word CV berhasil dibuat, diupload ke Supabase, dan tersimpan di data dokumen.",
        });
      } catch (persistError) {
        notification.warning({
          message: "Generate CV AI berhasil, tetapi file belum tersimpan",
          description:
            extractGenerateErrorMessage(persistError) ||
            "Preview lokal tersedia, tetapi upload atau penyimpanan metadata gagal.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Generate CV AI gagal",
        description: extractGenerateErrorMessage(error),
      });
    }
  }, [
    approvalProgress.pendingCount,
    approvalProgress.rejectedCount,
    cvStatus.label,
    generateAnswersPayload,
    isReadyToGenerateCv,
    notification,
    onGenerateCvAi,
    onUpsertGeneratedCvAi,
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

    if (!previewCvPath && previewCvUrl.startsWith("blob:")) {
      window.open(previewCvUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!onlyOfficeEnabled) {
      notification.info({
        message: "OnlyOffice belum dikonfigurasi",
        description:
          "Preview edit di browser akan aktif setelah NEXT_PUBLIC_ONLYOFFICE_URL diset.",
      });
      return;
    }

    if (!previewCvPath) {
      notification.warning({
        message: "Dokumen belum siap diedit",
        description:
          "File aktif belum tersimpan ke Supabase sehingga editor browser belum bisa dibuka.",
      });
      return;
    }

    router.push(
      `/admission/dashboard/students-management/detail/${student_id}/cv/editor`,
    );
  }, [
    generatedCvContent,
    notification,
    onlyOfficeEnabled,
    previewCvPath,
    previewCvUrl,
    router,
    student_id,
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

            {!isReadyToGenerateCv && approvalProgress.total > 0 && (
              <Typography.Text type="secondary">
                {approvalProgress.rejectedCount > 0
                  ? "Masih ada jawaban yang ditolak. Semua jawaban harus approved sebelum CV bisa digenerate."
                  : `${approvalProgress.pendingCount} jawaban masih menunggu approval. Generate CV akan aktif setelah semua approved.`}
              </Typography.Text>
            )}

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
                disabled={!isReadyToGenerateCv}
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
    </Row>
  );
}
