"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FileDoneOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Card, Empty, Select, Space, Tag, Typography } from "antd";

import LoadingSplash from "@/app/components/common/loading";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import { useSponsorLetterAiApprovals } from "@/app/hooks/use-sponsor-letter-ai-approvals";
import { useStatementLetterAiApprovals } from "@/app/hooks/use-statement-letter-ai-approvals";
import { useUserRoleStudents } from "@/app/hooks/use-users";
import type { AnswerApprovalsDataModel } from "@/app/models/answer-approvals";
import type { InformationCountryDataModel } from "@/app/models/information-country-management";
import type { UserDataModel } from "@/app/models/user";

const { Text } = Typography;

type WorkloadCard = {
  key: string;
  count: number;
  title: string;
  caption: string;
  tag: string;
  tagColor: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
};

const countryFlagMap: Record<string, string> = {
  australia: "🇦🇺",
  canada: "🇨🇦",
  germany: "🇩🇪",
  netherlands: "🇳🇱",
  "united kingdom": "🇬🇧",
  uk: "🇬🇧",
  indonesia: "🇮🇩",
  malaysia: "🇲🇾",
  singapore: "🇸🇬",
  ireland: "🇮🇪",
  "new zealand": "🇳🇿",
  usa: "🇺🇸",
  "united states": "🇺🇸",
};

const priorityOrder: Record<string, number> = {
  high: 0,
  medium: 1,
  normal: 2,
  low: 3,
};

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function getCountryName(student: UserDataModel): string {
  return student.stage?.country?.name?.trim() || "Unknown";
}

function getCountryFlag(countryName?: string | null): string {
  return countryFlagMap[normalizeText(countryName)] ?? "🌍";
}

function getCurrentStepLabel(student: UserDataModel): string {
  const currentStepId = String(student.current_step_id ?? "");
  if (!currentStepId) return "Belum ditentukan";

  const steps = student.stage?.country?.steps ?? [];
  const step = steps.find((item) => item.id === currentStepId);
  return step?.label ?? "Belum ditentukan";
}

function getStudentPipelineStatus(student: UserDataModel): {
  label: string;
  tone: { background: string; color: string };
} {
  const raw = normalizeText(student.student_status);
  if (raw.includes("cancel")) {
    return { label: "Cancel", tone: { background: "#fff1f2", color: "#e11d48" } };
  }
  if (raw.includes("postpone") || raw.includes("post pone") || raw.includes("pending")) {
    return { label: "Pending Approval", tone: { background: "#fff7ed", color: "#d97706" } };
  }
  if (raw.includes("complete") || raw.includes("done")) {
    return { label: "Completed", tone: { background: "#f1f5f9", color: "#64748b" } };
  }
  return { label: "On Progress", tone: { background: "#dcfce7", color: "#16a34a" } };
}

function getStepTone(stepLabel: string): { background: string; color: string } {
  const raw = normalizeText(stepLabel);
  if (raw.includes("step 1")) return { background: "#ffedd5", color: "#ea580c" };
  if (raw.includes("step 2")) return { background: "#f3e8ff", color: "#9333ea" };
  if (raw.includes("step 3")) return { background: "#dbeafe", color: "#2563eb" };
  if (raw.includes("step 4")) return { background: "#ede9fe", color: "#4f46e5" };
  if (raw.includes("step 5")) return { background: "#ecfccb", color: "#4d7c0f" };
  return { background: "#f1f5f9", color: "#475569" };
}

function getVisaSummaryCategory(value?: string | null): "granted" | "processing" | "refused" {
  const raw = normalizeText(value);
  if (raw.includes("grant") || raw.includes("approved")) return "granted";
  if (raw.includes("refus") || raw.includes("reject") || raw.includes("cancel")) return "refused";
  return "processing";
}

function formatShortDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPriorityLabel(value?: string | null): string {
  switch (normalizeText(value)) {
    case "high":
      return "High Priority";
    case "medium":
      return "Medium Priority";
    case "low":
      return "Low Priority";
    default:
      return "Normal Priority";
  }
}

function getPriorityTone(value?: string | null): { background: string; color: string; border: string } {
  switch (normalizeText(value)) {
    case "high":
      return { background: "#fff1f2", color: "#ef4444", border: "#fecdd3" };
    case "medium":
      return { background: "#fff7ed", color: "#d97706", border: "#fed7aa" };
    case "low":
      return { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" };
    default:
      return { background: "#f8fafc", color: "#64748b", border: "#cbd5e1" };
  }
}

function DashboardCard({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Card
      style={{
        borderRadius: 24,
        borderColor: "#dbe4ee",
        boxShadow: "0 18px 38px rgba(15, 23, 42, 0.06)",
        ...style,
      }}
      styles={{ body: { padding: 20 } }}
    >
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <div>
          <Text strong style={{ fontSize: 22, color: "#0f172a" }}>
            {title}
          </Text>
          <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            {subtitle}
          </Text>
        </div>
        {children}
      </Space>
    </Card>
  );
}

function WorkloadMetricCard({ item }: { item: WorkloadCard }) {
  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 18,
        padding: 18,
        background: "#ffffff",
      }}
    >
      <Space direction="vertical" size={14} style={{ width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              display: "grid",
              placeItems: "center",
              background: item.iconBg,
              color: item.iconColor,
              fontSize: 18,
            }}
          >
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
              {item.count}
            </div>
            <Text style={{ color: "#0f172a", fontWeight: 500 }}>{item.title}</Text>
          </div>
        </div>
        <Text type="secondary" style={{ minHeight: 44 }}>
          {item.caption}
        </Text>
        <Tag
          style={{
            width: "fit-content",
            margin: 0,
            borderRadius: 999,
            padding: "2px 10px",
            fontSize: 11,
            borderColor: "transparent",
            color: item.tagColor,
            background: `${item.tagColor}14`,
          }}
        >
          {item.tag}
        </Tag>
      </Space>
    </div>
  );
}

export default function DirectorDashboardHomeContent() {
  const router = useRouter();
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: students = [], fetchLoading: studentsLoading } = useUserRoleStudents();
  const { data: answerApprovals = [], fetchLoading: approvalsLoading } = useAnswerApprovals();
  const { data: statementApprovals = [], fetchLoading: statementLoading } = useStatementLetterAiApprovals();
  const { data: sponsorApprovals = [], fetchLoading: sponsorLoading } = useSponsorLetterAiApprovals();
  const { data: informationUpdates = [], fetchLoading: informationLoading } = useInformationCountries({});

  const isLoading =
    studentsLoading || approvalsLoading || statementLoading || sponsorLoading || informationLoading;

  const activeStudents = useMemo(() => {
    return students.filter((student) => String(student.role ?? "").toUpperCase() === "STUDENT");
  }, [students]);

  const workloadCards = useMemo<WorkloadCard[]>(() => {
    const pendingApprovals = answerApprovals.filter(
      (item: AnswerApprovalsDataModel) => normalizeText(item.status || "pending") === "pending",
    ).length;

    const pendingLetters = [...statementApprovals, ...sponsorApprovals].filter(
      (item) => normalizeText(item.status || "pending") === "pending",
    ).length;

    return [
      {
        key: "documents",
        count: pendingApprovals,
        title: "Dokumen menunggu disetujui",
        caption: "Approval dokumen dan jawaban student yang masih menunggu review director.",
        tag: "Pending",
        tagColor: "#2563eb",
        icon: <FileDoneOutlined />,
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
      },
      {
        key: "letters",
        count: pendingLetters,
        title: "Dokumen letter menunggu disetujui",
        caption: "Statement letter dan sponsor letter yang masih menunggu keputusan director.",
        tag: "Pending",
        tagColor: "#7c3aed",
        icon: <FileTextOutlined />,
        iconBg: "#ede9fe",
        iconColor: "#7c3aed",
      },
    ];
  }, [answerApprovals, sponsorApprovals, statementApprovals]);

  const countryOptions = useMemo(() => {
    const names = Array.from(new Set(activeStudents.map((student) => getCountryName(student))));
    return names.filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [activeStudents]);

  const stepOptions = useMemo(() => {
    const labels = Array.from(new Set(activeStudents.map((student) => getCurrentStepLabel(student))));
    return labels.filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [activeStudents]);

  const pipelineStudents = useMemo(() => {
    return activeStudents.filter((student) => {
      const country = getCountryName(student);
      const step = getCurrentStepLabel(student);
      const status = getStudentPipelineStatus(student).label;

      if (countryFilter !== "all" && country !== countryFilter) return false;
      if (stepFilter !== "all" && step !== stepFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      return true;
    });
  }, [activeStudents, countryFilter, stepFilter, statusFilter]);

  const visaSummary = useMemo(() => {
    const counts = { granted: 0, processing: 0, refused: 0 };
    activeStudents.forEach((student) => {
      counts[getVisaSummaryCategory(student.visa_status)] += 1;
    });
    return counts;
  }, [activeStudents]);

  const totalVisaSummary = visaSummary.granted + visaSummary.processing + visaSummary.refused;
  const successRate = totalVisaSummary
    ? Math.round((visaSummary.granted / totalVisaSummary) * 100)
    : 0;

  const visaDonutStyle = useMemo(() => {
    if (!totalVisaSummary) {
      return { background: "conic-gradient(#e2e8f0 0 360deg)" };
    }
    const grantedDeg = (visaSummary.granted / totalVisaSummary) * 360;
    const processingDeg = (visaSummary.processing / totalVisaSummary) * 360;
    const refusedDeg = (visaSummary.refused / totalVisaSummary) * 360;
    return {
      background: `conic-gradient(#22c55e 0deg ${grantedDeg}deg, #f97316 ${grantedDeg}deg ${grantedDeg + processingDeg}deg, #ef4444 ${grantedDeg + processingDeg}deg ${grantedDeg + processingDeg + refusedDeg}deg)`,
    };
  }, [totalVisaSummary, visaSummary]);

  const recentVisaUpdates = useMemo(() => {
    return activeStudents
      .filter((student) => student.visa_status)
      .sort((a, b) => {
        const timeA = new Date(a.visa_granted_at ?? a.updated_at ?? 0).getTime();
        const timeB = new Date(b.visa_granted_at ?? b.updated_at ?? 0).getTime();
        return timeB - timeA;
      })
      .slice(0, 4);
  }, [activeStudents]);

  const importantUpdates = useMemo(() => {
    return [...informationUpdates]
      .sort((a: InformationCountryDataModel, b: InformationCountryDataModel) => {
        const priorityCompare =
          (priorityOrder[normalizeText(a.priority)] ?? 99) -
          (priorityOrder[normalizeText(b.priority)] ?? 99);
        if (priorityCompare !== 0) return priorityCompare;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, 4);
  }, [informationUpdates]);

  if (isLoading) {
    return <LoadingSplash label="Loading director dashboard" />;
  }

  return (
    <div
      style={{
        padding: 24,
        background: "linear-gradient(180deg, #f8fbff 0%, #ffffff 100%)",
        minHeight: "100%",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(340px, 0.95fr)",
          gap: 20,
          alignItems: "start",
        }}
      >
        <DashboardCard
          title="Today's Workload"
          subtitle="Tasks requiring your attention"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {workloadCards.map((item) => (
              <WorkloadMetricCard key={item.key} item={item} />
            ))}
          </div>

          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 22,
              padding: 18,
              marginTop: 12,
              background: "#ffffff",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <Text strong style={{ fontSize: 18 }}>
                Student Pipeline
              </Text>
              <Space wrap>
                <Select
                  value={countryFilter}
                  onChange={setCountryFilter}
                  style={{ minWidth: 150 }}
                  options={[{ value: "all", label: "All Countries" }, ...countryOptions.map((item) => ({ value: item, label: item }))]}
                />
                <Select
                  value={stepFilter}
                  onChange={setStepFilter}
                  style={{ minWidth: 130 }}
                  options={[{ value: "all", label: "All Steps" }, ...stepOptions.map((item) => ({ value: item, label: item }))]}
                />
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ minWidth: 130 }}
                  options={[
                    { value: "all", label: "All Status" },
                    { value: "On Progress", label: "On Progress" },
                    { value: "Pending Approval", label: "Pending Approval" },
                    { value: "Completed", label: "Completed" },
                    { value: "Cancel", label: "Cancel" },
                  ]}
                />
              </Space>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "#64748b" }}>
                    <th style={{ padding: "12px 8px" }}>Name</th>
                    <th style={{ padding: "12px 8px" }}>Destination</th>
                    <th style={{ padding: "12px 8px" }}>Visa Type</th>
                    <th style={{ padding: "12px 8px" }}>Step</th>
                    <th style={{ padding: "12px 8px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelineStudents.slice(0, 6).map((student) => {
                    const stepLabel = getCurrentStepLabel(student);
                    const stepTone = getStepTone(stepLabel);
                    const status = getStudentPipelineStatus(student);
                    const initials = student.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <tr
                        key={String(student.id)}
                        onClick={() =>
                          router.push(`/director/dashboard/students-management/detail/${student.id}`)
                        }
                        style={{ borderTop: "1px solid #e2e8f0", cursor: "pointer" }}
                      >
                        <td style={{ padding: "14px 8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: 999,
                                background: "#e2e8f0",
                                color: "#334155",
                                display: "grid",
                                placeItems: "center",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {initials}
                            </div>
                            <Text strong>{student.name}</Text>
                          </div>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <Space>
                            <span>{getCountryFlag(getCountryName(student))}</span>
                            <Text>{getCountryName(student)}</Text>
                          </Space>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <Text>{String(student.visa_type ?? "Student Visa").replace(/_/g, " ")}</Text>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <Tag
                            style={{
                              margin: 0,
                              borderRadius: 999,
                              padding: "6px 10px",
                              background: stepTone.background,
                              color: stepTone.color,
                              borderColor: "transparent",
                            }}
                          >
                            {stepLabel}
                          </Tag>
                        </td>
                        <td style={{ padding: "14px 8px" }}>
                          <Tag
                            style={{
                              margin: 0,
                              borderRadius: 999,
                              padding: "6px 10px",
                              background: status.tone.background,
                              color: status.tone.color,
                              borderColor: "transparent",
                            }}
                          >
                            {status.label}
                          </Tag>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {!pipelineStudents.length && <Empty description="Tidak ada student yang cocok dengan filter." />}
            </div>
          </div>
        </DashboardCard>

        <DashboardCard
          title="Visa Status Summary"
          subtitle="Overall visa application results"
        >
          <div style={{ display: "grid", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: "50%",
                  position: "relative",
                  ...visaDonutStyle,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 40,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 38, fontWeight: 700, color: "#0f172a" }}>
                      {successRate}%
                    </div>
                  </div>
                </div>
              </div>

              <Space direction="vertical" size={10}>
                <Tag color="green">Granted ({visaSummary.granted})</Tag>
                <Tag color="orange">In Process ({visaSummary.processing})</Tag>
                <Tag color="red">Refused ({visaSummary.refused})</Tag>
              </Space>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 12, fontSize: 18 }}>
                Recent Visa Updates
              </Text>
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                {recentVisaUpdates.length ? (
                  recentVisaUpdates.map((student) => {
                    const category = getVisaSummaryCategory(student.visa_status);
                    const tone =
                      category === "granted"
                        ? { background: "#dcfce7", color: "#16a34a", label: "Granted" }
                        : category === "refused"
                          ? { background: "#fff1f2", color: "#ef4444", label: "Refused" }
                          : { background: "#fff7ed", color: "#f97316", label: "In Process" };
                    return (
                      <div
                        key={String(student.id)}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: "12px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 12,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              display: "grid",
                              placeItems: "center",
                              background: "#f8fafc",
                              fontSize: 18,
                            }}
                          >
                            {getCountryFlag(getCountryName(student))}
                          </div>
                          <div>
                            <Text strong style={{ display: "block" }}>{student.name}</Text>
                            <Text type="secondary">{getCountryName(student)}</Text>
                          </div>
                        </div>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 999,
                            padding: "6px 12px",
                            background: tone.background,
                            color: tone.color,
                            borderColor: "transparent",
                          }}
                        >
                          {tone.label}
                        </Tag>
                      </div>
                    );
                  })
                ) : (
                  <Empty description="Belum ada update visa." />
                )}
              </Space>
            </div>
          </div>
        </DashboardCard>
      </div>

      <div style={{ marginTop: 20 }}>
        <DashboardCard
          title="Important Notes & Updates"
          subtitle="System alerts and announcements"
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {importantUpdates.length ? (
              importantUpdates.map((item: InformationCountryDataModel) => {
                const tone = getPriorityTone(item.priority);
                return (
                  <div
                    key={item.id}
                    style={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 18,
                      padding: 18,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start", flex: 1 }}>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 14,
                            background: "#eff6ff",
                            color: "#2563eb",
                            display: "grid",
                            placeItems: "center",
                            fontSize: 20,
                            flexShrink: 0,
                          }}
                        >
                          <InfoCircleOutlined />
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text strong style={{ display: "block", fontSize: 18 }}>
                            {item.title}
                          </Text>
                          <Text style={{ display: "block", color: "#64748b", marginTop: 8 }}>
                            {item.description || "Tidak ada deskripsi tambahan."}
                          </Text>
                          <Text type="secondary" style={{ display: "block", marginTop: 10 }}>
                            {formatShortDate(item.updated_at || item.created_at)}
                          </Text>
                        </div>
                      </div>
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          padding: "8px 12px",
                          background: tone.background,
                          color: tone.color,
                          borderColor: tone.border,
                          whiteSpace: "normal",
                          textAlign: "center",
                        }}
                      >
                        {formatPriorityLabel(item.priority)}
                      </Tag>
                    </div>
                  </div>
                );
              })
            ) : (
              <Empty description="Belum ada notes atau updates." />
            )}
          </Space>
        </DashboardCard>
      </div>
    </div>
  );
}
