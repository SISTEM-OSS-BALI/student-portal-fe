"use client";

import {
  ArrowUpOutlined,
  FileTextOutlined,
  MailOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useDocumentTranslations } from "@/app/hooks/use-document-translations";
import { useGeneratedCvAiDocuments } from "@/app/hooks/use-generated-cv-ai-documents";
import { useGeneratedSponsorLetterAiDocuments } from "@/app/hooks/use-generated-sponsor-letter-ai-documents";
import { useGeneratedStatementLetterAiDocuments } from "@/app/hooks/use-generated-statement-letter-ai-documents";
import { useStudentNotes } from "@/app/hooks/use-student-notes";
import { useUser } from "@/app/hooks/use-users";
import { Card, Space, Tag, Typography } from "antd";
import { useParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";

const { Text, Title } = Typography;

type ActivityItem = {
  id: string;
  section: string;
  badge: string;
  title: string;
  by: string;
  byColor?: string;
  timeAgo: string;
  icon: ReactNode;
  iconBg: string;
  sortTime: number;
};

export default function ActivityLogComponent() {
  const params = useParams();
  const studentId = useMemo(() => {
    const raw = (params as { id?: string | string[] } | null)?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const { data: detailStudentData } = useUser({ id: studentId });

  const { data: translationItems = [] } = useDocumentTranslations({
    queryString: studentId ? `student_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
  });
  const { data: answerApprovalItems = [] } = useAnswerApprovals({
    queryString: studentId ? `student_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
  });
  const { data: cvDocuments = [] } = useGeneratedCvAiDocuments({
    studentId,
    enabled: Boolean(studentId),
  });
  const { data: statementDocuments = [] } =
    useGeneratedStatementLetterAiDocuments({
      studentId,
      enabled: Boolean(studentId),
    });
  const { data: sponsorDocuments = [] } = useGeneratedSponsorLetterAiDocuments({
    studentId,
    enabled: Boolean(studentId),
  });
  const { data: studentNotes = [] } = useStudentNotes({
    queryString: studentId ? `user_id=${studentId}` : undefined,
    enabled: Boolean(studentId),
  });

  const formatRelativeTime = useCallback((value?: string | null) => {
    if (!value) return "Updated recently";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Updated recently";

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }, []);

  const stepsSource = useMemo(() => {
    const raw = detailStudentData?.stage?.country?.steps ?? [];
    return [...raw].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });
  }, [detailStudentData?.stage?.country?.steps]);

  const currentStepLabel = useMemo(() => {
    if (!detailStudentData?.current_step_id) return "Step";
    return (
      stepsSource.find((step) => step.id === detailStudentData.current_step_id)
        ?.label ?? "Step"
    );
  }, [detailStudentData, stepsSource]);

  const activityItems = useMemo(() => {
    const items: ActivityItem[] = [];

    translationItems.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      items.push({
        id: `translation-${item.id}`,
        section: `${currentStepLabel} · Translation`,
        badge: "Admission upload",
        title: item.file_name
          ? `Admission uploaded translated ${item.file_name}`
          : "Admission uploaded translated document",
        by: "Admission",
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: <FileTextOutlined />,
        iconBg: "#eef6ff",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    answerApprovalItems.forEach((item) => {
      const rawTime = item.reviewed_at ?? item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();

      items.push({
        id: `approval-${item.id}`,
        section: `${currentStepLabel} · Approval`,
        badge: status === "approved" ? "Approved" : "Pending review",
        title:
          status === "approved"
            ? "Document approved by Director"
            : "Document waiting director review",
        by: "Director",
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: <MailOutlined />,
        iconBg: "#e9fbf0",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    cvDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();

      items.push({
        id: `cv-${item.id}`,
        section: `${currentStepLabel} · Data & CV`,
        badge: status === "submitted_to_director" ? "Sent to Director" : "CV",
        title:
          status === "submitted_to_director"
            ? "CV sent to Director for approval"
            : "CV updated",
        by: "Admission",
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: status === "submitted_to_director" ? <MailOutlined /> : <FileTextOutlined />,
        iconBg: "#e9fbf0",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    statementDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();

      items.push({
        id: `statement-${item.id}`,
        section: `${currentStepLabel} · Letter`,
        badge: status === "submitted_to_director" ? "Sent to Director" : "Letter",
        title:
          status === "submitted_to_director"
            ? "Statement letter sent to Director for approval"
            : "Statement letter updated",
        by: "Admission",
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: status === "submitted_to_director" ? <MailOutlined /> : <FileTextOutlined />,
        iconBg: "#eef6ff",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    sponsorDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();

      items.push({
        id: `sponsor-${item.id}`,
        section: `${currentStepLabel} · Letter`,
        badge: status === "submitted_to_director" ? "Sent to Director" : "Letter",
        title:
          status === "submitted_to_director"
            ? "Sponsor letter sent to Director for approval"
            : "Sponsor letter updated",
        by: "Admission",
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: status === "submitted_to_director" ? <MailOutlined /> : <FileTextOutlined />,
        iconBg: "#eef6ff",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    studentNotes.forEach((note) => {
      const rawTime = note.updated_at ?? note.created_at;
      if (!rawTime) return;

      const content = String(note.content ?? "").trim();
      if (!content) return;
      const title = content.split("\n").find(Boolean)?.slice(0, 140) ?? "Internal note";

      items.push({
        id: `note-${note.id ?? rawTime}`,
        section: "Internal note",
        badge: "Admission",
        title,
        by: content,
        timeAgo: formatRelativeTime(rawTime),
        icon: <PushpinOutlined />,
        iconBg: "#fff4db",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    if (detailStudentData?.student_status_updated_at) {
      items.push({
        id: `student-status-${detailStudentData.id}`,
        section: "Student status",
        badge: "Status update",
        title: `Student status updated to ${detailStudentData.student_status ?? "On Going"}`,
        by: detailStudentData.student_status_updated_by_name ?? "Admission",
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(detailStudentData.student_status_updated_at),
        icon: <ArrowUpOutlined />,
        iconBg: "#e8f1ff",
        sortTime: new Date(detailStudentData.student_status_updated_at).getTime(),
      });
    }

    if (detailStudentData?.visa_granted_at) {
      items.push({
        id: `visa-${detailStudentData.id}`,
        section: "Visa status",
        badge: "System",
        title: `Visa status updated to ${detailStudentData.visa_status ?? "Grant"}`,
        by: "System",
        timeAgo: formatRelativeTime(detailStudentData.visa_granted_at),
        icon: <ArrowUpOutlined />,
        iconBg: "#e8f1ff",
        sortTime: new Date(detailStudentData.visa_granted_at).getTime(),
      });
    }

    return items
      .filter((item) => !Number.isNaN(item.sortTime))
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 50);
  }, [
    answerApprovalItems,
    currentStepLabel,
    cvDocuments,
    detailStudentData,
    formatRelativeTime,
    sponsorDocuments,
    statementDocuments,
    studentNotes,
    translationItems,
  ]);

  return (
    <Card
      bodyStyle={{ padding: 20 }}
      style={{
        borderRadius: 20,
        borderColor: "#dbe4ee",
        boxShadow: "0 12px 34px rgba(15, 23, 42, 0.05)",
      }}
    >
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
              Activity Log
            </Title>
            <Text type="secondary">
              Timeline semua aktivitas terbaru untuk case student ini
            </Text>
          </div>
        </div>

        <Space direction="vertical" size={18} style={{ width: "100%" }}>
          {activityItems.length ? (
            activityItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 12,
                alignItems: "start",
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: item.iconBg,
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#2563eb",
                  marginTop: 2,
                  position: "relative",
                }}
              >
                {item.icon}
                {index < activityItems.length - 1 ? (
                  <div
                    style={{
                      position: "absolute",
                      top: 28,
                      left: "50%",
                      transform: "translateX(-50%)",
                      width: 1,
                      height: 42,
                      background: "#e2e8f0",
                    }}
                  />
                ) : null}
              </div>

              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Space wrap size={8}>
                  <Text type="secondary">{item.section}</Text>
                  <Tag
                    color="blue"
                    style={{
                      margin: 0,
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {item.badge}
                  </Tag>
                </Space>

                <Text strong style={{ fontSize: 16, color: "#0f172a" }}>
                  {item.title}
                </Text>

                <Text style={{ color: item.byColor ?? "#64748b" }}>
                  {item.byColor ? (
                    <>
                      by <span style={{ fontWeight: 600 }}>{item.by}</span>
                    </>
                  ) : (
                    item.by
                  )}
                </Text>
              </Space>

              <Text type="secondary" style={{ whiteSpace: "nowrap" }}>
                {item.timeAgo}
              </Text>
            </div>
            ))
          ) : (
            <Text type="secondary">Belum ada aktivitas.</Text>
          )}
        </Space>
      </Space>
    </Card>
  );
}
