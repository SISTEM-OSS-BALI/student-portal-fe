"use client";

import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useGenerateStatementLetterAi } from "@/app/hooks/use-generate-statement-letter-ai";
import { useGeneratedStatementLetterAiDocuments } from "@/app/hooks/use-generated-statement-letter-ai-documents";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import { useQuestions } from "@/app/hooks/use-questions";
import { useUser } from "@/app/hooks/use-users";
import type { AnswerQuestionDataModel, QuestionDataModel } from "@/app/models/question";
import {
  CheckOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  RobotOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import { App, Button, Card, Col, Divider, Progress, Row, Space, Tag, Typography } from "antd";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const { Paragraph, Text, Title } = Typography;
const STATEMENT_LETTER_CHECKLIST_PUBLIC_PATH =
  "/assets/file/Kerangka GS 2026.pdf";
const GENERATED_STATEMENT_LETTER_FOLDER = "generate-statement-letter-ai";
const DEFAULT_STATEMENT_PREVIEW_LINES = [
  "Statement letter akan digenerate berdasarkan jawaban form student.",
  "Setelah berhasil, file Word akan diupload ke Supabase.",
  "Preview full letter akan terbuka di OnlyOffice.",
];
const WORD_DOCUMENT_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type LetterCardProps = {
  title: string;
  tone: "blue" | "green";
  status: string;
  statusColor: string;
  previewLabel: string;
  previewContent: string[];
  footerLabel?: string;
  footerValue?: string;
  progress?: number;
  activity: Array<{
    title: string;
    meta: string;
  }>;
  onGenerate?: () => void | Promise<void>;
  onPreview?: () => void;
  generateLoading?: boolean;
  previewDisabled?: boolean;
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

function LetterCard({
  title,
  tone,
  status,
  statusColor,
  previewLabel,
  previewContent,
  footerLabel,
  footerValue,
  progress,
  activity,
  onGenerate,
  onPreview,
  generateLoading,
  previewDisabled,
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
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {previewLabel}
            </Text>
            <div
              style={{
                minHeight: 82,
                borderRadius: 14,
                border: "1px solid #dde5ef",
                background: "#f8fafc",
                padding: 14,
              }}
            >
              {previewContent.map((line) => (
                <Text
                  key={line}
                  style={{
                    display: "block",
                    color: "#334155",
                    lineHeight: 1.55,
                    fontSize: 12.5,
                  }}
                >
                  {line}
                </Text>
              ))}
            </div>
          </Space>

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
          ) : (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {footerLabel}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {footerValue}
                </Text>
              </div>
              <div
                style={{
                  height: 40,
                  borderRadius: 14,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  marginTop: 8,
                }}
              />
            </div>
          )}

          <Space direction="vertical" size={10} style={{ width: "100%" }}>
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
            <Button
              block
              type="primary"
              icon={<CheckOutlined />}
              style={{
                borderRadius: 999,
                height: 42,
                background: "#16a34a",
                borderColor: "#16a34a",
              }}
            >
              Submit To Director
            </Button>
          </Space>

          <div>
            <Divider style={{ margin: "4px 0 12px" }} />
            <Title level={5} style={{ margin: 0, fontSize: 14 }}>
              Activity Log
            </Title>
            <Space direction="vertical" size={10} style={{ width: "100%", marginTop: 12 }}>
              {activity.map((item) => (
                <Space key={item.title} align="start" size={10}>
                  <SolutionOutlined style={{ color: "#94a3b8", marginTop: 3 }} />
                  <div>
                    <Paragraph style={{ margin: 0, color: "#334155", fontSize: 12.5 }}>
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
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data: studentData } = useUser({ id: studentId as string });
  const { data: questionBases } = useQuestionBases({});
  const { data: questions } = useQuestions({});
  const { data: answerQuestions = [] } = useAnswerQuestions({
    queryString: studentId ? `student_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
    withNotification: false,
  });
  const {
    onGenerateStatementLetterAi,
    onGenerateStatementLetterAiLoading,
  } = useGenerateStatementLetterAi();
  const { uploadDocument } = useDocumentUpload();
  const {
    data: generatedStatementLetterDocuments = [],
    onUpsert: onUpsertGeneratedStatementLetterAi,
  } = useGeneratedStatementLetterAiDocuments({
    studentId: studentId as string,
    enabled: Boolean(studentId),
  });

  const [statementPreviewLines, setStatementPreviewLines] = useState(
    DEFAULT_STATEMENT_PREVIEW_LINES,
  );
  const [statementWordCount, setStatementWordCount] = useState("0 / generated");
  const [generatedLetterUrl, setGeneratedLetterUrl] = useState<string | null>(null);
  const [generatedLetterPath, setGeneratedLetterPath] = useState<string | null>(null);
  const [generatedLetterFileName, setGeneratedLetterFileName] = useState<string | null>(null);
  const [generatedLetterMimeType, setGeneratedLetterMimeType] = useState<string | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current?.startsWith("blob:")) {
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

  const persistedStatementLetterDocument =
    generatedStatementLetterDocuments[0] ?? null;
  const previewLetterUrl =
    generatedLetterUrl ?? persistedStatementLetterDocument?.file_url ?? null;
  const previewLetterPath =
    generatedLetterPath ?? persistedStatementLetterDocument?.file_path ?? null;
  const previewLetterFileName =
    generatedLetterFileName ??
    persistedStatementLetterDocument?.file_name ??
    null;
  const previewLetterMimeType =
    generatedLetterMimeType ??
    persistedStatementLetterDocument?.file_type ??
    null;

  const handleGenerateLetter = useCallback(async () => {
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
      const checklistPath = STATEMENT_LETTER_CHECKLIST_PUBLIC_PATH;
      const checklistUrl =
        typeof window !== "undefined"
          ? new URL(checklistPath, window.location.origin).toString()
          : checklistPath;

      const result = await onGenerateStatementLetterAi({
        student_id: String(studentId),
        student_name: studentData?.name ?? undefined,
        student_country: studentData?.stage?.country?.name ?? undefined,
        campus_name: studentData?.name_campus ?? undefined,
        degree:
          studentData?.name_degree ??
          studentData?.degree ??
          undefined,
        checklist_path: checklistPath,
        checklist_url: checklistUrl,
        answers: generateAnswersPayload,
        sections: sectionsPayload,
        meta: {
          letter_status: "Draft",
        },
      });

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

      const previewLines = response
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 3);
      const wordCount = response.split(/\s+/).filter(Boolean).length;
      setStatementPreviewLines(
        previewLines.length > 0
          ? previewLines
          : DEFAULT_STATEMENT_PREVIEW_LINES,
      );
      setStatementWordCount(`${wordCount} / generated`);

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
      setGeneratedLetterUrl(localPreviewUrl);
      setGeneratedLetterPath(null);
      setGeneratedLetterFileName(generatedFileName);
      setGeneratedLetterMimeType(generatedMimeType);
      const generatedAt = Date.now();

      try {
        const uploadPath = `${GENERATED_STATEMENT_LETTER_FOLDER}/${studentId}/${generatedAt}-${generatedFileName}`;
        const uploaded = await uploadDocument({
          file: wordFile,
          path: uploadPath,
          content_type: generatedMimeType,
        });

        await onUpsertGeneratedStatementLetterAi({
          student_id: String(studentId),
          file_url: uploaded.url,
          file_path: uploaded.path,
          file_name: generatedFileName,
          file_type: generatedMimeType,
          status: "generated",
        });

        setGeneratedLetterUrl(uploaded.url);
        setGeneratedLetterPath(uploaded.path);

        notification.success({
          message: "Generate Statement Letter AI berhasil",
          description:
            "Word statement letter berhasil dibuat, diupload ke Supabase, dan tersimpan.",
        });
      } catch (persistError) {
        notification.warning({
          message:
            "Generate Statement Letter AI berhasil, tetapi file belum tersimpan",
          description:
            extractGenerateErrorMessage(persistError) ||
            "Preview lokal tersedia, tetapi upload atau penyimpanan metadata gagal.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Generate Statement Letter AI gagal",
        description: extractGenerateErrorMessage(error),
      });
    }
  }, [
    generateAnswersPayload,
    notification,
    onGenerateStatementLetterAi,
    onUpsertGeneratedStatementLetterAi,
    sectionsPayload,
    studentData?.name,
    studentId,
    uploadDocument,
  ]);

  const handlePreviewLetter = useCallback(() => {
    if (!previewLetterUrl) {
      notification.info({
        message: "Belum ada statement letter",
        description: "Silakan generate statement letter terlebih dahulu.",
      });
      return;
    }

    if (!previewLetterPath && previewLetterUrl.startsWith("blob:")) {
      window.open(previewLetterUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (
      !previewLetterPath ||
      !isWordDocument(previewLetterUrl, previewLetterFileName, previewLetterMimeType)
    ) {
      notification.warning({
        message: "Dokumen belum siap diedit",
        description:
          "File Word atau path penyimpanan belum lengkap untuk dibuka di editor browser.",
      });
      return;
    }

    router.push(
      `/admission/dashboard/students-management/detail/${studentId}/statement-letter/editor`,
    );
  }, [
    notification,
    previewLetterFileName,
    previewLetterMimeType,
    previewLetterPath,
    previewLetterUrl,
    router,
    studentId,
  ]);

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}>
        <LetterCard
          title="Statement Letter"
          tone="blue"
          status="Draft"
          statusColor="gold"
          previewLabel="Letter Preview"
          previewContent={statementPreviewLines}
          footerLabel="Word Count"
          footerValue={statementWordCount}
          onGenerate={handleGenerateLetter}
          onPreview={handlePreviewLetter}
          previewDisabled={!previewLetterUrl}
          generateLoading={onGenerateStatementLetterAiLoading}
          activity={[
            {
              title: "Generated from student answers",
              meta: "System",
            },
            {
              title: "Stored to Supabase after successful upload",
              meta: "System",
            },
          ]}
        />
      </Col>

      <Col xs={24} xl={12}>
        <LetterCard
          title="Sponsor Letter"
          tone="green"
          status="Draft"
          statusColor="default"
          previewLabel=""
          previewContent={[
            "Sponsor Name",
            "Ketut Made Nyoman",
            "Relationship",
            "Father",
            "Occupation",
            "Business Owner",
          ]}
          progress={82}
          activity={[
            {
              title: "Initial data entered",
              meta: "3 days ago • You",
            },
            {
              title: "Generated with AI assistance",
              meta: "3 days ago • System",
            },
          ]}
          previewDisabled
        />
      </Col>

      <Col span={24}>
        <Card
          style={{ borderRadius: 18, borderColor: "#d8dee9" }}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            {previewLetterUrl ? (
              <Typography.Text type="secondary" style={{ wordBreak: "break-all" }}>
                Generated Word: {previewLetterUrl}
              </Typography.Text>
            ) : null}
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
