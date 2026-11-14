"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  ArrowUpOutlined,
  DownOutlined,
  FileTextOutlined,
  HistoryOutlined,
  MailOutlined,
  PushpinOutlined,
  UpOutlined,
} from "@ant-design/icons";
import { Button, Flex, Tag, Typography } from "antd";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useDocumentTranslations } from "@/app/hooks/use-document-translations";
import { useGeneratedCvAiDocuments } from "@/app/hooks/use-generated-cv-ai-documents";
import { useGeneratedSponsorLetterAiDocuments } from "@/app/hooks/use-generated-sponsor-letter-ai-documents";
import { useGeneratedStatementLetterAiDocuments } from "@/app/hooks/use-generated-statement-letter-ai-documents";
import { useStudentNotes } from "@/app/hooks/use-student-notes";
import { useUser } from "@/app/hooks/use-users";
import styles from "./detail.module.css";

type ActivityItem = {
  id: string;
  section: string;
  badge: string;
  title: string;
  by: string;
  byColor?: string;
  timeAgo: string;
  icon: React.ReactNode;
  iconBg: string;
  sortTime: number;
};

export default function StudentRecentActivityTimeline({
  studentId,
  isExpanded: controlledExpanded,
  onToggleExpanded,
}: {
  studentId?: string;
  isExpanded?: boolean;
  onToggleExpanded?: (next: boolean) => void;
}) {
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
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "1d ago";
    return `${days}d ago`;
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
  }, [detailStudentData?.current_step_id, stepsSource]);

  const activityItems = useMemo(() => {
    const items: ActivityItem[] = [];
    const defaultAdmissionStaff =
      detailStudentData?.student_status_updated_by_name?.trim() ||
      (detailStudentData as any)?.name_admission?.trim() ||
      "Admission Kim";

    translationItems.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const isCompleted = String(item.status ?? "").toLowerCase() === "completed";

      items.push({
        id: `translation-${item.id}`,
        section: `${currentStepLabel} · Translation`,
        badge: isCompleted ? "Completed" : "In Progress",
        title: isCompleted
          ? "Translation document marked completed"
          : "Translation document in progress",
        by: defaultAdmissionStaff,
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: <FileTextOutlined style={{ fontSize: 11 }} />,
        iconBg: "#eff6ff",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    answerApprovalItems.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const isApproved = String(item.status ?? "").toLowerCase() === "approved";
      const reviewerName =
        (item as any)?.reviewer?.name ||
        (item as any)?.reviewer_name ||
        defaultAdmissionStaff;

      items.push({
        id: `approval-${item.id}`,
        section: `${currentStepLabel} · Approval`,
        badge: isApproved ? "Approved" : "Rejected",
        title: isApproved ? "Document approved" : "Document rejected",
        by: reviewerName,
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: <FileTextOutlined style={{ fontSize: 11 }} />,
        iconBg: isApproved ? "#f0fdf4" : "#fef2f2",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    cvDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();
      const reviewerName =
        (item as any)?.reviewer?.name ||
        (item as any)?.reviewer_name ||
        defaultAdmissionStaff;

      items.push({
        id: `cv-${item.id}`,
        section: `${currentStepLabel} · Data & CV`,
        badge: status === "approved" ? "Approved" : "CV",
        title: status === "approved" ? "CV approved" : "CV updated",
        by: reviewerName,
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: <FileTextOutlined style={{ fontSize: 11 }} />,
        iconBg: "#eff6ff",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    statementDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();
      const reviewerName =
        item.current_approval?.reviewer?.name ||
        (item as any)?.reviewer_name ||
        defaultAdmissionStaff;

      items.push({
        id: `statement-${item.id}`,
        section: `${currentStepLabel} · Letter`,
        badge: status === "submitted_to_director" ? "Sent to Director" : "Letter",
        title:
          status === "submitted_to_director"
            ? "Statement letter submitted to Director"
            : "Statement letter updated",
        by: reviewerName,
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: status === "submitted_to_director" ? <MailOutlined style={{ fontSize: 11 }} /> : <FileTextOutlined style={{ fontSize: 11 }} />,
        iconBg: "#eff6ff",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    sponsorDocuments.forEach((item) => {
      const rawTime = item.updated_at ?? item.created_at;
      if (!rawTime) return;

      const status = String(item.status ?? "").toLowerCase();
      const reviewerName =
        item.current_approval?.reviewer?.name ||
        (item as any)?.reviewer_name ||
        defaultAdmissionStaff;

      items.push({
        id: `sponsor-${item.id}`,
        section: `${currentStepLabel} · Letter`,
        badge: status === "submitted_to_director" ? "Sent to Director" : "Letter",
        title:
          status === "submitted_to_director"
            ? "Sponsor letter submitted to Director"
            : "Sponsor letter updated",
        by: reviewerName,
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(rawTime),
        icon: status === "submitted_to_director" ? <MailOutlined style={{ fontSize: 11 }} /> : <FileTextOutlined style={{ fontSize: 11 }} />,
        iconBg: "#eff6ff",
        sortTime: new Date(rawTime).getTime(),
      });
    });

    studentNotes.forEach((note) => {
      const rawTime = note.updated_at ?? note.created_at;
      if (!rawTime) return;

      const content = String(note.content ?? "").trim();
      if (!content) return;
      const title = content.split("\n").find(Boolean)?.slice(0, 100) ?? "Internal note";
      const authorName =
        (note as any)?.creator?.name ||
        (note as any)?.author_name ||
        (note as any)?.user?.name ||
        defaultAdmissionStaff;

      items.push({
        id: `note-${note.id ?? rawTime}`,
        section: "Internal note",
        badge: "Note",
        title,
        by: authorName,
        timeAgo: formatRelativeTime(rawTime),
        icon: <PushpinOutlined style={{ fontSize: 11 }} />,
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
        by: detailStudentData.student_status_updated_by_name || defaultAdmissionStaff,
        byColor: "#2563eb",
        timeAgo: formatRelativeTime(detailStudentData.student_status_updated_at),
        icon: <ArrowUpOutlined style={{ fontSize: 11 }} />,
        iconBg: "#e8f1ff",
        sortTime: new Date(detailStudentData.student_status_updated_at).getTime(),
      });
    }

    return items
      .filter((item) => !Number.isNaN(item.sortTime))
      .sort((a, b) => b.sortTime - a.sortTime)
      .slice(0, 30);
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

  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpanded = () => {
    const next = !isExpanded;
    if (onToggleExpanded) {
      onToggleExpanded(next);
    } else {
      setInternalExpanded(next);
    }
  };

  const PREVIEW_LIMIT = 3;
  const hasMore = activityItems.length > PREVIEW_LIMIT;
  const visibleItems = isExpanded
    ? activityItems
    : activityItems.slice(0, PREVIEW_LIMIT);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: isExpanded ? "100%" : "auto",
        minWidth: 0,
        flex: isExpanded ? 1 : "0 0 auto",
      }}
    >
      <Flex
        justify="space-between"
        align="center"
        wrap="nowrap"
        gap={8}
        style={{ marginBottom: 14 }}
      >
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          Riwayat pembaruan
        </Typography.Text>

        <Tag
          color="blue"
          style={{
            margin: 0,
            borderRadius: 5,
            fontSize: 10.5,
            fontWeight: 600,
            padding: "0 6px",
            height: 19,
            lineHeight: "17px",
            display: "inline-flex",
            alignItems: "center",
            flexShrink: 0,
            whiteSpace: "nowrap",
            cursor: hasMore ? "pointer" : "default",
          }}
          onClick={() => {
            if (hasMore) toggleExpanded();
          }}
        >
          {activityItems.length} Aktivitas
        </Tag>
      </Flex>

      {/* Timeline List */}
      <div
        className={
          isExpanded
            ? styles.timelineListExpanded
            : styles.timelineListCollapsed
        }
      >
        {visibleItems.length > 0 ? (
          visibleItems.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 10,
                alignItems: "start",
                position: "relative",
              }}
            >
              {/* Icon & connecting line */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: item.iconBg,
                    border: "1px solid #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2563eb",
                    zIndex: 1,
                  }}
                >
                  {item.icon}
                </div>
                {idx < visibleItems.length - 1 && (
                  <div
                    style={{
                      width: 1,
                      flex: 1,
                      minHeight: 24,
                      background: "#e2e8f0",
                      margin: "2px 0",
                    }}
                  />
                )}
              </div>

              {/* Text info */}
              <div style={{ minWidth: 0, paddingBottom: 6 }}>
                <Flex justify="space-between" align="center" gap={6}>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                  >
                    {item.section}
                  </Typography.Text>
                  <Typography.Text
                    type="secondary"
                    style={{ fontSize: 10, flexShrink: 0, color: "#94a3b8" }}
                  >
                    {item.timeAgo}
                  </Typography.Text>
                </Flex>

                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#1e293b",
                    lineHeight: 1.3,
                    marginTop: 2,
                  }}
                >
                  {item.title}
                </div>

                <div style={{ fontSize: 11, color: item.byColor ?? "#64748b", marginTop: 2 }}>
                  by <span style={{ fontWeight: 600 }}>{item.by}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div
            style={{
              padding: "24px 12px",
              textAlign: "center",
              color: "#94a3b8",
              fontSize: 12,
              background: "#f8fafc",
              borderRadius: 10,
              border: "1px dashed #e2e8f0",
            }}
          >
            Belum ada log aktivitas tercatat
          </div>
        )}
      </div>

      {hasMore && (
        <Button
          type="default"
          block
          onClick={toggleExpanded}
          style={{
            marginTop: isExpanded ? "auto" : 14,
            height: 38,
            borderRadius: 8,
            color: isExpanded ? "#475569" : "#1d4ed8",
            background: isExpanded ? "#f8fafc" : "#eff6ff",
            borderColor: isExpanded ? "#cbd5e1" : "#bfdbfe",
            fontWeight: 600,
            fontSize: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
          }}
        >
          <span>
            {isExpanded ? "Tutup Detail" : "Lihat Semua"}
          </span>
          {isExpanded ? (
            <UpOutlined style={{ fontSize: 11 }} />
          ) : (
            <DownOutlined style={{ fontSize: 11 }} />
          )}
        </Button>
      )}
    </div>
  );
}
