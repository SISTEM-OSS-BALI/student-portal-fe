"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import { Card, Empty, Select, Space, Tag, Typography } from "antd";

import api from "@/lib/api";
import LoadingSplash from "@/app/components/common/loading";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useDocumentTranslations } from "@/app/hooks/use-document-translations";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import { useUserRoleStudents } from "@/app/hooks/use-users";
import type { AnswerApprovalsDataModel } from "@/app/models/answer-approvals";
import type { DocumentTranslationDataModel } from "@/app/models/document-translations";
import type { InformationCountryDataModel } from "@/app/models/information-country-management";
import type { UserDataModel } from "@/app/models/user";

const { Text } = Typography;

type GeneratedDocModel = {
  id: string;
  student_id: string;
  status?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ActivityItem = {
  id: string;
  time: string;
  sortTime: string;
  title: string;
  subtitle: string;
  actor: string;
  actorColor: string;
  icon: React.ReactNode;
};

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

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
          <Text strong style={{ fontSize: 22, color: "#1e3a8a" }}>
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

export default function AdmissionDashboardHomeContent() {
  const router = useRouter();
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: students = [], fetchLoading: studentsLoading } = useUserRoleStudents();
  const { data: documentTranslations = [], fetchLoading: translationsLoading } = useDocumentTranslations();
  const { data: answerApprovals = [], fetchLoading: approvalsLoading } = useAnswerApprovals();
  const { data: informationUpdates = [], fetchLoading: informationLoading } = useInformationCountries({});

  const { data: cvDocuments = [], isLoading: cvLoading } = useQuery({
    queryKey: ["generated-cv-ai-documents", "dashboard"],
    queryFn: async () => {
      const result = await api.get("/api/generate-cv-ai/documents");
      const payload = (result.data?.result ?? result.data) as GeneratedDocModel[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  const { data: statementDocuments = [], isLoading: statementLoading } = useQuery({
    queryKey: ["generated-statement-letter-ai-documents", "dashboard"],
    queryFn: async () => {
      const result = await api.get("/api/generate-statement-letter-ai/documents");
      const payload = (result.data?.result ?? result.data) as GeneratedDocModel[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  const { data: sponsorDocuments = [], isLoading: sponsorLoading } = useQuery({
    queryKey: ["generated-sponsor-letter-ai-documents", "dashboard"],
    queryFn: async () => {
      const result = await api.get("/api/generate-sponsor-letter-ai/documents");
      const payload = (result.data?.result ?? result.data) as GeneratedDocModel[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  const isLoading =
    studentsLoading ||
    translationsLoading ||
    approvalsLoading ||
    informationLoading ||
    cvLoading ||
    statementLoading ||
    sponsorLoading;

  const activeStudents = useMemo(() => {
    return students.filter((student) => String(student.role ?? "").toUpperCase() === "STUDENT");
  }, [students]);

  const translationPagesByStudent = useMemo(() => {
    return documentTranslations.reduce<Record<string, number>>((acc, item) => {
      const studentId = String(item.student_id ?? "");
      if (!studentId) return acc;
      acc[studentId] = (acc[studentId] ?? 0) + Number(item.page_count ?? 0);
      return acc;
    }, {});
  }, [documentTranslations]);

  const workloadCards = useMemo<WorkloadCard[]>(() => {
    const pendingApprovals = answerApprovals.filter(
      (item: AnswerApprovalsDataModel) => normalizeText(item.status || "pending") === "pending",
    ).length;

    const translationPending = activeStudents.filter(
      (student) => Number(student.translation_quota ?? 0) > 0,
    ).length;

    const cvPending = cvDocuments.filter((doc) => {
      const status = normalizeText(doc.status);
      return !status || status === "draft" || status === "submitted_to_director" || status === "revision_requested";
    }).length;

    const lettersWaitingDirector = [...statementDocuments, ...sponsorDocuments].filter((doc) => {
      const status = normalizeText(doc.status);
      return status === "submitted_to_director" || status === "revision_requested";
    }).length;

    return [
      {
        key: "approvals",
        count: pendingApprovals,
        title: "Dokumen menunggu disetujui",
        caption: "Approval jawaban dan dokumen yang masih perlu ditindaklanjuti.",
        tag: "Pending",
        tagColor: "#2563eb",
        icon: <FileDoneOutlined />,
        iconBg: "#dbeafe",
        iconColor: "#2563eb",
      },
      {
        key: "translation",
        count: translationPending,
        title: "Quota translation tersisa",
        caption: "Student dengan sisa halaman translation yang masih perlu diunggah.",
        tag: "Pending",
        tagColor: "#9333ea",
        icon: <TranslationOutlined />,
        iconBg: "#f3e8ff",
        iconColor: "#9333ea",
      },
      {
        key: "cv",
        count: cvPending,
        title: "CV menunggu di review",
        caption: "Dokumen CV aktif yang belum mencapai status final.",
        tag: "Pending",
        tagColor: "#ea580c",
        icon: <FileTextOutlined />,
        iconBg: "#ffedd5",
        iconColor: "#ea580c",
      },
      {
        key: "letters",
        count: lettersWaitingDirector,
        title: "Surat menunggu director",
        caption: "Statement dan sponsor letter yang sudah masuk proses director.",
        tag: "Pending",
        tagColor: "#16a34a",
        icon: <AlertOutlined />,
        iconBg: "#dcfce7",
        iconColor: "#16a34a",
      },
    ];
  }, [activeStudents, answerApprovals, cvDocuments, sponsorDocuments, statementDocuments]);

  const translationAlerts = useMemo(() => {
    return activeStudents
      .filter((student) => Number(student.translation_quota ?? 0) > 0)
      .map((student) => {
        const remaining = Number(student.translation_quota ?? 0);
        const uploadedPages = translationPagesByStudent[String(student.id)] ?? 0;
        const total = Math.max(remaining + uploadedPages, remaining);
        return {
          id: String(student.id),
          name: student.name,
          country: getCountryName(student),
          remaining,
          total,
        };
      })
      .sort((a, b) => a.remaining - b.remaining || a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [activeStudents, translationPagesByStudent]);

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
  }, [activeStudents, countryFilter, statusFilter, stepFilter]);

  const visaSummary = useMemo(() => {
    const counts = { granted: 0, processing: 0, refused: 0 };
    activeStudents.forEach((student) => {
      counts[getVisaSummaryCategory(student.visa_status)] += 1;
    });
    return counts;
  }, [activeStudents]);

  const totalVisaSummary = visaSummary.granted + visaSummary.processing + visaSummary.refused;
  const visaDonutStyle = useMemo(() => {
    if (!totalVisaSummary) {
      return { background: "conic-gradient(#e2e8f0 0 360deg)" };
    }
    const grantedDeg = (visaSummary.granted / totalVisaSummary) * 360;
    const processingDeg = (visaSummary.processing / totalVisaSummary) * 360;
    const refusedDeg = (visaSummary.refused / totalVisaSummary) * 360;
    return {
      background: `conic-gradient(#10b981 0deg ${grantedDeg}deg, #f59e0b ${grantedDeg}deg ${grantedDeg + processingDeg}deg, #ef4444 ${grantedDeg + processingDeg}deg ${grantedDeg + processingDeg + refusedDeg}deg)`,
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

  const recentActivities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    documentTranslations.forEach((item: DocumentTranslationDataModel) => {
      const student = activeStudents.find((entry) => String(entry.id) === String(item.student_id));
      if (!student) return;
      items.push({
        id: `translation-${item.id}`,
        time: formatDateTime(item.updated_at ?? item.created_at),
        sortTime: String(item.updated_at ?? item.created_at ?? ""),
        title: "Admission mengupload dokumen terjemahan",
        subtitle: `Case: ${student.name}`,
        actor: "Admission",
        actorColor: "#9333ea",
        icon: <TranslationOutlined />,
      });
    });

    answerApprovals.forEach((item: AnswerApprovalsDataModel) => {
      const student = activeStudents.find((entry) => String(entry.id) === String(item.student_id));
      if (!student) return;
      items.push({
        id: `approval-${item.id}`,
        time: formatDateTime(item.reviewed_at ?? item.updated_at ?? item.created_at),
        sortTime: String(item.reviewed_at ?? item.updated_at ?? item.created_at ?? ""),
        title: `Dokumen ${normalizeText(item.status) === "approved" ? "disetujui" : "memerlukan review"}`,
        subtitle: `Case: ${student.name}`,
        actor: normalizeText(item.status) === "approved" ? "Director" : "System",
        actorColor: normalizeText(item.status) === "approved" ? "#16a34a" : "#ea580c",
        icon: normalizeText(item.status) === "approved" ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
      });
    });

    activeStudents.forEach((student) => {
      if (student.student_status_updated_at) {
        items.push({
          id: `student-status-${student.id}`,
          time: formatDateTime(student.student_status_updated_at),
          sortTime: String(student.student_status_updated_at ?? ""),
          title: `Status student diubah menjadi ${getStudentPipelineStatus(student).label}`,
          subtitle: `Case: ${student.name}`,
          actor: student.student_status_updated_by_name || "Admission",
          actorColor: "#2563eb",
          icon: <AlertOutlined />,
        });
      }

      if (student.visa_status) {
        items.push({
          id: `visa-${student.id}`,
          time: formatDateTime(student.visa_granted_at ?? student.updated_at),
          sortTime: String(student.visa_granted_at ?? student.updated_at ?? ""),
          title: `Status visa diperbarui menjadi ${student.visa_status}`,
          subtitle: `Case: ${student.name}`,
          actor: "System",
          actorColor: "#ea580c",
          icon: <FileDoneOutlined />,
        });
      }
    });

    return items
      .sort((a, b) => new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime())
      .slice(0, 6);
  }, [activeStudents, answerApprovals, documentTranslations]);

  const importantUpdates = useMemo(() => {
    return [...informationUpdates]
      .sort((a, b) => {
        const priorityCompare = (priorityOrder[normalizeText(a.priority)] ?? 99) - (priorityOrder[normalizeText(b.priority)] ?? 99);
        if (priorityCompare !== 0) return priorityCompare;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, 4);
  }, [informationUpdates]);

  if (isLoading) {
    return <LoadingSplash label="Loading admission dashboard" />;
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
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.95fr)",
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
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
            }}
          >
            {workloadCards.map((item) => (
              <WorkloadMetricCard key={item.key} item={item} />
            ))}
          </div>
        </DashboardCard>

        <DashboardCard
          title="Translation Quota Alerts"
          subtitle="Students with low remaining pages"
        >
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            {translationAlerts.length ? (
              translationAlerts.map((item) => (
                <div
                  key={item.id}
                  style={{
                    border: "1px solid #e2e8f0",
                    borderRadius: 16,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    background: "#ffffff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 999,
                        display: "grid",
                        placeItems: "center",
                        background: "#f8fafc",
                        fontSize: 18,
                      }}
                    >
                      {getCountryFlag(item.country)}
                    </div>
                    <div>
                      <Text strong style={{ display: "block" }}>
                        {item.name}
                      </Text>
                      <Text type="secondary">{item.country}</Text>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Text style={{ color: "#ef4444", fontWeight: 700, fontSize: 22 }}>
                      {item.remaining}/{item.total} pages
                    </Text>
                    <div>
                      <Text type="secondary">remaining</Text>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="Tidak ada alert translation quota." />
            )}
          </Space>
        </DashboardCard>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(320px, 0.75fr)",
          gap: 20,
          marginTop: 20,
          alignItems: "start",
        }}
      >
        <DashboardCard
          title="Student Pipeline"
          subtitle="Active students and their process status"
        >
          <div
            style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              marginBottom: 8,
            }}
          >
            <Select
              value={countryFilter}
              onChange={setCountryFilter}
              style={{ minWidth: 180 }}
              options={[{ value: "all", label: "All Countries" }, ...countryOptions.map((item) => ({ value: item, label: item }))]}
            />
            <Select
              value={stepFilter}
              onChange={setStepFilter}
              style={{ minWidth: 160 }}
              options={[{ value: "all", label: "All Steps" }, ...stepOptions.map((item) => ({ value: item, label: item }))]}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ minWidth: 160 }}
              options={[
                { value: "all", label: "All Status" },
                { value: "On Progress", label: "On Progress" },
                { value: "Pending Approval", label: "Pending Approval" },
                { value: "Completed", label: "Completed" },
                { value: "Cancel", label: "Cancel" },
              ]}
            />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#64748b" }}>
                  <th style={{ padding: "12px 10px" }}>Name</th>
                  <th style={{ padding: "12px 10px" }}>Destination</th>
                  <th style={{ padding: "12px 10px" }}>Visa Type</th>
                  <th style={{ padding: "12px 10px" }}>Step</th>
                  <th style={{ padding: "12px 10px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pipelineStudents.slice(0, 8).map((student) => {
                  const stepLabel = getCurrentStepLabel(student);
                  const stepTone = getStepTone(stepLabel);
                  const status = getStudentPipelineStatus(student);
                  return (
                    <tr
                      key={String(student.id)}
                      onClick={() =>
                        router.push(`/admission/dashboard/students-management/detail/${student.id}`)
                      }
                      style={{
                        borderTop: "1px solid #e2e8f0",
                        cursor: "pointer",
                      }}
                    >
                      <td style={{ padding: "14px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 999,
                              background: "#0f4c8a",
                              color: "#fff",
                              display: "grid",
                              placeItems: "center",
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            {student.name
                              .split(" ")
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>
                          <Text strong>{student.name}</Text>
                        </div>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <Space>
                          <span>{getCountryFlag(getCountryName(student))}</span>
                          <Text>{getCountryName(student)}</Text>
                        </Space>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <Text>{String(student.visa_type ?? "Student Visa").replace(/_/g, " ")}</Text>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 999,
                            padding: "6px 10px",
                            background: stepTone.background,
                            color: stepTone.color,
                            borderColor: "transparent",
                            whiteSpace: "normal",
                          }}
                        >
                          {stepLabel}
                        </Tag>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
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
        </DashboardCard>

        <DashboardCard
          title="Visa Status Summary"
          subtitle="Overall visa application results"
        >
          <div style={{ display: "grid", placeItems: "center", gap: 18 }}>
            <div
              style={{
                width: 156,
                height: 156,
                borderRadius: "50%",
                position: "relative",
                ...visaDonutStyle,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "grid",
                  placeItems: "center",
                  textAlign: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>
                    {totalVisaSummary}
                  </div>
                  <Text type="secondary">cases</Text>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              <Tag color="green">Granted ({visaSummary.granted})</Tag>
              <Tag color="orange">In Process ({visaSummary.processing})</Tag>
              <Tag color="red">Refused ({visaSummary.refused})</Tag>
            </div>

            <div style={{ width: "100%" }}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>
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
                        <div>
                          <Text strong style={{ display: "block" }}>
                            {student.name}
                          </Text>
                          <Text type="secondary">{getCountryName(student)}</Text>
                        </div>
                        <Tag
                          style={{
                            margin: 0,
                            borderRadius: 999,
                            padding: "4px 10px",
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

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 0.95fr)",
          gap: 20,
          marginTop: 20,
          alignItems: "start",
        }}
      >
        <DashboardCard
          title="Recent Activities"
          subtitle="Latest updates and actions"
        >
          <Space direction="vertical" size={18} style={{ width: "100%" }}>
            {recentActivities.length ? (
              recentActivities.map((activity, index) => (
                <div key={activity.id} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 999,
                        background: "#fff",
                        border: "2px solid #dbeafe",
                        color: activity.actorColor,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 18,
                      }}
                    >
                      {activity.icon}
                    </div>
                    {index < recentActivities.length - 1 && (
                      <div style={{ width: 2, height: 46, background: "#e2e8f0" }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>{activity.time}</Text>
                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          background: `${activity.actorColor}14`,
                          color: activity.actorColor,
                          borderColor: "transparent",
                        }}
                      >
                        {activity.actor}
                      </Tag>
                    </div>
                    <Text strong style={{ display: "block", marginTop: 4, fontSize: 18 }}>
                      {activity.title}
                    </Text>
                    <Text type="secondary">{activity.subtitle}</Text>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="Belum ada aktivitas terbaru." />
            )}
          </Space>
        </DashboardCard>

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
                      padding: 16,
                      background: "#ffffff",
                    }}
                  >
                    <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <div
                        style={{
                          width: 42,
                          height: 42,
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
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                          <Text strong style={{ fontSize: 18 }}>
                            {item.title}
                          </Text>
                          <Tag
                            style={{
                              margin: 0,
                              borderRadius: 999,
                              padding: "5px 10px",
                              background: tone.background,
                              color: tone.color,
                              borderColor: tone.border,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {formatPriorityLabel(item.priority)}
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ display: "block", marginTop: 4 }}>
                          {item.country?.name || "All Countries"}
                        </Text>
                        <Text style={{ display: "block", marginTop: 10, color: "#475569" }}>
                          {item.description || "Tidak ada deskripsi tambahan."}
                        </Text>
                        <Text type="secondary" style={{ display: "block", marginTop: 12 }}>
                          {formatShortDate(item.updated_at || item.created_at)}
                        </Text>
                      </div>
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
