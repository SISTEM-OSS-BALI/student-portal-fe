"use client";

import { useMemo } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Row,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import { useQuestions } from "@/app/hooks/use-questions";
import type { AnswerApprovalsDataModel } from "@/app/models/answer-approvals";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import { useGeneratedCvAiDocuments } from "@/app/hooks/use-generated-cv-ai-documents";
import { useUser } from "@/app/hooks/use-users";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";

type CVComponentsProps = {
  student_id: string;
};

const GENERATED_CV_FOLDER = "generate-cv-ai";
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

export default function CVComponents({ student_id }: CVComponentsProps) {
  App.useApp();

  const { data: studentData } = useUser({ id: student_id });
  const { data: questionBases } = useQuestionBases({});
  const { data: generatedCvDocuments = [] } = useGeneratedCvAiDocuments({
    studentId: student_id,
    enabled: Boolean(student_id),
  });
  const { data: questions } = useQuestions({});
  const { data: answerQuestions, fetchLoading } = useAnswerQuestions({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
    withNotification: false,
  });
  const { data: answerApprovals } = useAnswerApprovals({
    queryString: student_id ? `student_id=${student_id}` : undefined,
    enabled: Boolean(student_id),
  });

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

  const previewCvUrl = persistedCvDocument?.file_url ?? null;
  const previewCvFileName =
    persistedCvDocument?.file_name ??
    `${(studentData?.name ?? "student").replace(/\s+/g, "_")}_CV.pdf`;
  const hasGeneratedCv = Boolean(previewCvUrl);
  const directorPreviewUrl = useMemo(
    () => buildFilePreviewUrl(previewCvUrl, previewCvFileName, "application/pdf"),
    [previewCvFileName, previewCvUrl],
  );

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

                              <Space align="start" size={8}>
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
                                {currentNote ? (
                                  <Typography.Text type="secondary">
                                    {currentNote}
                                  </Typography.Text>
                                ) : null}
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

            {hasGeneratedCv ? (
              <Space
                direction="vertical"
                size={12}
                style={{ width: "100%", marginTop: 8 }}
              >
                <Typography.Text strong>Generated CV PDF</Typography.Text>
                <div
                  style={{
                    overflow: "hidden",
                    borderRadius: 16,
                    border: "1px solid #d8dee9",
                    background: "#f8fafc",
                  }}
                >
                  <iframe
                    src={directorPreviewUrl}
                    title="Director CV Preview"
                    style={{
                      width: "100%",
                      height: 420,
                      border: "none",
                      display: "block",
                    }}
                  />
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<EyeOutlined />}
                  href={directorPreviewUrl || undefined}
                  target={directorPreviewUrl ? "_blank" : undefined}
                  style={{ borderRadius: 999, height: 44 }}
                >
                  Buka CV PDF
                </Button>
              </Space>
            ) : (
              <div
                style={{
                  marginTop: 8,
                  padding: "18px 16px",
                  borderRadius: 14,
                  border: "1px dashed #cbd5e1",
                  background: "#f8fafc",
                }}
              >
                <Typography.Text type="secondary">
                  CV PDF belum tersedia. File akan tampil di sini setelah proses
                  generate CV selesai.
                </Typography.Text>
              </div>
            )}

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
                Director hanya melihat hasil CV yang sudah digenerate dalam
                bentuk PDF untuk kebutuhan review akhir.
              </Typography.Text>
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}
