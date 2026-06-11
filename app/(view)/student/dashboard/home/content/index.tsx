"use client";

import {
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Steps,
  Tag,
  Typography,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { useUser } from "@/app/hooks/use-users";
import { useAuth } from "@/app/utils/use-auth";
import { useMemo } from "react";
import { useAnswerDocumentApprovals } from "@/app/hooks/use-answer-document-approvals";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useVisaTypes } from "@/app/hooks/use-visa-type-management";

const { Title, Text, Paragraph } = Typography;

type StudentStepChild = {
  id: string;
  label: string;
};

type StudentStep = {
  id: string;
  label: string;
  child_ids?: string[];
  children?: StudentStepChild[];
  created_at?: string;
  updated_at?: string;
};

type StudentCountry = {
  id: string;
  name: string;
  steps?: StudentStep[];
};

type StudentDocument = {
  id: string;
  label: string;
  internal_code?: string;
  file_type?: string;
  category?: string;
  translation_needed?: string;
  required?: boolean;
  auto_rename_pattern?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

type StudentStage = {
  id: string;
  country_id?: string;
  document_id?: string;
  country?: StudentCountry;
  document?: StudentDocument;
  created_at?: string;
  updated_at?: string;
};

type StudentUser = {
  id: string;
  name: string;
  email?: string;
  role?: string;
  no_phone?: string;
  stage_id?: string;
  current_step_id?: string;
  visa_status?: string;
  visa_granted_at?: string;
  visa_grant_duration_days?: number;
  visa_grant_duration_label?: string;
  student_status?: string;
  student_status_updated_by_id?: string;
  student_status_updated_by_name?: string;
  student_status_updated_at?: string;
  student_status_updated_at_label?: string;
  stage?: StudentStage;
  name_campus?: string;
  visa_type?: string;
  visa_type_name?: string;
  degree?: string;
  translation_quota?: number;
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
};

type RejectedFeedbackItem = {
  id: string;
  type: "document" | "form";
  title: string;
  note: string;
  reviewed_at?: string | null;
};

type StudentTaskPriority =
  | "Current Step"
  | "Upcoming Step"
  | "Required Document"
  | "Revision Required";

type StudentTaskItem = {
  id: string;
  title: string;
  priority: StudentTaskPriority;
};

function extractStepNumber(label: string): number {
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function formatDegree(value?: string): string {
  if (!value) return "-";
  return value
    .split("_")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1).toLowerCase())
    .join(" ");
}

function formatVisaType(value?: string): string {
  if (!value) return "-";
  return value
    .split("_")
    .join(" ")
    .split(" ")
    .filter(Boolean)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function resolveVisaTypeLabel(
  student: StudentUser | undefined,
  visaTypeNameById: Map<string, string>,
): string {
  const visaTypeName = String(student?.visa_type_name ?? "").trim();
  if (visaTypeName) {
    return visaTypeName;
  }

  const visaTypeValue = String(student?.visa_type ?? "").trim();
  if (!visaTypeValue) {
    return "-";
  }

  const mappedName = visaTypeNameById.get(visaTypeValue);
  if (mappedName) {
    return mappedName;
  }

  return formatVisaType(visaTypeValue);
}

function getStepsData(user?: StudentUser) {
  const rawSteps = user?.stage?.country?.steps ?? [];
  const sortedSteps = [...rawSteps].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return extractStepNumber(a.label) - extractStepNumber(b.label);
  });

  const stepItems = sortedSteps.map((step) => ({
    title: step.label,
  }));

  const currentStepId = String(user?.current_step_id ?? "");
  const currentIndex = sortedSteps.findIndex((step) => {
    if (step.id === currentStepId) return true;
    return (step.children ?? []).some((child) => child.id === currentStepId);
  });

  const visaGranted = (user?.visa_status ?? "").toLowerCase() === "grant";

  const currentStep =
    visaGranted && sortedSteps.length > 0
      ? sortedSteps.length - 1
      : currentIndex >= 0
        ? currentIndex
        : 0;

  const pendingTasks: Array<{
    id: string;
    title: string;
    priority: "Current Step" | "Upcoming Step";
  }> = sortedSteps
    .filter((step) => {
      const index = sortedSteps.findIndex((item) => item.id === step.id);
      return visaGranted ? false : index >= currentStep;
    })
    .flatMap((step) => {
      const sortedChildren = [...(step.children ?? [])].sort(
        (a, b) => extractStepNumber(a.label) - extractStepNumber(b.label),
      );

      if (sortedChildren.length === 0) {
        return [
          {
            id: step.id,
            title: step.label,
            priority:
              step.id === currentStepId ||
              sortedChildren.some((child) => child.id === currentStepId)
                ? ("Current Step" as const)
                : ("Upcoming Step" as const),
          },
        ];
      }

      return sortedChildren.map((child) => ({
        id: child.id,
        title: child.label,
        priority:
          step.id === currentStepId ||
          sortedChildren.some((child) => child.id === currentStepId)
            ? ("Current Step" as const)
            : ("Upcoming Step" as const),
      }));
    });

  return {
    stepItems,
    currentStep,
    pendingTasks,
  };
}

function buildTerms(user?: StudentUser): string[] {
  const items: string[] = [];

  if (user?.stage?.document?.required) {
    items.push(`Dokumen ${user.stage.document.label} wajib diunggah.`);
  }

  if (user?.stage?.document?.file_type) {
    items.push(
      `Format file yang diterima: ${user.stage.document.file_type.toUpperCase()}.`,
    );
  }

  if (user?.stage?.document?.translation_needed === "YES") {
    items.push("Dokumen ini memerlukan proses terjemahan.");
  }

  if (user?.translation_quota !== undefined) {
    items.push(`Kuota terjemahan tersedia: ${user.translation_quota}.`);
  }

  if (user?.stage?.document?.auto_rename_pattern) {
    items.push(`Pola nama file: ${user.stage.document.auto_rename_pattern}.`);
  }

  if (user?.stage?.document?.notes) {
    items.push(user.stage.document.notes);
  }

  return items;
}

export default function DashboardContent() {
  const { user_id } = useAuth();
  const { data: user, fetchLoading } = useUser({
    id: user_id,
  });
  const { data: stages } = useStagesManagement({});
  const { data: answerDocuments = [] } = useAnswerDocuments({
    queryString: user_id ? `student_id=${user_id}` : undefined,
    enabled: Boolean(user_id),
  });
  const { data: answerQuestions = [] } = useAnswerQuestions({
    queryString: user_id ? `student_id=${user_id}` : undefined,
    enabled: Boolean(user_id),
    withNotification: false,
  });
  const { data: answerDocumentApprovals = [] } = useAnswerDocumentApprovals({
    queryString: user_id ? `student_id=${user_id}` : undefined,
    enabled: Boolean(user_id),
  });
  const { data: answerApprovals = [] } = useAnswerApprovals({
    queryString: user_id ? `student_id=${user_id}` : undefined,
    enabled: Boolean(user_id),
  });
  const { data: visaTypes = [] } = useVisaTypes();

  const student = user as StudentUser | undefined;
  const visaTypeNameById = useMemo(() => {
    return new Map(
      visaTypes.map((item) => [String(item.id), String(item.name ?? "").trim()]),
    );
  }, [visaTypes]);

  const { stepItems, currentStep, pendingTasks } = useMemo(
    () => getStepsData(student),
    [student],
  );

  const rejectedFeedbacks = useMemo<RejectedFeedbackItem[]>(() => {
    const documentNameById = new Map<string, string>();
    (stages ?? []).forEach((stage) => {
      if (!stage?.document?.id) return;
      documentNameById.set(
        String(stage.document.id),
        String(stage.document.label ?? stage.document.internal_code ?? "Document"),
      );
    });

    const answerDocumentById = new Map<string, (typeof answerDocuments)[number]>();
    answerDocuments.forEach((item) => {
      answerDocumentById.set(String(item.id), item);
    });

    const answerQuestionById = new Map<string, (typeof answerQuestions)[number]>();
    answerQuestions.forEach((item) => {
      answerQuestionById.set(String(item.id), item);
    });

    const documentRejects = answerDocumentApprovals
      .filter(
        (item) =>
          String(item.status ?? "").toLowerCase() === "rejected" &&
          String(item.note ?? "").trim(),
      )
      .map((item) => {
        const answerDoc = answerDocumentById.get(String(item.answer_document_id ?? ""));
        const docId = String(answerDoc?.document_id ?? "");
        const docName =
          documentNameById.get(docId) ||
          String(answerDoc?.file_name ?? "").trim() ||
          "Document";
        return {
          id: `doc-${item.id}`,
          type: "document" as const,
          title: `Document: ${docName}`,
          note: String(item.note ?? "").trim(),
          reviewed_at: item.reviewed_at ?? item.updated_at,
        };
      });

    const formRejects = answerApprovals
      .filter(
        (item) =>
          String(item.status ?? "").toLowerCase() === "rejected" &&
          String(item.note ?? "").trim(),
      )
      .map((item) => {
        const answer = answerQuestionById.get(String(item.answer_id ?? ""));
        const answerPreview = String(answer?.answer_text ?? "").trim();
        return {
          id: `form-${item.id}`,
          type: "form" as const,
          title: answerPreview
            ? `Form: ${answerPreview.slice(0, 60)}${answerPreview.length > 60 ? "..." : ""}`
            : "Form submission",
          note: String(item.note ?? "").trim(),
          reviewed_at: item.reviewed_at ?? item.updated_at,
        };
      });

    return [...documentRejects, ...formRejects].sort((a, b) => {
      const aTime = Date.parse(String(a.reviewed_at ?? ""));
      const bTime = Date.parse(String(b.reviewed_at ?? ""));
      if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
      if (Number.isNaN(aTime)) return 1;
      if (Number.isNaN(bTime)) return -1;
      return bTime - aTime;
    });
  }, [answerApprovals, answerDocumentApprovals, answerDocuments, answerQuestions, stages]);

  const terms = useMemo(() => buildTerms(student), [student]);

  const tasksToDo = useMemo<StudentTaskItem[]>(() => {
    const tasks: StudentTaskItem[] = [];
    const countryId = String(student?.stage?.country_id ?? "").trim();

    const docsForCountry =
      (stages ?? [])
        .filter((stage) => String(stage.country_id ?? "") === countryId)
        .map((stage) => stage.document)
        .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc)) ?? [];

    const latestAnswerByDocumentId = new Map<string, (typeof answerDocuments)[number]>();
    answerDocuments.forEach((item) => {
      const key = String(item.document_id ?? "");
      const existing = latestAnswerByDocumentId.get(key);
      if (!existing) {
        latestAnswerByDocumentId.set(key, item);
        return;
      }
      const existingTime = Date.parse(
        String(existing.updated_at ?? existing.created_at ?? ""),
      );
      const nextTime = Date.parse(String(item.updated_at ?? item.created_at ?? ""));
      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        latestAnswerByDocumentId.set(key, item);
      }
    });

    docsForCountry.forEach((doc) => {
      if (!doc.required) return;
      const submitted = latestAnswerByDocumentId.get(String(doc.id));
      if (!submitted?.file_url) {
        tasks.push({
          id: `required-doc-${doc.id}`,
          title: `Upload dokumen wajib: ${doc.label}`,
          priority: "Required Document",
        });
      }
    });

    rejectedFeedbacks.forEach((item) => {
      tasks.push({
        id: `revision-${item.id}`,
        title: `Revisi ${item.title}: ${item.note}`,
        priority: "Revision Required",
      });
    });

    pendingTasks.forEach((task) => {
      tasks.push({
        id: `step-${task.id}`,
        title: task.title,
        priority: task.priority,
      });
    });

    const unique = new Map<string, StudentTaskItem>();
    tasks.forEach((task) => {
      if (!unique.has(task.title)) {
        unique.set(task.title, task);
      }
    });

    return Array.from(unique.values());
  }, [answerDocuments, pendingTasks, rejectedFeedbacks, stages, student?.stage?.country_id]);

  if (fetchLoading) {
    return (
      <Space direction="vertical" size={20} style={{ width: "100%" }}>
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
        <Card
          bordered={false}
          style={{
            borderRadius: 20,
            boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
          }}
        >
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
      </Space>
    );
  }

  return (
    <Space direction="vertical" size={20} style={{ width: "100%" }}>
      <div>
        <Title
          level={3}
          style={{ margin: 0, fontWeight: 700, color: "#111827" }}
        >
          Hi, {student?.name || "-"},
        </Title>
        <Text style={{ color: "#4b5563", fontSize: 14 }}>
          Track your application progress and manage your documents
        </Text>
      </div>

      <Card
        id="student-tour-progress"
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          <Text strong style={{ fontSize: 14 }}>
            Application Progress
          </Text>
          <Steps current={currentStep} responsive items={stepItems} />
        </Space>
      </Card>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Card
            id="student-tour-overview"
            title="Overview"
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
              height: "100%",
            }}
          >
            <Row gutter={[20, 20]}>
              <Col xs={12} md={6}>
                <Space align="start">
                  <EnvironmentOutlined
                    style={{ color: "#9ca3af", marginTop: 4 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Country
                    </Text>
                    <div>
                      <Text strong>{student?.stage?.country?.name || "-"}</Text>
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space align="start">
                  <CalendarOutlined
                    style={{ color: "#9ca3af", marginTop: 4 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Campus
                    </Text>
                    <div>
                      <Text strong>{student?.name_campus?.trim() || "-"}</Text>
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space align="start">
                  <FileTextOutlined
                    style={{ color: "#9ca3af", marginTop: 4 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Document
                    </Text>
                    <div>
                      <Text strong>
                        {student?.stage?.document?.label || "-"}
                      </Text>
                    </div>
                  </div>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space align="start">
                  <SafetyCertificateOutlined
                    style={{ color: "#9ca3af", marginTop: 4 }}
                  />
                  <div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Degree
                    </Text>
                    <div>
                      <Text strong>{formatDegree(student?.degree)}</Text>
                    </div>
                  </div>
                </Space>
              </Col>
            </Row>

            <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Visa Type
                  </Text>
                  <Text strong>{resolveVisaTypeLabel(student, visaTypeNameById)}</Text>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Visa Status
                  </Text>
                  <Tag
                    color={
                      (student?.visa_status ?? "").toLowerCase() === "grant"
                        ? "success"
                        : "processing"
                    }
                  >
                    {student?.visa_status || "-"}
                  </Tag>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Student Status
                  </Text>
                  <Text strong>{student?.student_status || "-"}</Text>
                </Space>
              </Col>

              <Col xs={12} md={6}>
                <Space direction="vertical" size={2}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Visa Duration
                  </Text>
                  <Text strong>
                    {student?.visa_grant_duration_label || "-"}
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            id="student-tour-notes"
            title="Notes from admission"
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
              height: "100%",
            }}
          >
            {rejectedFeedbacks.length > 0 ? (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {rejectedFeedbacks.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      borderLeft: "3px solid #dc2626",
                      paddingLeft: 12,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        display: "block",
                        fontSize: 12,
                        color: "#991b1b",
                        marginBottom: 2,
                      }}
                    >
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: "#374151" }}>
                      {item.note}
                    </Text>
                  </div>
                ))}
              </Space>
            ) : (
              <Empty
                description="Belum ada catatan dari admission"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        id="student-tour-tasks"
        title="Tasks to Do"
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        {tasksToDo.length > 0 ? (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {tasksToDo.map((task) => (
              <div
                key={task.id}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 14,
                  padding: "14px 16px",
                  background: "#ffffff",
                }}
              >
                <Space direction="vertical" size={6}>
                  <Text strong style={{ fontSize: 13 }}>
                    {task.title}
                  </Text>
                  <Tag
                    color={
                      task.priority === "Revision Required"
                        ? "error"
                        : task.priority === "Required Document"
                          ? "gold"
                          : task.priority === "Current Step"
                            ? "error"
                            : "processing"
                    }
                    style={{
                      width: "fit-content",
                      borderRadius: 999,
                      paddingInline: 10,
                      fontSize: 11,
                    }}
                  >
                    {task.priority}
                  </Tag>
                </Space>
              </div>
            ))}
          </Space>
        ) : (
          <Empty
            description="Tidak ada task aktif"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      <Card
        title="Term and Condition"
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        {terms.length > 0 ? (
          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            {terms.map((term, index) => (
              <Paragraph
                key={`${term}-${index}`}
                style={{ margin: 0, color: "#6b7280", lineHeight: 1.8 }}
              >
                {index + 1}. {term}
              </Paragraph>
            ))}
          </Space>
        ) : (
          <Paragraph style={{ margin: 0, color: "#6b7280", lineHeight: 1.8 }}>
            Belum ada term and condition tambahan.
          </Paragraph>
        )}
      </Card>
    </Space>
  );
}
