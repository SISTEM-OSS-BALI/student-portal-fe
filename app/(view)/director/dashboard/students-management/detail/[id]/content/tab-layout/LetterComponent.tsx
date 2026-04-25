"use client";

import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useGenerateSponsorLetterAi } from "@/app/hooks/use-generate-sponsor-letter-ai";
import { useGenerateStatementLetterAi } from "@/app/hooks/use-generate-statement-letter-ai";
import { useGeneratedSponsorLetterAiDocuments } from "@/app/hooks/use-generated-sponsor-letter-ai-documents";
import { useGeneratedStatementLetterAiDocuments } from "@/app/hooks/use-generated-statement-letter-ai-documents";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import { useQuestions } from "@/app/hooks/use-questions";
import { useSponsorLetterAiApprovals } from "@/app/hooks/use-sponsor-letter-ai-approvals";
import { useStatementLetterAiApprovals } from "@/app/hooks/use-statement-letter-ai-approvals";
import { useUser } from "@/app/hooks/use-users";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import {
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  RobotOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from "antd";
import axios from "axios";
import { useParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";

const { Paragraph, Text, Title } = Typography;
const STATEMENT_LETTER_CHECKLIST_PUBLIC_PATH =
  "/assets/file/Kerangka GS 2026.pdf";
const SPONSOR_LETTER_CHECKLIST_PUBLIC_PATH =
  "/assets/file/Sponsor Letter Checklist.pdf";
const GENERATED_STATEMENT_LETTER_FOLDER = "generate-statement-letter-ai";
const GENERATED_SPONSOR_LETTER_FOLDER = "generate-sponsor-letter-ai";
const WORD_DOCUMENT_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type LetterCardProps = {
  title: string;
  tone: "blue" | "green";
  status: string;
  statusColor: string;
  progress?: number;
  activity: Array<{
    title: string;
    meta: string;
  }>;
  onGenerate?: () => void | Promise<void>;
  onPreview?: () => void;
  onSubmit?: () => void | Promise<void>;
  onCancelSubmit?: () => void | Promise<void>;
  generateLoading?: boolean;
  previewDisabled?: boolean;
  submitLoading?: boolean;
  submitDisabled?: boolean;
  submitLabel?: string;
  cancelSubmitLoading?: boolean;
  cancelSubmitDisabled?: boolean;
  showCancelSubmit?: boolean;
  cancelSubmitLabel?: string;
  showGenerate?: boolean;
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
  response?: string;
  file_base64?: string;
  generated_file_name?: string;
  generated_mime_type?: string;
  checklist_version?: string;
  result?: {
    response?: string;
    file_base64?: string;
    generated_file_name?: string;
    generated_mime_type?: string;
    checklist_version?: string;
  };
  data?: {
    response?: string;
    file_base64?: string;
    generated_file_name?: string;
    generated_mime_type?: string;
    checklist_version?: string;
  };
};

type PersistGeneratedWordParams = {
  fileBase64: string;
  generatedFileName: string;
  generatedMimeType: string;
  folder: string;
  objectUrlRef: MutableRefObject<string | null>;
  setUrl: (value: string | null) => void;
  setPath: (value: string | null) => void;
  setFileName: (value: string | null) => void;
  setMimeType: (value: string | null) => void;
  onUpsert: (payload: {
    student_id: string;
    file_url: string;
    file_path?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    status?: string | null;
  }) => Promise<unknown>;
  successMessage: string;
  successDescription: string;
};

const toneStyles = {
  blue: {
    headerBg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    actionBg: "linear-gradient(135deg, #8b5cf6 0%, #2563eb 100%)",
    accent: "#2563eb",
    iconBg: "rgba(255,255,255,0.16)",
  },
  green: {
    headerBg: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    actionBg: "linear-gradient(135deg, #8b5cf6 0%, #2563eb 100%)",
    accent: "#16a34a",
    iconBg: "rgba(255,255,255,0.16)",
  },
} as const;

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

const pickGeneratedResponse = (raw: unknown): string | null => {
  const data = raw as GenerateResultCandidate | null;
  const candidates = [
    data?.response,
    data?.result?.response,
    data?.data?.response,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return null;
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

const getLetterStatusMeta = (status?: string | null) => {
  switch (String(status ?? "").toUpperCase()) {
    case "SUBMITTED_TO_DIRECTOR":
      return { label: "Submitted To Director", color: "processing" };
    case "REVISION_REQUESTED":
      return { label: "Revision Requested", color: "orange" };
    case "APPROVED":
      return { label: "Approved", color: "green" };
    default:
      return { label: "Draft", color: "gold" };
  }
};

function LetterCard({
  title,
  tone,
  status,
  statusColor,
  progress,
  activity,
  onGenerate,
  onPreview,
  onSubmit,
  onCancelSubmit,
  generateLoading,
  previewDisabled,
  submitLoading,
  submitDisabled,
  submitLabel = "Submit To Director",
  cancelSubmitLoading,
  cancelSubmitDisabled,
  showCancelSubmit,
  cancelSubmitLabel = "Cancel Submit To Director",
  showGenerate = true,
}: LetterCardProps) {
  const palette = toneStyles[tone];

  return (
    <Card
      bodyStyle={{ padding: 0 }}
      style={{
        borderRadius: 22,
        overflow: "hidden",
        borderColor: "#dbe3ef",
        boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
      }}
    >
      <div
        style={{
          background: palette.headerBg,
          color: "#fff",
          padding: "14px 16px 12px",
        }}
      >
        <Space direction="vertical" size={8} style={{ width: "100%" }}>
          <Space size={10} align="center">
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: palette.iconBg,
                display: "grid",
                placeItems: "center",
              }}
            >
              <FileTextOutlined style={{ color: "#fff", fontSize: 12 }} />
            </div>
            <Text strong style={{ color: "#fff", fontSize: 16 }}>
              {title}
            </Text>
          </Space>

          <Tag
            color={statusColor}
            style={{
              width: "fit-content",
              marginInlineEnd: 0,
              borderRadius: 999,
              fontWeight: 600,
              paddingInline: 10,
            }}
          >
            {status}
          </Tag>
        </Space>
      </div>

      <div style={{ padding: 16 }}>
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          {typeof progress === "number" ? (
            <div>
              <Progress
                percent={progress}
                showInfo={false}
                strokeColor={palette.accent}
                trailColor="#e5e7eb"
                strokeWidth={6}
              />
            </div>
          ) : null}

          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {showGenerate && onGenerate ? (
              <Button
                block
                type="primary"
                icon={<RobotOutlined />}
                loading={generateLoading}
                style={{
                  borderRadius: 999,
                  height: 42,
                  border: "none",
                  background: palette.actionBg,
                }}
                onClick={onGenerate}
              >
                Generate with AI
              </Button>
            ) : null}
            <Button
              block
              type="primary"
              icon={<EyeOutlined />}
              disabled={previewDisabled}
              onClick={onPreview}
              style={{
                borderRadius: 999,
                height: 42,
                background: "#2563eb",
                borderColor: "#2563eb",
              }}
            >
              Preview Full Letter
            </Button>
            {onSubmit ? (
              <Button
                block
                type="primary"
                icon={<CheckOutlined />}
                loading={submitLoading}
                disabled={submitDisabled}
                onClick={onSubmit}
                style={{
                  borderRadius: 999,
                  height: 42,
                  background: "#16a34a",
                  borderColor: "#16a34a",
                }}
              >
                {submitLabel}
              </Button>
            ) : null}
            {showCancelSubmit && onCancelSubmit ? (
              <Button
                block
                icon={<CloseOutlined />}
                loading={cancelSubmitLoading}
                disabled={cancelSubmitDisabled}
                onClick={onCancelSubmit}
                style={{
                  borderRadius: 999,
                  height: 42,
                  borderColor: "#ef4444",
                  color: "#ef4444",
                  background: "#fff",
                }}
              >
                {cancelSubmitLabel}
              </Button>
            ) : null}
          </Space>

          <div>
            <Divider style={{ margin: "4px 0 12px" }} />
            <Title level={5} style={{ margin: 0, fontSize: 14 }}>
              Activity Log
            </Title>
            <Space
              direction="vertical"
              size={10}
              style={{ width: "100%", marginTop: 12 }}
            >
              {activity.map((item) => (
                <Space key={item.title} align="start" size={10}>
                  <SolutionOutlined
                    style={{ color: "#94a3b8", marginTop: 3 }}
                  />
                  <div>
                    <Paragraph
                      style={{ margin: 0, color: "#334155", fontSize: 12.5 }}
                    >
                      {item.title}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {item.meta}
                    </Text>
                  </div>
                </Space>
              ))}
            </Space>
          </div>
        </Space>
      </div>
    </Card>
  );
}

export default function LetterComponent() {
  const { notification } = App.useApp();
  const params = useParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const [reviewingLetter, setReviewingLetter] = useState<string | null>(null);

  const { data: studentData } = useUser({ id: studentId as string });
  const { data: questionBases } = useQuestionBases({});
  const { data: questions } = useQuestions({});
  const { data: answerQuestions = [] } = useAnswerQuestions({
    queryString: studentId ? `student_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
    withNotification: false,
  });

  const { onGenerateStatementLetterAi, onGenerateStatementLetterAiLoading } =
    useGenerateStatementLetterAi();
  const { onGenerateSponsorLetterAi, onGenerateSponsorLetterAiLoading } =
    useGenerateSponsorLetterAi();
  const { uploadDocument } = useDocumentUpload();

  const {
    data: generatedStatementLetterDocuments = [],
    onUpsert: onUpsertGeneratedStatementLetterAi,
  } = useGeneratedStatementLetterAiDocuments({
    studentId: studentId as string,
    enabled: Boolean(studentId),
  });
  const {
    data: generatedSponsorLetterDocuments = [],
    onUpsert: onUpsertGeneratedSponsorLetterAi,
  } = useGeneratedSponsorLetterAiDocuments({
    studentId: studentId as string,
    enabled: Boolean(studentId),
  });
  const { onCreate: onCreateStatementApproval, onUpdate: onUpdateStatementApproval } =
    useStatementLetterAiApprovals();
  const { onCreate: onCreateSponsorApproval, onUpdate: onUpdateSponsorApproval } =
    useSponsorLetterAiApprovals();

  const persistedStatementLetterDocument =
    generatedStatementLetterDocuments[0] ?? null;
  const persistedSponsorLetterDocument =
    generatedSponsorLetterDocuments[0] ?? null;

  const [generatedStatementLetterUrl, setGeneratedStatementLetterUrl] =
    useState<string | null>(null);
  const [, setGeneratedStatementLetterPath] = useState<string | null>(null);
  const [generatedStatementLetterFileName, setGeneratedStatementLetterFileName] =
    useState<string | null>(null);
  const [generatedStatementLetterMimeType, setGeneratedStatementLetterMimeType] =
    useState<string | null>(null);

  const [generatedSponsorLetterUrl, setGeneratedSponsorLetterUrl] = useState<
    string | null
  >(null);
  const [, setGeneratedSponsorLetterPath] = useState<string | null>(null);
  const [generatedSponsorLetterFileName, setGeneratedSponsorLetterFileName] =
    useState<string | null>(null);
  const [generatedSponsorLetterMimeType, setGeneratedSponsorLetterMimeType] =
    useState<string | null>(null);

  const statementObjectUrlRef = useRef<string | null>(null);
  const sponsorObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const statementUrl = statementObjectUrlRef.current;
    const sponsorUrl = sponsorObjectUrlRef.current;

    return () => {
      if (statementUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(statementUrl);
      }
      if (sponsorUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(sponsorUrl);
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

  const answerGroupsMap = useMemo(() => {
    const groups = new Map<
      string,
      {
        key: string;
        label: string;
        items: Array<{
          id: string;
          question: string;
          answer: string;
          inputType?: string;
        }>;
      }
    >();

    answerQuestions.forEach((answer) => {
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
      const existing = groups.get(baseId) ?? {
        key: baseId,
        label: baseMap.get(baseId) ?? "Question Base",
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

  const sectionsPayload = useMemo(
    () =>
      Array.from(answerGroupsMap.values()).map((group) => ({
        key: group.key,
        label: group.label,
        items: group.items,
      })),
    [answerGroupsMap],
  );

  const generateAnswersPayload = useMemo<GeneratePayloadAnswer[]>(() => {
    const rows: GeneratePayloadAnswer[] = [];

    answerQuestions.forEach((answer) => {
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

  const previewStatementLetterUrl =
    generatedStatementLetterUrl ?? persistedStatementLetterDocument?.file_url ?? null;
  const previewStatementLetterFileName =
    generatedStatementLetterFileName ??
    persistedStatementLetterDocument?.file_name ??
    null;
  const previewStatementLetterMimeType =
    generatedStatementLetterMimeType ??
    persistedStatementLetterDocument?.file_type ??
    null;

  const previewSponsorLetterUrl =
    generatedSponsorLetterUrl ?? persistedSponsorLetterDocument?.file_url ?? null;
  const previewSponsorLetterFileName =
    generatedSponsorLetterFileName ??
    persistedSponsorLetterDocument?.file_name ??
    null;
  const previewSponsorLetterMimeType =
    generatedSponsorLetterMimeType ??
    persistedSponsorLetterDocument?.file_type ??
    null;

  const statementStatusMeta = getLetterStatusMeta(
    persistedStatementLetterDocument?.status,
  );
  const sponsorStatusMeta = getLetterStatusMeta(
    persistedSponsorLetterDocument?.status,
  );

  const persistGeneratedWord = useCallback(
    async ({
      fileBase64,
      generatedFileName,
      generatedMimeType,
      folder,
      objectUrlRef,
      setUrl,
      setPath,
      setFileName,
      setMimeType,
      onUpsert,
      successMessage,
      successDescription,
    }: PersistGeneratedWordParams) => {
      const wordFile = base64ToFile(
        fileBase64,
        generatedFileName,
        generatedMimeType,
      );

      if (objectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const localPreviewUrl = URL.createObjectURL(wordFile);
      objectUrlRef.current = localPreviewUrl;
      setUrl(localPreviewUrl);
      setPath(null);
      setFileName(generatedFileName);
      setMimeType(generatedMimeType);

      const generatedAt = Date.now();
      const uploadPath = `${folder}/${studentId}/${generatedAt}-${generatedFileName}`;
      const uploaded = await uploadDocument({
        file: wordFile,
        path: uploadPath,
        content_type: generatedMimeType,
      });

      await onUpsert({
        student_id: String(studentId),
        file_url: uploaded.url,
        file_path: uploaded.path,
        file_name: generatedFileName,
        file_type: generatedMimeType,
        status: "generated",
      });

      setUrl(uploaded.url);
      setPath(uploaded.path);
      notification.success({
        message: successMessage,
        description: successDescription,
      });
    },
    [notification, studentId, uploadDocument],
  );

  const buildLetterPayload = useCallback(
    (checklistPath: string) => {
      const checklistUrl =
        typeof window !== "undefined"
          ? new URL(checklistPath, window.location.origin).toString()
          : checklistPath;

      return {
        student_id: String(studentId),
        student_name: studentData?.name ?? undefined,
        student_country: studentData?.stage?.country?.name ?? undefined,
        campus_name: studentData?.name_campus ?? undefined,
        degree: studentData?.name_degree ?? studentData?.degree ?? undefined,
        checklist_path: checklistPath,
        checklist_url: checklistUrl,
        answers: generateAnswersPayload,
        sections: sectionsPayload,
        meta: {
          letter_status: "Draft",
        },
      };
    },
    [
      generateAnswersPayload,
      sectionsPayload,
      studentData?.degree,
      studentData?.name,
      studentData?.name_campus,
      studentData?.name_degree,
      studentData?.stage?.country?.name,
      studentId,
    ],
  );

  const handleGenerateStatementLetter = useCallback(async () => {
    if (!studentId) {
      notification.warning({
        message: "Student ID kosong",
        description: "Statement letter tidak bisa digenerate tanpa student_id.",
      });
      return;
    }

    if (generateAnswersPayload.length === 0) {
      notification.warning({
        message: "Belum ada data",
        description:
          "Isi jawaban form student terlebih dahulu sebelum generate statement letter.",
      });
      return;
    }

    try {
      const result = await onGenerateStatementLetterAi(
        buildLetterPayload(STATEMENT_LETTER_CHECKLIST_PUBLIC_PATH),
      );
      const response = pickGeneratedResponse(result);
      const fileBase64 = pickGeneratedFileBase64(result);
      const generatedFileName =
        pickGeneratedFileName(result) ??
        `${(studentData?.name ?? "student").replace(/\s+/g, "_")}_Statement_Letter.docx`;
      const generatedMimeType =
        pickGeneratedMimeType(result) ?? WORD_DOCUMENT_MIME_TYPE;

      if (!response || !fileBase64) {
        throw new Error(
          "Response generate statement letter tidak berisi konten atau file Word.",
        );
      }

      try {
        await persistGeneratedWord({
          fileBase64,
          generatedFileName,
          generatedMimeType,
          folder: GENERATED_STATEMENT_LETTER_FOLDER,
          objectUrlRef: statementObjectUrlRef,
          setUrl: setGeneratedStatementLetterUrl,
          setPath: setGeneratedStatementLetterPath,
          setFileName: setGeneratedStatementLetterFileName,
          setMimeType: setGeneratedStatementLetterMimeType,
          onUpsert: onUpsertGeneratedStatementLetterAi,
          successMessage: "Generate Statement Letter berhasil",
          successDescription: "Statement letter berhasil dibuat dan siap ditinjau.",
        });
      } catch (persistError) {
        notification.warning({
          message: "Statement letter berhasil dibuat, tetapi belum siap dibuka kembali",
          description:
            extractGenerateErrorMessage(persistError) ||
            "Silakan coba generate kembali dalam beberapa saat.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Generate Statement Letter gagal",
        description: extractGenerateErrorMessage(error),
      });
    }
  }, [
    buildLetterPayload,
    generateAnswersPayload.length,
    notification,
    onGenerateStatementLetterAi,
    onUpsertGeneratedStatementLetterAi,
    persistGeneratedWord,
    studentData?.name,
    studentId,
  ]);

  const handleGenerateSponsorLetter = useCallback(async () => {
    if (!studentId) {
      notification.warning({
        message: "Student ID kosong",
        description: "Sponsor letter tidak bisa digenerate tanpa student_id.",
      });
      return;
    }

    if (generateAnswersPayload.length === 0) {
      notification.warning({
        message: "Belum ada data",
        description:
          "Isi jawaban form student terlebih dahulu sebelum generate sponsor letter.",
      });
      return;
    }

    try {
      const result = await onGenerateSponsorLetterAi(
        buildLetterPayload(SPONSOR_LETTER_CHECKLIST_PUBLIC_PATH),
      );
      const response = pickGeneratedResponse(result);
      const fileBase64 = pickGeneratedFileBase64(result);
      const generatedFileName =
        pickGeneratedFileName(result) ??
        `${(studentData?.name ?? "student").replace(/\s+/g, "_")}_Sponsor_Letter.docx`;
      const generatedMimeType =
        pickGeneratedMimeType(result) ?? WORD_DOCUMENT_MIME_TYPE;

      if (!response || !fileBase64) {
        throw new Error(
          "Response generate sponsor letter tidak berisi konten atau file Word.",
        );
      }

      try {
        await persistGeneratedWord({
          fileBase64,
          generatedFileName,
          generatedMimeType,
          folder: GENERATED_SPONSOR_LETTER_FOLDER,
          objectUrlRef: sponsorObjectUrlRef,
          setUrl: setGeneratedSponsorLetterUrl,
          setPath: setGeneratedSponsorLetterPath,
          setFileName: setGeneratedSponsorLetterFileName,
          setMimeType: setGeneratedSponsorLetterMimeType,
          onUpsert: onUpsertGeneratedSponsorLetterAi,
          successMessage: "Generate Sponsor Letter berhasil",
          successDescription: "Sponsor letter berhasil dibuat dan siap ditinjau.",
        });
      } catch (persistError) {
        notification.warning({
          message: "Sponsor letter berhasil dibuat, tetapi belum siap dibuka kembali",
          description:
            extractGenerateErrorMessage(persistError) ||
            "Silakan coba generate kembali dalam beberapa saat.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Generate Sponsor Letter gagal",
        description: extractGenerateErrorMessage(error),
      });
    }
  }, [
    buildLetterPayload,
    generateAnswersPayload.length,
    notification,
    onGenerateSponsorLetterAi,
    onUpsertGeneratedSponsorLetterAi,
    persistGeneratedWord,
    studentData?.name,
    studentId,
  ]);

  const handlePreviewStatementLetter = useCallback(() => {
    if (!previewStatementLetterUrl) {
      notification.info({
        message: "Dokumen belum tersedia",
        description: "Statement letter PDF belum tersedia.",
      });
      return;
    }

    const previewUrl = buildFilePreviewUrl(
      previewStatementLetterUrl,
      previewStatementLetterFileName ?? "statement-letter.pdf",
      previewStatementLetterMimeType ?? "application/pdf",
    );
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }, [
    notification,
    previewStatementLetterFileName,
    previewStatementLetterMimeType,
    previewStatementLetterUrl,
  ]);

  const handlePreviewSponsorLetter = useCallback(() => {
    if (!previewSponsorLetterUrl) {
      notification.info({
        message: "Dokumen belum tersedia",
        description: "Sponsor letter PDF belum tersedia.",
      });
      return;
    }

    const previewUrl = buildFilePreviewUrl(
      previewSponsorLetterUrl,
      previewSponsorLetterFileName ?? "sponsor-letter.pdf",
      previewSponsorLetterMimeType ?? "application/pdf",
    );
    window.open(previewUrl, "_blank", "noopener,noreferrer");
  }, [
    notification,
    previewSponsorLetterFileName,
    previewSponsorLetterMimeType,
    previewSponsorLetterUrl,
  ]);

  const handleReviewStatementLetter = useCallback(
    async (status: "APPROVED" | "REVISION_REQUESTED") => {
      if (!persistedStatementLetterDocument?.id) {
        notification.info({
          message: "Dokumen belum tersedia",
          description: "Statement letter belum bisa direview.",
        });
        return;
      }

      setReviewingLetter(`statement-${status}`);
      try {
        const currentApprovalId =
          persistedStatementLetterDocument.current_approval_id ??
          persistedStatementLetterDocument.current_approval?.id;

        if (currentApprovalId) {
          await onUpdateStatementApproval({
            id: currentApprovalId,
            payload: { status },
          });
        } else {
          await onCreateStatementApproval({
            document_id: persistedStatementLetterDocument.id,
            status,
          });
        }
      } catch (error) {
        notification.error({
          message: "Gagal memperbarui review statement letter",
          description: extractGenerateErrorMessage(error),
        });
      } finally {
        setReviewingLetter(null);
      }
    },
    [
      notification,
      onCreateStatementApproval,
      onUpdateStatementApproval,
      persistedStatementLetterDocument,
    ],
  );

  const handleReviewSponsorLetter = useCallback(
    async (status: "APPROVED" | "REVISION_REQUESTED") => {
      if (!persistedSponsorLetterDocument?.id) {
        notification.info({
          message: "Dokumen belum tersedia",
          description: "Sponsor letter belum bisa direview.",
        });
        return;
      }

      setReviewingLetter(`sponsor-${status}`);
      try {
        const currentApprovalId =
          persistedSponsorLetterDocument.current_approval_id ??
          persistedSponsorLetterDocument.current_approval?.id;

        if (currentApprovalId) {
          await onUpdateSponsorApproval({
            id: currentApprovalId,
            payload: { status },
          });
        } else {
          await onCreateSponsorApproval({
            document_id: persistedSponsorLetterDocument.id,
            status,
          });
        }
      } catch (error) {
        notification.error({
          message: "Gagal memperbarui review sponsor letter",
          description: extractGenerateErrorMessage(error),
        });
      } finally {
        setReviewingLetter(null);
      }
    },
    [
      notification,
      onCreateSponsorApproval,
      onUpdateSponsorApproval,
      persistedSponsorLetterDocument,
    ],
  );

  const isStatementSubmitDisabled =
    !persistedStatementLetterDocument?.id ||
    persistedStatementLetterDocument.status !== "SUBMITTED_TO_DIRECTOR";

  const canCancelStatementSubmit =
    persistedStatementLetterDocument?.status === "SUBMITTED_TO_DIRECTOR";

  const isSponsorSubmitDisabled =
    !persistedSponsorLetterDocument?.id ||
    persistedSponsorLetterDocument.status !== "SUBMITTED_TO_DIRECTOR";

  const canCancelSponsorSubmit =
    persistedSponsorLetterDocument?.status === "SUBMITTED_TO_DIRECTOR";

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <LetterCard
          title="Statement Letter"
          tone="blue"
          status={statementStatusMeta.label}
          statusColor={statementStatusMeta.color}
          showGenerate={false}
          onGenerate={handleGenerateStatementLetter}
          onPreview={handlePreviewStatementLetter}
          onSubmit={() => handleReviewStatementLetter("APPROVED")}
          onCancelSubmit={() => handleReviewStatementLetter("REVISION_REQUESTED")}
          previewDisabled={!previewStatementLetterUrl}
          generateLoading={onGenerateStatementLetterAiLoading}
          submitLabel="Approve Letter"
          submitLoading={reviewingLetter === "statement-APPROVED"}
          submitDisabled={isStatementSubmitDisabled}
          cancelSubmitLabel="Request Revision"
          cancelSubmitLoading={reviewingLetter === "statement-REVISION_REQUESTED"}
          cancelSubmitDisabled={!canCancelStatementSubmit}
          showCancelSubmit={canCancelStatementSubmit}
          activity={[
            {
              title: "Generated from student answers",
              meta: "System",
            },
            {
              title: "Saved as active document",
              meta: "System",
            },
          ]}
        />
      </Col>

      <Col xs={24} xl={12}>
        <LetterCard
          title="Sponsor Letter"
          tone="green"
          status={sponsorStatusMeta.label}
          statusColor={sponsorStatusMeta.color}
          showGenerate={false}
          onGenerate={handleGenerateSponsorLetter}
          onPreview={handlePreviewSponsorLetter}
          onSubmit={() => handleReviewSponsorLetter("APPROVED")}
          onCancelSubmit={() => handleReviewSponsorLetter("REVISION_REQUESTED")}
          previewDisabled={!previewSponsorLetterUrl}
          generateLoading={onGenerateSponsorLetterAiLoading}
          submitLabel="Approve Letter"
          submitLoading={reviewingLetter === "sponsor-APPROVED"}
          submitDisabled={isSponsorSubmitDisabled}
          cancelSubmitLabel="Request Revision"
          cancelSubmitLoading={reviewingLetter === "sponsor-REVISION_REQUESTED"}
          cancelSubmitDisabled={!canCancelSponsorSubmit}
          showCancelSubmit={canCancelSponsorSubmit}
          activity={[
            {
              title: "Generated from student answers",
              meta: "System",
            },
            {
              title: "Saved as active document",
              meta: "System",
            },
          ]}
        />
      </Col>
    </Row>
  );
}
