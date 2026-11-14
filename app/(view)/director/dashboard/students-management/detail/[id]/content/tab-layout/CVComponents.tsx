"use client";

import { useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Row,
  Segmented,
  Space,
  Tabs,
  Tag,
  Typography,
} from "antd";
import {
  CheckOutlined,
  ClockCircleOutlined,
  CloseOutlined,
  EyeOutlined,
  FileTextOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
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
import styles from "../detail.module.css";

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
  const [mobileCvTab, setMobileCvTab] = useState<"data" | "cv">("data");

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
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width: "100%", maxWidth: "100%", minWidth: 0 }}>
      {/* Standardized Section Header Card */}
      <Card
        className={styles.sectionHeaderCard}
        styles={{ body: { padding: 0 } }}
      >
        <Flex align="center" gap={12} style={{ minWidth: 0, width: "100%" }}>
          <div className={styles.sectionHeaderIcon}>
            <SolutionOutlined />
          </div>
          <div style={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
            <div className={styles.sectionHeaderTitle}>
              Data Diri & CV Mahasiswa
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
                icon: <FileTextOutlined />,
              },
              {
                label: "Status CV",
                value: "cv",
                icon: <SolutionOutlined />,
              },
            ]}
          />
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col
          xs={24}
          xl={16}
          className={
            mobileCvTab === "cv"
              ? styles.cvDataColHiddenMobile
              : styles.cvDataCol
          }
        >
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
                  {/* Section Toolbar */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      padding: "10px 16px",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <Space size={10} align="center">
                      <Typography.Text
                        strong
                        style={{ fontSize: 14, color: "#1e293b" }}
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
                    </Space>
                  </div>

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
                        const isApproved = status === "approved";
                        const isRejected = status === "rejected";
                        const currentNote =
                          approvalMap.get(item.id)?.note ?? "";

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
                                  fontSize: 14,
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

                              {/* Note / Revision Display */}
                              {currentNote && (
                                <div
                                  style={{
                                    marginTop: 10,
                                    padding: "6px 10px",
                                    borderRadius: 6,
                                    background: isRejected
                                      ? "#fef2f2"
                                      : "#f8fafc",
                                    border: `1px solid ${
                                      isRejected ? "#fecaca" : "#e2e8f0"
                                    }`,
                                    fontSize: 12,
                                    color: isRejected
                                      ? "#991b1b"
                                      : "#475569",
                                  }}
                                >
                                  <span style={{ fontWeight: 600 }}>
                                    Catatan:
                                  </span>{" "}
                                  {currentNote}
                                </div>
                              )}
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
      </Col>

      <Col
        xs={24}
        xl={8}
        className={
          mobileCvTab === "data"
            ? styles.cvPreviewColHiddenMobile
            : styles.cvPreviewCol
        }
      >
        <Card
          style={{ borderRadius: 18, borderColor: "#d8dee9" }}
          bodyStyle={{ padding: 20 }}
        >
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            <Space direction="vertical" size={2}>
              <Typography.Text strong style={{ fontSize: 14, color: "#0f172a", display: "block" }}>
                CV Status & Preview
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 11.5, color: "#64748b" }}>
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
                fontSize: 11.5,
              }}
            >
              {cvStatus.label}
            </Tag>

            {!isReadyToGenerateCv && approvalProgress.total > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
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
                  Lihat CV PDF
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
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  CV PDF belum tersedia. File akan tampil di sini setelah proses
                  generate CV selesai.
                </Typography.Text>
              </div>
            )}

            <div
              style={{
                marginTop: 4,
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid #bfdbfe",
                background: "#eff6ff",
              }}
            >
              <Typography.Text style={{ color: "#1d4ed8", fontSize: 12, lineHeight: 1.5 }}>
                Hasil CV yang sudah digenerate dalam bentuk PDF untuk kebutuhan peninjauan berkas.
              </Typography.Text>
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
    </div>
  );
}
