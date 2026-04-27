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

const { Title, Text, Paragraph } = Typography;

type StudentNote = {
  id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

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
  degree?: string;
  translation_quota?: number;
  notes?: StudentNote[];
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
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

function getStepsData(user?: StudentUser) {
  const rawSteps = user?.stage?.country?.steps ?? [];
  const sortedSteps = [...rawSteps].sort(
    (a, b) => extractStepNumber(a.label) - extractStepNumber(b.label),
  );

  const stepItems = sortedSteps.map((step) => ({
    title: step.children?.map((child) => child.label).join(", ") || step.label,
  }));

  const currentIndex = sortedSteps.findIndex(
    (step) => step.id === user?.current_step_id,
  );

  const visaGranted = (user?.visa_status ?? "").toLowerCase() === "grant";

  const currentStep =
    visaGranted && sortedSteps.length > 0
      ? sortedSteps.length - 1
      : currentIndex >= 0
        ? currentIndex
        : 0;

  const pendingTasks = sortedSteps
    .filter((step) => {
      const index = sortedSteps.findIndex((item) => item.id === step.id);
      return visaGranted ? false : index >= currentStep;
    })
    .flatMap((step) =>
      (step.children ?? []).map((child) => ({
        id: child.id,
        title: child.label,
        priority:
          step.id === user?.current_step_id ? "Current Step" : "Upcoming Step",
      })),
    );

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

  const student = user as StudentUser | undefined;

  const { stepItems, currentStep, pendingTasks } = useMemo(
    () => getStepsData(student),
    [student],
  );

  const admissionNotes = useMemo(
    () => student?.notes?.map((note) => note.content).filter(Boolean) ?? [],
    [student],
  );

  const terms = useMemo(() => buildTerms(student), [student]);

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
                  <Text strong>{formatVisaType(student?.visa_type)}</Text>
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
            title="Notes from admission"
            bordered={false}
            style={{
              borderRadius: 20,
              boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
              height: "100%",
            }}
          >
            {admissionNotes.length > 0 ? (
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                {admissionNotes.map((note, index) => (
                  <div
                    key={`${note}-${index}`}
                    style={{
                      borderLeft: "3px solid #2563eb",
                      paddingLeft: 12,
                    }}
                  >
                    <Text style={{ fontSize: 13, color: "#374151" }}>
                      {note}
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
        title="Tasks to Do"
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
        }}
      >
        {pendingTasks.length > 0 ? (
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {pendingTasks.map((task) => (
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
                      task.priority === "Current Step" ? "error" : "processing"
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
