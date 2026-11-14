"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Input,
  Row,
  Segmented,
  Space,
  Spin,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  MessageOutlined,
  SaveOutlined,
  SolutionOutlined,
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
import CvPreview from "../../cv/editor/CvPreview";
import { extractStudentCvData } from "../../cv/editor/utils";
import { resolveOptionIdOrValueToLabel } from "@/app/utils/personal-info-submissions";
import type { CvData, CvTemplateId } from "../../cv/editor/types";
import styles from "../detail.module.css";

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
const CV_MANUAL_TEMPLATE_PUBLIC_PATH =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_CV_MANUAL_TEMPLATE_PUBLIC_PATH) ||
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
      (id) =>
        optionLabelMap.get(id) ||
        resolveOptionIdOrValueToLabel(id) ||
        id,
    );
    return labels.join(", ");
  }
  return resolveOptionIdOrValueToLabel(rawText) || "-";
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
  const { user_id, role } = useAuth();
  const normalizedRole = (role ?? "").toLowerCase();
  const isConsultant = normalizedRole === "consultant";
  const isDirector = normalizedRole === "director";
  const canApprove = !isConsultant && !isDirector;

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [activeNoteFieldId, setActiveNoteFieldId] = useState<string | null>(null);
  const [batchApprovingBaseId, setBatchApprovingBaseId] = useState<string | null>(null);
  const [savingApprovalId, setSavingApprovalId] = useState<string | null>(null);
  const [savingApprovalStatus, setSavingApprovalStatus] = useState<
    string | null
  >(null);
  const [manualCreatingCv, setManualCreatingCv] = useState(false);
  const [mobileCvTab, setMobileCvTab] = useState<"data" | "cv">("data");

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
      withNotification: false,
    });
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const extractedCv = useMemo(() => {
    if (!studentData) return null;
    return extractStudentCvData(
      studentData,
      answerQuestions ?? [],
      questions ?? [],
      questionBases ?? [],
    );
  }, [studentData, answerQuestions, questions, questionBases]);

  const [liveCvData, setLiveCvData] = useState<CvData | null>(null);

  useEffect(() => {
    if (extractedCv) {
      setLiveCvData((prev) => {
        if (!prev) return extractedCv;
        return {
          ...extractedCv,
          template_id: prev.template_id ?? extractedCv.template_id,
        };
      });
    }
  }, [extractedCv]);

  const handleTemplateChange = (templateId: CvTemplateId) => {
    setLiveCvData((prev) => (prev ? { ...prev, template_id: templateId } : null));
  };

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
        if (status === "rejected") {
          setActiveNoteFieldId(answerId);
        }
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

  const handleApproveAllInSection = useCallback(
    async (
      items: Array<{
        id: string;
        question: string;
        answer: string;
        inputType?: string;
      }>,
      baseId: string,
    ) => {
      if (!user_id) {
        notification.error({
          message: "Reviewer tidak ditemukan",
          description: "Silakan login ulang sebagai admission.",
        });
        return;
      }

      const pendingOrRejectedItems = items.filter((item) => {
        const status = (
          approvalMap.get(item.id)?.status ?? "pending"
        ).toLowerCase();
        return status !== "approved";
      });

      if (pendingOrRejectedItems.length === 0) {
        notification.info({
          message: "Semua data sudah disetujui",
          description:
            "Seluruh jawaban pada bagian ini sudah berstatus disetujui.",
        });
        return;
      }

      setBatchApprovingBaseId(baseId);
      try {
        await Promise.all(
          pendingOrRejectedItems.map((item) =>
            onCreateApproval({
              answer_id: item.id,
              student_id,
              reviewer_id: user_id,
              status: "approved",
              note:
                noteDrafts[item.id] ||
                approvalMap.get(item.id)?.note ||
                undefined,
            }),
          ),
        );
        notification.success({
          message: "Persetujuan Berhasil",
          description: `${pendingOrRejectedItems.length} jawaban pada bagian ini berhasil disetujui.`,
        });
      } catch (error) {
        notification.error({
          message: "Gagal menyetujui seluruh data",
          description:
            error instanceof Error ? error.message : "Coba lagi beberapa saat.",
        });
      } finally {
        setBatchApprovingBaseId(null);
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
          student_folder_key: `${studentData?.name ?? "student"}-${student_id}`,
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

  const handleCreateManualCv = useCallback(async () => {
    if (!student_id) {
      notification.warning({
        message: "Student ID kosong",
        description: "Tidak bisa membuat CV manual tanpa student_id.",
      });
      return;
    }

    setManualCreatingCv(true);
    try {
      const templatePath = CV_MANUAL_TEMPLATE_PUBLIC_PATH;
      const templateUrl =
        typeof window !== "undefined"
          ? new URL(templatePath, window.location.origin).toString()
          : templatePath;
      const templateRes = await fetch(templateUrl, { cache: "no-store" });
      if (!templateRes.ok) {
        throw new Error("Template CV manual tidak dapat diunduh.");
      }

      const templateBuffer = await templateRes.arrayBuffer();
      const manualFileName = `${(studentData?.name ?? "student").replace(/\s+/g, "_")}_CV_MANUAL.docx`;
      const manualFile = new File([templateBuffer], manualFileName, {
        type: WORD_DOCUMENT_MIME_TYPE,
      });

      if (objectUrlRef.current && objectUrlRef.current.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
      const localPreviewUrl = URL.createObjectURL(manualFile);
      objectUrlRef.current = localPreviewUrl;
      setGeneratedCvUrl(localPreviewUrl);
      setGeneratedCvPath(null);
      setGeneratedCvContent(null);

      const uploadPath = `${GENERATED_CV_FOLDER}/${student_id}/${Date.now()}-${manualFileName}`;
      const uploaded = await uploadDocument({
        file: manualFile,
        path: uploadPath,
        content_type: WORD_DOCUMENT_MIME_TYPE,
        student_folder_key: `${studentData?.name ?? "student"}-${student_id}`,
      });

      await onUpsertGeneratedCvAi({
        student_id,
        file_url: uploaded.url,
        file_path: uploaded.path,
        file_name: manualFileName,
        file_type: WORD_DOCUMENT_MIME_TYPE,
        status: "generated",
      });

      setGeneratedCvUrl(uploaded.url);
      setGeneratedCvPath(uploaded.path);

      notification.success({
        message: "CV manual siap diedit",
        description:
          "Draft Word dari template manual sudah dibuat dan tersimpan. Lanjutkan di Preview/Edit Word.",
      });
    } catch (error) {
      notification.error({
        message: "Buat CV manual gagal",
        description: extractGenerateErrorMessage(error),
      });
    } finally {
      setManualCreatingCv(false);
    }
  }, [
    notification,
    onUpsertGeneratedCvAi,
    studentData?.name,
    student_id,
    uploadDocument,
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


  const renderCvPreviewCard = () => (
    liveCvData ? (
      <Card
        style={{
          borderRadius: 22,
          borderColor: "#d8dee9",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #f1f5f9",
            background: "#ffffff",
          }}
        >
          <Typography.Title level={5} style={{ margin: 0, fontWeight: 700, color: "#0f172a" }}>
            Pratinjau Dokumen CV
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Tersusun otomatis dari data siswa
          </Typography.Text>
        </div>

        <CvPreview
          cv={liveCvData}
          onChangeTemplate={handleTemplateChange}
        />
      </Card>
    ) : (
      <Card style={{ borderRadius: 22, borderColor: "#d8dee9", padding: "40px 20px", textAlign: "center" }}>
        <Spin tip="Memuat data CV siswa..." />
      </Card>
    )
  );

  const renderCvStatusCard = () => (
    <Card
      style={{ borderRadius: 18, borderColor: "#d8dee9" }}
      styles={{ body: { padding: "18px 20px" } }}
    >
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <Space direction="vertical" size={2}>
          <Typography.Text
            strong
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              display: "block",
            }}
          >
            CV Status & Preview
          </Typography.Text>
          <Typography.Text
            type="secondary"
            style={{ fontSize: 11.5, color: "#64748b" }}
          >
            Current Status
          </Typography.Text>
        </Space>

        <Tag
          color={cvStatus.color}
          style={{
            width: "fit-content",
            padding: "2px 10px",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 12,
          }}
        >
          {cvStatus.label}
        </Tag>

        {!isReadyToGenerateCv && approvalProgress.total > 0 && (
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 12,
              lineHeight: 1.5,
              color: "#64748b",
              display: "block",
            }}
          >
            {approvalProgress.rejectedCount > 0
              ? "Masih ada jawaban yang ditolak. Semua jawaban harus approved sebelum CV bisa digenerate."
              : `${approvalProgress.pendingCount} jawaban masih menunggu approval. Generate CV akan aktif setelah semua approved.`}
          </Typography.Text>
        )}

        <Divider style={{ margin: "2px 0 6px" }} />

        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <Space align="start" size={10}>
            <div
              style={{
                width: 10,
                height: 10,
                marginTop: 4,
                borderRadius: "50%",
                border: "2.5px solid #22c55e",
              }}
            />
            <Space direction="vertical" size={2}>
              <Typography.Text
                strong
                style={{ fontSize: 12.5, color: "#1e293b" }}
              >
                Student Submitted
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, color: "#64748b" }}
              >
                {String(timeline.submittedAt)}
              </Typography.Text>
            </Space>
          </Space>

          <Space align="start" size={10}>
            <div
              style={{
                width: 10,
                height: 10,
                marginTop: 4,
                borderRadius: "50%",
                border: "2.5px solid #22c55e",
              }}
            />
            <Space direction="vertical" size={2}>
              <Typography.Text
                strong
                style={{ fontSize: 12.5, color: "#1e293b" }}
              >
                Admission Approval
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, color: "#64748b" }}
              >
                {String(timeline.admissionAt)}
              </Typography.Text>
            </Space>
          </Space>

          <Space align="start" size={10}>
            <div
              style={{
                width: 10,
                height: 10,
                marginTop: 4,
                borderRadius: "50%",
                border: "2.5px solid #cbd5e1",
              }}
            />
            <Space direction="vertical" size={2}>
              <Typography.Text
                strong
                style={{ fontSize: 12.5, color: "#94a3b8" }}
              >
                Director Approval
              </Typography.Text>
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, color: "#94a3b8" }}
              >
                Pending
              </Typography.Text>
            </Space>
          </Space>
        </Space>

        {previewCvUrl && (
          <Typography.Text
            type="secondary"
            style={{
              wordBreak: "break-all",
              fontSize: 11.5,
              color: "#64748b",
            }}
          >
            Generated Word: {previewCvUrl}
          </Typography.Text>
        )}

        {!onlyOfficeEnabled && (
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 11.5,
              color: "#64748b",
              lineHeight: 1.5,
              display: "block",
            }}
          >
            Preview edit di browser membutuhkan konfigurasi{" "}
            <code
              style={{
                fontSize: 11,
                color: "#334155",
                background: "#f1f5f9",
                padding: "1px 4px",
                borderRadius: 4,
              }}
            >
              NEXT_PUBLIC_ONLYOFFICE_URL
            </code>
            . File Word tetap tersimpan ke Supabase setelah generate berhasil.
          </Typography.Text>
        )}

        <Space
          direction="vertical"
          size={8}
          style={{ width: "100%", marginTop: 4 }}
        >
          <Button
            type="primary"
            block
            icon={<FileTextOutlined />}
            loading={manualCreatingCv}
            disabled={!isReadyToGenerateCv}
            style={{
              borderRadius: 8,
              height: 38,
              fontSize: 12.5,
              backgroundColor: "#1b3d6d",
              borderColor: "#1b3d6d",
              fontWeight: 600,
            }}
            onClick={handleCreateManualCv}
          >
            Generate CV Manual
          </Button>

          <Button
            type="primary"
            block
            disabled={!hasGeneratedCv}
            style={{
              borderRadius: 8,
              height: 38,
              fontSize: 12.5,
              fontWeight: 600,
            }}
            onClick={handleSubmitForReview}
          >
            Submit for Review
          </Button>
        </Space>

        <div
          style={{
            marginTop: 2,
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
          }}
        >
          <Typography.Text
            style={{
              fontSize: 11.5,
              color: "#1e40af",
              lineHeight: 1.5,
              display: "block",
            }}
          >
            CV digenerate otomatis ke format Word dari jawaban form.
            Pastikan data sudah lengkap dan ter-approve sebelum submit ke
            Director.
          </Typography.Text>
        </div>
      </Space>
    </Card>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: "100%" }}>
      {/* HEADER CARD */}
      <Card
        className={styles.cvHeaderCard}
        style={{
          borderRadius: 16,
          borderColor: "#e2e8f0",
          background: "#ffffff",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
        }}
        styles={{ body: { padding: "18px 20px" } }}
      >
        <Flex align="center" gap={12} style={{ minWidth: 0, width: "100%" }}>
          <div className={styles.sectionHeaderIcon}>
            <SolutionOutlined />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div className={styles.sectionHeaderTitle}>
              Student Profile
            </div>
            <div className={styles.sectionHeaderSubtitle}>
              Kelengkapan profil dan validasi berkas CV
            </div>
          </div>
        </Flex>
      </Card>

      {/* Mobile Segmented Toggle */}
      <div className={styles.mobileCvSegmentedRow}>
        <div className={styles.mobileCvSegmentedCard}>
          <Segmented
            block
            size="middle"
            value={mobileCvTab}
            onChange={(val) => setMobileCvTab(val as "data" | "cv")}
            options={[
              {
                label: "Data Kuesioner",
                value: "data",
                icon: <SolutionOutlined />,
              },
              {
                label: "Dokumen CV",
                value: "cv",
                icon: <FileTextOutlined />,
              },
            ]}
          />
        </div>
      </div>

      <Row gutter={[16, 16]} style={{ width: "100%", margin: 0 }}>
        <Col
          xs={24}
          xl={16}
          className={mobileCvTab === "cv" ? styles.hideOnMobile : undefined}
          style={{ minWidth: 0, maxWidth: "100%", paddingLeft: 0, paddingRight: 0 }}
        >
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 22,
            borderColor: "#d8dee9",
            overflow: "hidden",
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
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
                  style={{ fontSize: 13, color: "#4b5563" }}
                >
                  {tab.label}
                </Typography.Text>
              ),
              children: (
                <div style={{ padding: "12px 16px", minWidth: 0, maxWidth: "100%" }}>
                  {/* Section Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px 12px",
                      marginBottom: 16,
                      padding: "10px 14px",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flexWrap: "wrap",
                        minWidth: 0,
                      }}
                    >
                      <Typography.Text
                        strong
                        style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: "#1e293b",
                          wordBreak: "break-word",
                        }}
                      >
                        {tab.label}
                      </Typography.Text>
                      <Tag
                        color={
                          tab.items.every(
                            (it) =>
                              approvalMap.get(it.id)?.status === "approved",
                          ) && tab.items.length > 0
                            ? "success"
                            : "default"
                        }
                        style={{
                          borderRadius: 999,
                          fontSize: 11,
                          fontWeight: 600,
                          margin: 0,
                          padding: "0 8px",
                          height: 22,
                          lineHeight: "20px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {
                          tab.items.filter(
                            (it) =>
                              approvalMap.get(it.id)?.status === "approved",
                          ).length
                        }{" "}
                        / {tab.items.length} Disetujui
                      </Tag>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                      {tab.items.length > 0 && canApprove && (
                        <Button
                          size="small"
                          type="dashed"
                          icon={<CheckOutlined style={{ fontSize: 11 }} />}
                          loading={batchApprovingBaseId === tab.key}
                          onClick={() =>
                            handleApproveAllInSection(tab.items, tab.key)
                          }
                          style={{
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 500,
                            backgroundColor: "#f0fdf4",
                            borderColor: "#86efac",
                            color: "#16a34a",
                            height: 28,
                            padding: "0 10px",
                            whiteSpace: "normal",
                          }}
                        >
                          Setujui Semua di Bagian Ini
                        </Button>
                      )}
                    </div>
                  </div>

                  {tab.items.length === 0 ? (
                    <div style={{ padding: "16px 0" }}>
                      <Typography.Text type="secondary" style={{ display: "block" }}>
                        Belum ada jawaban pada section ini dari student.
                      </Typography.Text>
                    </div>
                  ) : (
                    <Row gutter={[16, 16]}>
                      {tab.items.map((item) => {
                        const isLongAnswer =
                          item.inputType === "TEXTAREA" ||
                          item.answer.length > 90;
                        const status = (
                          approvalMap.get(item.id)?.status ?? "pending"
                        ).toLowerCase();
                        const isApproved = status === "approved";
                        const isRejected = status === "rejected";
                        const currentNote =
                          approvalMap.get(item.id)?.note ?? "";
                        const noteValue =
                          noteDrafts[item.id] ?? currentNote;
                        const isNoteOpen =
                          activeNoteFieldId === item.id ||
                          isRejected ||
                          Boolean(currentNote);

                        return (
                          <Col
                            key={item.id}
                            xs={24}
                            md={isLongAnswer ? 24 : 12}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                height: "100%",
                                padding: "14px 16px",
                                borderRadius: 12,
                                border: `1px solid ${
                                  isApproved
                                    ? "#bbf7d0"
                                    : isRejected
                                      ? "#fecaca"
                                      : "#e2e8f0"
                                }`,
                                background: isApproved
                                  ? "#fcfdfc"
                                  : isRejected
                                    ? "#fffdfd"
                                    : "#ffffff",
                                boxShadow:
                                  "0 1px 3px rgba(15, 23, 42, 0.04)",
                                transition: "all 0.2s ease",
                              }}
                            >
                              {/* Card Header: Pertanyaan & Status Tag */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "flex-start",
                                  gap: 12,
                                  marginBottom: 10,
                                }}
                              >
                                <Typography.Text
                                  strong
                                  style={{
                                    fontSize: 13,
                                    color: "#334155",
                                    lineHeight: 1.4,
                                    flex: 1,
                                  }}
                                >
                                  {item.question}
                                </Typography.Text>

                                {isApproved ? (
                                  <Tag
                                    color="success"
                                    style={{
                                      margin: 0,
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "2px 8px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <CheckOutlined style={{ fontSize: 10 }} />{" "}
                                    Disetujui
                                  </Tag>
                                ) : isRejected ? (
                                  <Tag
                                    color="error"
                                    style={{
                                      margin: 0,
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "2px 8px",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <CloseOutlined style={{ fontSize: 10 }} />{" "}
                                    Perlu Revisi
                                  </Tag>
                                ) : (
                                  <Tag
                                    style={{
                                      margin: 0,
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontWeight: 500,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: 4,
                                      padding: "2px 8px",
                                      color: "#64748b",
                                      background: "#f1f5f9",
                                      borderColor: "#e2e8f0",
                                      flexShrink: 0,
                                    }}
                                  >
                                    <ClockCircleOutlined
                                      style={{ fontSize: 10 }}
                                    />{" "}
                                    Menunggu
                                  </Tag>
                                )}
                              </div>

                              {/* Answer Text Content */}
                              <div
                                style={{
                                  flex: 1,
                                  minHeight: isLongAnswer ? 72 : 40,
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  border: `1px solid ${
                                    isApproved
                                      ? "#dcfce7"
                                      : isRejected
                                        ? "#fee2e2"
                                        : "#f1f5f9"
                                  }`,
                                  background: isApproved
                                    ? "#f0fdf4"
                                    : isRejected
                                      ? "#fef2f2"
                                      : "#f8fafc",
                                  fontSize: 13,
                                  color: "#0f172a",
                                  lineHeight: 1.5,
                                  wordBreak: "break-word",
                                }}
                              >
                                {item.answer || (
                                  <span style={{ color: "#94a3b8" }}>
                                    -
                                  </span>
                                )}
                              </div>

                              {/* Expandable Note / Revision Area */}
                              {isNoteOpen && (
                                <div style={{ marginTop: 10 }}>
                                  <Input.TextArea
                                    value={noteValue}
                                    onChange={(event) =>
                                      setNoteDrafts((prev) => ({
                                        ...prev,
                                        [item.id]: event.target.value,
                                      }))
                                    }
                                    autoSize={{ minRows: 1, maxRows: 3 }}
                                    placeholder="Catatan revisi untuk mahasiswa..."
                                    style={{
                                      fontSize: 12,
                                      borderRadius: 8,
                                      borderColor: isRejected
                                        ? "#fca5a5"
                                        : "#cbd5e1",
                                      background: isRejected
                                        ? "#fff"
                                        : "#fafafa",
                                    }}
                                  />
                                </div>
                              )}

                              {/* Card Footer: Minimalist Actions Group */}
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  alignItems: "center",
                                  gap: 6,
                                  marginTop: 10,
                                  paddingTop: 8,
                                  borderTop: "1px dashed #e2e8f0",
                                }}
                              >
                                <Tooltip
                                  title={
                                    activeNoteFieldId === item.id
                                      ? "Tutup Catatan"
                                      : "Tambah / Edit Catatan Revisi"
                                  }
                                >
                                  <Button
                                    size="small"
                                    type="text"
                                    icon={
                                      <MessageOutlined
                                        style={{ fontSize: 13 }}
                                      />
                                    }
                                    onClick={() =>
                                      setActiveNoteFieldId((prev) =>
                                        prev === item.id ? null : item.id,
                                      )
                                    }
                                    style={{
                                      borderRadius: 6,
                                      height: 28,
                                      color: noteValue
                                        ? "#2563eb"
                                        : "#94a3b8",
                                      backgroundColor:
                                        activeNoteFieldId === item.id
                                          ? "#eff6ff"
                                          : "transparent",
                                    }}
                                  />
                                </Tooltip>

                              {canApprove && (
                                <Tooltip title="Minta revisi jawaban">
                                  <Button
                                    size="small"
                                    icon={
                                      <CloseOutlined
                                        style={{ fontSize: 11 }}
                                      />
                                    }
                                    loading={
                                      savingApprovalId === item.id &&
                                      savingApprovalStatus === "rejected"
                                    }
                                    onClick={() =>
                                      handleApprove(item.id, "rejected")
                                    }
                                    style={{
                                      borderRadius: 6,
                                      height: 28,
                                      padding: "0 10px",
                                      fontSize: 12,
                                      fontWeight: 500,
                                      borderColor: isRejected
                                        ? "#dc2626"
                                        : "#fca5a5",
                                      backgroundColor: isRejected
                                        ? "#dc2626"
                                        : "#ffffff",
                                      color: isRejected
                                        ? "#ffffff"
                                        : "#dc2626",
                                    }}
                                  >
                                    Revisi
                                  </Button>
                                </Tooltip>
                              )}

                              {canApprove && (
                                <Tooltip title="Setujui jawaban">
                                  <Button
                                    size="small"
                                    type="primary"
                                    icon={
                                      <CheckOutlined
                                        style={{ fontSize: 11 }}
                                      />
                                    }
                                    loading={
                                      savingApprovalId === item.id &&
                                      savingApprovalStatus === "approved"
                                    }
                                    onClick={() =>
                                      handleApprove(item.id, "approved")
                                    }
                                    style={{
                                      borderRadius: 6,
                                      height: 28,
                                      padding: "0 10px",
                                      fontSize: 12,
                                      fontWeight: 500,
                                      backgroundColor: isApproved
                                        ? "#16a34a"
                                        : "#22c55e",
                                      borderColor: isApproved
                                        ? "#16a34a"
                                        : "#22c55e",
                                      color: "#ffffff",
                                    }}
                                  >
                                    Setuju
                                  </Button>
                                </Tooltip>
                              )}
                              </div>
                            </div>
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

        {/* PRATINJAU DOKUMEN CV */}
        {liveCvData && (
          <div
            id="cv-live-preview-section"
            className={styles.desktopCvPreviewOnly}
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              marginTop: 16,
              overflowX: "auto",
            }}
          >
            {renderCvPreviewCard()}
          </div>
        )}
      </Col>

      <Col
        xs={24}
        xl={8}
        className={mobileCvTab === "data" ? styles.hideOnMobile : undefined}
        style={{ minWidth: 0, maxWidth: "100%", paddingLeft: 0, paddingRight: 0 }}
      >
        {renderCvStatusCard()}
        {liveCvData && (
          <div
            className={styles.mobileCvPreviewOnly}
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              marginTop: 14,
              overflowX: "auto",
            }}
          >
            {renderCvPreviewCard()}
          </div>
        )}
      </Col>
    </Row>
  </Space>
  );
}
