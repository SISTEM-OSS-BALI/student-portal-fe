"use client";

import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  AlertOutlined,
  AuditOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DownOutlined,
  FileDoneOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  TeamOutlined,
  TranslationOutlined,
} from "@ant-design/icons";
import {
  Button,
  Dropdown,
  Empty,
  Segmented,
  Select,
  Space,
  Tag,
  Typography,
} from "antd";

import LoadingSplash from "@/app/components/common/loading";
import PageHeader from "@/app/components/common/page-header";
import AppButton from "@/app/components/common/app-button";
import StudentPipelineTable from "@/app/components/common/student-pipeline-table";
import api from "@/lib/api";
import { useAuth } from "@/app/utils/use-auth";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useDocumentTranslations } from "@/app/hooks/use-document-translations";
import { useInformationCountries } from "@/app/hooks/use-information-country-management";
import { useVisaTypes } from "@/app/hooks/use-visa-type-management";
import { useUserRoleStudents } from "@/app/hooks/use-users";
import type { AnswerApprovalsDataModel } from "@/app/models/answer-approvals";
import type { InformationCountryDataModel } from "@/app/models/information-country-management";
import type { UserDataModel } from "@/app/models/user";
import {
  getCountryBadgeMeta,
  getCountryName as getCountryNameHelper,
  getCurrentStepLabel as getCurrentStepLabelHelper,
  getStudentPipelineStatus,
} from "@/app/utils/student-helpers";
import styles from "./home.module.css";

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
  icon: ReactNode;
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
  const c = getCountryNameHelper(student);
  return c !== "-" ? c : "Unknown";
}

function getCurrentStepLabel(student: UserDataModel): string {
  return getCurrentStepLabelHelper(student);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
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
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPriorityLabel(value?: string | null): string {
  switch (normalizeText(value)) {
    case "high":
      return "Prioritas Tinggi";
    case "medium":
      return "Prioritas Sedang";
    case "low":
      return "Prioritas Rendah";
    default:
      return "Prioritas Normal";
  }
}

function getPriorityTone(value?: string | null): {
  background: string;
  color: string;
  border: string;
} {
  switch (normalizeText(value)) {
    case "high":
      return {
        background: "#fff1f2",
        color: "#ef4444",
        border: "#fecdd3",
      };
    case "medium":
      return {
        background: "#fff7ed",
        color: "#d97706",
        border: "#fed7aa",
      };
    case "low":
      return {
        background: "#eff6ff",
        color: "#2563eb",
        border: "#bfdbfe",
      };
    default:
      return {
        background: "#f8fafc",
        color: "#64748b",
        border: "#cbd5e1",
      };
  }
}

function DashboardCard({
  title,
  subtitle,
  children,
  style,
  extra,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  style?: CSSProperties;
  extra?: ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.04)",
        background: "#ffffff",
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0f172a",
              margin: "0 0 3px",
              lineHeight: 1.3,
            }}
          >
            {title}
          </h2>
          <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
            {subtitle}
          </p>
        </div>
        {extra}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart: Monthly Trend Line + Area (SVG)
// ---------------------------------------------------------------------------
function MonthlyTrendLineChart({
  data,
}: {
  data: { month: string; registered: number; granted: number }[];
}) {
  const width = 560;
  const height = 200;
  const pL = 32;
  const pR = 20;
  const pT = 20;
  const pB = 28;
  const cW = width - pL - pR;
  const cH = height - pT - pB;
  const rawMax = Math.max(
    ...data.map((d) => Math.max(d.registered, d.granted)),
    4,
  );
  const maxVal = Math.max(Math.ceil(rawMax / 4) * 4, 8);
  const step = maxVal / 4;
  const yTicks = [0, step, step * 2, step * 3, maxVal];
  const stepX = data.length > 1 ? cW / (data.length - 1) : cW;

  const getXY = (index: number, value: number) => ({
    x: pL + index * stepX,
    y: pT + cH - (value / maxVal) * cH,
  });

  const regPts = data.map((d, i) => getXY(i, d.registered));
  const grantPts = data.map((d, i) => getXY(i, d.granted));

  const buildPath = (pts: { x: number; y: number }[]) =>
    pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = pts[i - 1];
      const cx = (prev.x + pt.x) / 2;
      return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
    }, "");

  const regPath = buildPath(regPts);
  const grantPath = buildPath(grantPts);
  const regArea =
    regPts.length > 0
      ? `${regPath} L ${regPts[regPts.length - 1].x} ${pT + cH} L ${regPts[0].x} ${pT + cH} Z`
      : "";
  const grantArea =
    grantPts.length > 0
      ? `${grantPath} L ${grantPts[grantPts.length - 1].x} ${pT + cH} L ${grantPts[0].x} ${pT + cH} Z`
      : "";

  return (
    <div style={{ width: "100%", height: 210 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          <linearGradient id="admissionRegGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b3d6d" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1b3d6d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="admissionGrantGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((val) => {
          const y = pT + cH - (val / maxVal) * cH;
          return (
            <g key={val}>
              <line
                x1={pL}
                y1={y}
                x2={width - pR}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={pL - 8}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontWeight="500"
              >
                {val}
              </text>
            </g>
          );
        })}

        {regArea && <path d={regArea} fill="url(#admissionRegGrad)" />}
        {grantArea && <path d={grantArea} fill="url(#admissionGrantGrad)" />}
        {regPath && (
          <path
            d={regPath}
            fill="none"
            stroke="#1b3d6d"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        {grantPath && (
          <path
            d={grantPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {data.map((d, i) => {
          const ptR = regPts[i];
          const ptG = grantPts[i];
          return (
            <g key={d.month}>
              <text
                x={ptR.x}
                y={height - 8}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
                fontWeight="600"
              >
                {d.month}
              </text>
              <circle
                cx={ptR.x}
                cy={ptR.y}
                r="4"
                fill="#fff"
                stroke="#1b3d6d"
                strokeWidth="2.5"
              />
              <circle
                cx={ptG.x}
                cy={ptG.y}
                r="4"
                fill="#fff"
                stroke="#10b981"
                strokeWidth="2.5"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chart: Country Distribution Bar (SVG)
// ---------------------------------------------------------------------------
function CountryBarChart({
  data,
}: {
  data: {
    country: string;
    code: string;
    count: number;
    color: string;
    bg: string;
    border: string;
  }[];
}) {
  const width = 420;
  const height = 200;
  const pL = 20;
  const pR = 12;
  const pT = 26;
  const pB = 34;
  const cW = width - pL - pR;
  const cH = height - pT - pB;
  const maxVal = Math.max(...data.map((d) => d.count), 4);
  const barWidth = data.length > 0 ? Math.min(36, Math.floor(cW / data.length) - 12) : 24;
  const stepX = data.length > 0 ? cW / data.length : cW;

  return (
    <div style={{ width: "100%", height: 210 }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        {[0, Math.round(maxVal / 2), maxVal].map((val) => {
          const y = pT + cH - (val / maxVal) * cH;
          return (
            <g key={val}>
              <line
                x1={pL}
                y1={y}
                x2={width - pR}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
              <text
                x={pL - 5}
                y={y + 3.5}
                textAnchor="end"
                fontSize="10"
                fill="#94a3b8"
                fontWeight="500"
              >
                {val}
              </text>
            </g>
          );
        })}

        {data.map((item, i) => {
          const x = pL + i * stepX + (stepX - barWidth) / 2;
          const barH = maxVal > 0 ? (item.count / maxVal) * cH : 0;
          const y = pT + cH - barH;
          return (
            <g key={item.code}>
              <rect
                x={x}
                y={pT}
                width={barWidth}
                height={cH}
                rx="6"
                fill="#f8fafc"
              />
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="6"
                fill={item.color}
              />
              <text
                x={x + barWidth / 2}
                y={y - 6}
                textAnchor="middle"
                fontSize="11.5"
                fill="#0f172a"
                fontWeight="700"
              >
                {item.count}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - 14}
                textAnchor="middle"
                fontSize="11"
                fill={item.color}
                fontWeight="700"
              >
                {item.code}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Admission Intelligence Center Component
// ---------------------------------------------------------------------------
export interface DashboardHomeContentProps {
  isConsultant?: boolean;
  consultantName?: string;
  title?: string;
  subtitle?: string;
  pipelinePath?: string;
  detailBasePath?: string;
}

export default function AdmissionDashboardHomeContent({
  isConsultant: isConsultantProp = false,
  consultantName,
  title,
  subtitle,
  pipelinePath = "/admission/dashboard/students-management",
  detailBasePath = "/admission/dashboard/students-management/detail",
}: DashboardHomeContentProps = {}) {
  const router = useRouter();
  const { user_name, role: userRole } = useAuth();
  const isConsultant =
    isConsultantProp || userRole?.toUpperCase() === "CONSULTANT";
  const effectiveConsultantName = (
    consultantName ||
    user_name ||
    ""
  ).trim();
  const [timeRange, setTimeRange] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => new Date());
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastUpdateFilter, setLastUpdateFilter] = useState<string>("all");

  // Generate 12 months for dropdown (current month down to 11 months ago)
  const monthOptions = useMemo(() => {
    const opts: { label: string; value: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      const value = `${d.getFullYear()}-${d.getMonth()}`;
      opts.push({ label, value });
    }
    return opts;
  }, []);

  const isLatestMonth = useMemo(() => {
    const now = new Date();
    return (
      selectedMonth.getFullYear() === now.getFullYear() &&
      selectedMonth.getMonth() === now.getMonth()
    );
  }, [selectedMonth]);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setTimeRange("month");
  };

  const handleNextMonth = () => {
    if (isLatestMonth) return;
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setTimeRange("month");
  };

  const { data: students = [], fetchLoading: studentsLoading } =
    useUserRoleStudents({
      consultant:
        isConsultant && effectiveConsultantName
          ? effectiveConsultantName
          : undefined,
    });
  const { data: answerApprovals = [], fetchLoading: approvalsLoading } =
    useAnswerApprovals();
  const { data: informationUpdates = [], fetchLoading: informationLoading } =
    useInformationCountries({});
  const { data: visaTypes = [] } = useVisaTypes();

  const { data: cvDocuments = [], isLoading: cvLoading } = useQuery({
    queryKey: ["generated-cv-ai-documents", "dashboard"],
    queryFn: async () => {
      const result = await api.get("/api/generate-cv-ai/documents");
      const payload = (result.data?.result ??
        result.data) as GeneratedDocModel[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  const { data: statementDocuments = [], isLoading: statementLoading } =
    useQuery({
      queryKey: ["generated-statement-letter-ai-documents", "dashboard"],
      queryFn: async () => {
        const result = await api.get(
          "/api/generate-statement-letter-ai/documents",
        );
        const payload = (result.data?.result ??
          result.data) as GeneratedDocModel[];
        return Array.isArray(payload) ? payload : [];
      },
    });

  const { data: sponsorDocuments = [], isLoading: sponsorLoading } = useQuery({
    queryKey: ["generated-sponsor-letter-ai-documents", "dashboard"],
    queryFn: async () => {
      const result = await api.get("/api/generate-sponsor-letter-ai/documents");
      const payload = (result.data?.result ??
        result.data) as GeneratedDocModel[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  const isLoading =
    studentsLoading ||
    approvalsLoading ||
    informationLoading ||
    cvLoading ||
    statementLoading ||
    sponsorLoading;

  const visaTypeNameById = useMemo(() => {
    return new Map(
      visaTypes.map((item) => [String(item.id), String(item.name ?? "").trim()]),
    );
  }, [visaTypes]);

  const activeStudents = useMemo(() => {
    const list = students.filter(
      (student) => String(student.role ?? "").toUpperCase() === "STUDENT",
    );
    if (isConsultant && effectiveConsultantName) {
      const cName = normalizeText(effectiveConsultantName);
      return list.filter((student) => {
        const sConsultant = normalizeText(student.name_consultant);
        if (!sConsultant) return false;
        return (
          sConsultant === cName ||
          cName.split(/\s+/)[0] === sConsultant.split(/\s+/)[0] ||
          cName.includes(sConsultant) ||
          sConsultant.includes(cName)
        );
      });
    }
    return list;
  }, [students, isConsultant, effectiveConsultantName]);

  const activeStudentIdSet = useMemo(() => {
    return new Set(activeStudents.map((s) => String(s.id)));
  }, [activeStudents]);

  const filteredAnswerApprovals = useMemo(() => {
    if (!isConsultant) return answerApprovals;
    return answerApprovals.filter((item: AnswerApprovalsDataModel) =>
      item.student_id ? activeStudentIdSet.has(String(item.student_id)) : false,
    );
  }, [answerApprovals, isConsultant, activeStudentIdSet]);

  const filteredCvDocuments = useMemo(() => {
    if (!isConsultant) return cvDocuments;
    return cvDocuments.filter((doc) =>
      doc.student_id ? activeStudentIdSet.has(String(doc.student_id)) : false,
    );
  }, [cvDocuments, isConsultant, activeStudentIdSet]);

  const filteredStatementDocuments = useMemo(() => {
    if (!isConsultant) return statementDocuments;
    return statementDocuments.filter((doc) =>
      doc.student_id ? activeStudentIdSet.has(String(doc.student_id)) : false,
    );
  }, [statementDocuments, isConsultant, activeStudentIdSet]);

  const filteredSponsorDocuments = useMemo(() => {
    if (!isConsultant) return sponsorDocuments;
    return sponsorDocuments.filter((doc) =>
      doc.student_id ? activeStudentIdSet.has(String(doc.student_id)) : false,
    );
  }, [sponsorDocuments, isConsultant, activeStudentIdSet]);

  // Filter students based on period selector
  const displayedActiveStudents = useMemo(() => {
    if (timeRange === "month") {
      const targetYear = selectedMonth.getFullYear();
      const targetMonth = selectedMonth.getMonth();
      return activeStudents.filter((s) => {
        const dateStr = s.joined_at || s.created_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return (
          !Number.isNaN(d.getTime()) &&
          d.getFullYear() === targetYear &&
          d.getMonth() === targetMonth
        );
      });
    }
    if (timeRange === "quarter") {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentQuarter = Math.floor(now.getMonth() / 3);
      return activeStudents.filter((s) => {
        const dateStr = s.joined_at || s.created_at;
        if (!dateStr) return false;
        const d = new Date(dateStr);
        return (
          !Number.isNaN(d.getTime()) &&
          d.getFullYear() === currentYear &&
          Math.floor(d.getMonth() / 3) === currentQuarter
        );
      });
    }
    return activeStudents;
  }, [activeStudents, timeRange, selectedMonth]);

  // KPI 1: Pipeline statistics
  const pipelineStats = useMemo(() => {
    let ongoing = 0;
    let waitingVisa = 0;
    let completed = 0;
    let postpone = 0;
    let cancel = 0;

    displayedActiveStudents.forEach((s) => {
      const raw = normalizeText(s.student_status);
      if (raw.includes("cancel")) cancel += 1;
      else if (raw.includes("postpone") || raw.includes("pending")) postpone += 1;
      else if (
        raw.includes("waiting visa") ||
        raw.includes("proses visa") ||
        raw.includes("lodge")
      )
        waitingVisa += 1;
      else if (raw.includes("complete") || raw.includes("done")) completed += 1;
      else ongoing += 1;
    });

    return {
      total: displayedActiveStudents.length,
      ongoing,
      waitingVisa,
      completed,
      postpone,
      cancel,
    };
  }, [displayedActiveStudents]);

  // KPI 2: Pending Document & Answer Verifications
  const pendingApprovalsCount = useMemo(() => {
    const pendingAnswers = filteredAnswerApprovals.filter(
      (item: AnswerApprovalsDataModel) =>
        normalizeText(item.status || "pending") === "pending",
    ).length;

    const approvedAnswers = filteredAnswerApprovals.filter(
      (item: AnswerApprovalsDataModel) =>
        normalizeText(item.status) === "approved",
    ).length;

    return {
      total: pendingAnswers,
      pending: pendingAnswers,
      approved: approvedAnswers,
    };
  }, [filteredAnswerApprovals]);

  // KPI 3: AI Documents Pending Review / Submission
  const pendingAiDocsCount = useMemo(() => {
    const cvPending = filteredCvDocuments.filter((doc) => {
      const status = normalizeText(doc.status);
      return (
        !status ||
        status === "draft" ||
        status === "submitted_to_director" ||
        status === "revision_requested"
      );
    }).length;

    const lettersWaitingDirector = [
      ...filteredStatementDocuments,
      ...filteredSponsorDocuments,
    ].filter((doc) => {
      const status = normalizeText(doc.status);
      return (
        status === "submitted_to_director" ||
        status === "revision_requested" ||
        status === "draft"
      );
    }).length;

    return {
      total: cvPending + lettersWaitingDirector,
      cv: cvPending,
      letters: lettersWaitingDirector,
    };
  }, [filteredCvDocuments, filteredSponsorDocuments, filteredStatementDocuments]);

  // KPI 4: Translation Quota Monitoring
  const translationStats = useMemo(() => {
    const studentsNeeding = displayedActiveStudents.filter(
      (student) => Number(student.translation_quota ?? 0) > 0,
    );

    const totalRemainingPages = studentsNeeding.reduce(
      (acc, s) => acc + Number(s.translation_quota ?? 0),
      0,
    );

    return {
      studentsCount: studentsNeeding.length,
      totalRemainingPages,
    };
  }, [displayedActiveStudents]);

  // Subtitles with professional, consistent UX writing (fixed length to prevent layout shifts)
  const trendSubtitle =
    timeRange === "quarter"
      ? "Aktivitas pendaftaran dan kelolosan visa kuartal ini"
      : timeRange === "month"
        ? "Aktivitas pendaftaran dan kelolosan visa bulan ini"
        : "Aktivitas pendaftaran dan kelolosan visa";
  const countrySubtitle = "Sebaran siswa berdasarkan destinasi studi";

  // Monthly trend chart data: Pendaftaran Siswa vs Kelolosan Visa (konsisten dengan Director)
  const monthlyTrendData = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (timeRange === "month") {
      const targetYear = selectedMonth.getFullYear();
      const targetMonth = selectedMonth.getMonth();

      // 4 minggu dalam bulan yang dipilih
      const weeks = [
        { label: "Mgg 1", start: 1, end: 7 },
        { label: "Mgg 2", start: 8, end: 14 },
        { label: "Mgg 3", start: 15, end: 21 },
        { label: "Mgg 4", start: 22, end: 31 },
      ];

      const regCounts = [0, 0, 0, 0];
      const grantCounts = [0, 0, 0, 0];

      activeStudents.forEach((s) => {
        const dateStr = s.joined_at || s.created_at;
        if (dateStr) {
          const d = new Date(dateStr);
          if (
            !Number.isNaN(d.getTime()) &&
            d.getFullYear() === targetYear &&
            d.getMonth() === targetMonth
          ) {
            const day = d.getDate();
            if (day <= 7) regCounts[0] += 1;
            else if (day <= 14) regCounts[1] += 1;
            else if (day <= 21) regCounts[2] += 1;
            else regCounts[3] += 1;
          }
        }

        if (s.visa_granted_at) {
          const d = new Date(s.visa_granted_at);
          if (
            !Number.isNaN(d.getTime()) &&
            d.getFullYear() === targetYear &&
            d.getMonth() === targetMonth
          ) {
            const day = d.getDate();
            if (day <= 7) grantCounts[0] += 1;
            else if (day <= 14) grantCounts[1] += 1;
            else if (day <= 21) grantCounts[2] += 1;
            else grantCounts[3] += 1;
          }
        }
      });

      return weeks.map((w, idx) => ({
        month: w.label,
        registered: regCounts[idx],
        granted: grantCounts[idx],
      }));
    }

    if (timeRange === "quarter") {
      // 3 bulan dalam kuartal berjalan
      const currentQuarter = Math.floor(currentMonth / 3);
      const startQuarterMonth = currentQuarter * 3;
      const quarterMonths: {
        month: string;
        year: number;
        monthIndex: number;
      }[] = [];

      for (let i = 0; i < 3; i++) {
        const mIdx = startQuarterMonth + i;
        const d = new Date(currentYear, mIdx, 1);
        quarterMonths.push({
          month: d.toLocaleDateString("id-ID", { month: "short" }),
          year: currentYear,
          monthIndex: mIdx,
        });
      }

      const regMap = new Map<number, number>();
      const grantMap = new Map<number, number>();

      activeStudents.forEach((s) => {
        const dateStr = s.joined_at || s.created_at;
        if (dateStr) {
          const d = new Date(dateStr);
          if (
            !Number.isNaN(d.getTime()) &&
            d.getFullYear() === currentYear &&
            Math.floor(d.getMonth() / 3) === currentQuarter
          ) {
            regMap.set(d.getMonth(), (regMap.get(d.getMonth()) ?? 0) + 1);
          }
        }

        if (s.visa_granted_at) {
          const d = new Date(s.visa_granted_at);
          if (
            !Number.isNaN(d.getTime()) &&
            d.getFullYear() === currentYear &&
            Math.floor(d.getMonth() / 3) === currentQuarter
          ) {
            grantMap.set(d.getMonth(), (grantMap.get(d.getMonth()) ?? 0) + 1);
          }
        }
      });

      return quarterMonths.map(({ month, monthIndex }) => ({
        month,
        registered: regMap.get(monthIndex) ?? 0,
        granted: grantMap.get(monthIndex) ?? 0,
      }));
    }

    // Default: Semua Periode (6 bulan terakhir)
    const months: { month: string; year: number; monthIndex: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.toLocaleDateString("id-ID", { month: "short" }),
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
      });
    }

    const regMap = new Map<string, number>();
    const grantMap = new Map<string, number>();

    activeStudents.forEach((s) => {
      const dateStr = s.joined_at || s.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!Number.isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          regMap.set(key, (regMap.get(key) ?? 0) + 1);
        }
      }
      if (s.visa_granted_at) {
        const d = new Date(s.visa_granted_at);
        if (!Number.isNaN(d.getTime())) {
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          grantMap.set(key, (grantMap.get(key) ?? 0) + 1);
        }
      }
    });

    return months.map(({ month, year, monthIndex }) => {
      const key = `${year}-${monthIndex}`;
      return {
        month,
        registered: regMap.get(key) ?? 0,
        granted: grantMap.get(key) ?? 0,
      };
    });
  }, [activeStudents, timeRange, selectedMonth]);

  // Country bar chart data
  const countryBarData = useMemo(() => {
    const map = new Map<
      string,
      {
        country: string;
        code: string;
        count: number;
        color: string;
        bg: string;
        border: string;
      }
    >();

    displayedActiveStudents.forEach((s) => {
      const country = getCountryName(s);
      if (!country || country === "Unknown" || country === "-") return;
      const meta = getCountryBadgeMeta(country);
      if (!map.has(country)) {
        map.set(country, {
          country,
          code: meta.code,
          count: 0,
          color: meta.color,
          bg: meta.bg,
          border: meta.border,
        });
      }
      map.get(country)!.count += 1;
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [displayedActiveStudents]);

  // Consultant summary for inline row
  const consultantSummary = useMemo(() => {
    const map = new Map<string, number>();
    displayedActiveStudents.forEach((s) => {
      const name = String(s.name_consultant || "Tanpa Konsultan").trim();
      map.set(name, (map.get(name) ?? 0) + 1);
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);
  }, [displayedActiveStudents]);

  // Filter options
  const countryOptions = useMemo(
    () =>
      Array.from(new Set(displayedActiveStudents.map((s) => getCountryName(s))))
        .filter((c) => c && c !== "Unknown" && c !== "-")
        .sort((a, b) => a.localeCompare(b)),
    [displayedActiveStudents],
  );

  const stepOptions = useMemo(
    () =>
      Array.from(
        new Set(displayedActiveStudents.map((s) => getCurrentStepLabel(s))),
      )
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b)),
    [displayedActiveStudents],
  );

  const lastActivityByStudent = useMemo(() => {
    const result: Record<string, number> = {};
    const setLatestTime = (studentId: string, value?: string | null) => {
      if (!value) return;
      const ts = new Date(value).getTime();
      if (Number.isNaN(ts)) return;
      if (!result[studentId] || ts > result[studentId]) result[studentId] = ts;
    };

    displayedActiveStudents.forEach((s) => {
      const key = String(s.id);
      setLatestTime(key, s.updated_at);
      setLatestTime(key, s.student_status_updated_at);
      setLatestTime(key, s.visa_granted_at);
    });

    filteredAnswerApprovals.forEach((item) => {
      setLatestTime(
        String(item.student_id),
        item.reviewed_at ?? item.updated_at ?? item.created_at,
      );
    });

    return result;
  }, [displayedActiveStudents, filteredAnswerApprovals]);

  const pipelineStudents = useMemo(() => {
    return displayedActiveStudents.filter((s) => {
      const country = getCountryName(s);
      const step = getCurrentStepLabel(s);
      const status = getStudentPipelineStatus(s).label;
      const lastActivityAt = lastActivityByStudent[String(s.id)];

      if (countryFilter !== "all" && country !== countryFilter) return false;
      if (stepFilter !== "all" && step !== stepFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (lastUpdateFilter !== "all") {
        if (!lastActivityAt) return false;
        const ageMs = Date.now() - lastActivityAt;
        if (lastUpdateFilter === "today" && ageMs > 24 * 60 * 60 * 1000)
          return false;
        if (lastUpdateFilter === "7d" && ageMs > 7 * 24 * 60 * 60 * 1000)
          return false;
        if (lastUpdateFilter === "30d" && ageMs > 30 * 24 * 60 * 60 * 1000)
          return false;
      }
      return true;
    });
  }, [
    displayedActiveStudents,
    countryFilter,
    lastActivityByStudent,
    lastUpdateFilter,
    statusFilter,
    stepFilter,
  ]);

  // Operational activity items
  const recentActivities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];
    const studentNameMap = new Map(
      activeStudents.map((s) => [String(s.id), String(s.name ?? "Siswa")]),
    );

    filteredAnswerApprovals.forEach((item) => {
      const studentName = studentNameMap.get(String(item.student_id)) || "Siswa";
      const normalizedStatus = normalizeText(item.status);
      const isApproved = normalizedStatus === "approved";
      const isRejected = normalizedStatus === "rejected";

      const title = isApproved
        ? `Berkas ${studentName} disetujui`
        : isRejected
          ? `Berkas ${studentName} memerlukan revisi`
          : `Pembaruan berkas ${studentName}`;

      const subtitle =
        item.note ||
        (isApproved
          ? "Verifikasi berkas formulir disetujui"
          : "Verifikasi berkas formulir diperbarui");

      items.push({
        id: `approval-${item.id}`,
        time: formatDateTime(
          item.reviewed_at ?? item.updated_at ?? item.created_at,
        ),
        sortTime: String(
          item.reviewed_at ?? item.updated_at ?? item.created_at ?? "",
        ),
        title,
        subtitle,
        actor: isConsultant ? "Konsultan" : "Admission",
        actorColor: isApproved ? "#16a34a" : isRejected ? "#ef4444" : "#2563eb",
        icon: <FileDoneOutlined />,
      });
    });

    activeStudents.forEach((student) => {
      if (student.student_status) {
        const rawStatus = String(student.student_status)
          .replace(/_/g, " ")
          .trim()
          .toLowerCase();
        const formattedStatus = rawStatus.replace(/\b\w/g, (char) =>
          char.toUpperCase(),
        );

        items.push({
          id: `status-${student.id}`,
          time: formatDateTime(
            student.student_status_updated_at ?? student.updated_at,
          ),
          sortTime: String(
            student.student_status_updated_at ?? student.updated_at ?? "",
          ),
          title: `Tahapan ${student.name} diperbarui menjadi ${formattedStatus}`,
          subtitle: student.name_consultant
            ? `Konsultan ${student.name_consultant}`
            : "Konsultan belum ditentukan",
          actor: student.student_status_updated_by_name || (isConsultant ? "Konsultan" : "Admission"),
          actorColor: "#2563eb",
          icon: <AlertOutlined />,
        });
      }
    });

    return items
      .sort(
        (a, b) =>
          new Date(b.sortTime).getTime() - new Date(a.sortTime).getTime(),
      )
      .slice(0, 6);
  }, [activeStudents, filteredAnswerApprovals, isConsultant]);

  const importantUpdates = useMemo(() => {
    return [...informationUpdates]
      .sort((a, b) => {
        const priorityCompare =
          (priorityOrder[normalizeText(a.priority)] ?? 99) -
          (priorityOrder[normalizeText(b.priority)] ?? 99);

        if (priorityCompare !== 0) {
          return priorityCompare;
        }

        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      })
      .slice(0, 4);
  }, [informationUpdates]);

  if (isLoading) {
    return (
      <LoadingSplash
        label={
          isConsultant
            ? "Memuat Consultant Operations Center..."
            : "Memuat Admission Operations Center..."
        }
      />
    );
  }

  return (
    <div className={styles.page}>
      {/* Executive Header Banner with Period Switcher */}
      <PageHeader
        title={
          title ??
          (isConsultant ? "Consultant Operations" : "Admission Operations")
        }
        subtitle={
          subtitle ??
          (isConsultant
            ? "Pantau pipeline siswa dan progres berkas dampingan"
            : "Pantau pipeline siswa dan progres berkas")
        }
        icon={<DashboardOutlined />}
      >
        <Segmented
          size="small"
          value={timeRange}
          onChange={(val) => setTimeRange(String(val))}
          options={[
            { label: "All", value: "all" },
            { label: "Monthly", value: "month" },
            { label: "Quartal", value: "quarter" },
          ]}
          className={styles.periodSegmented}
        />
      </PageHeader>

      {/* ── SECTION 1: Connected 4-Column KPI Strip (Director-Style) ── */}
      <div
        className={`${styles.kpiStrip} ${isConsultant ? styles.kpiStripConsultant : ""}`}
      >
        {/* KPI 1: Pipeline Siswa */}
        <div className={styles.kpiItem}>
          <div className={styles.kpiLabel}>
            <span>{isConsultant ? "My Students" : "Total Students"}</span>
            <TeamOutlined style={{ color: "#1d4ed8", fontSize: 15 }} />
          </div>
          <div className={styles.kpiValue}>{pipelineStats.total}</div>
          <div className={styles.kpiSub}>
            <span style={{ color: "#16a34a", fontWeight: 600 }}>
              {pipelineStats.ongoing} Ongoing
            </span>
            <span className={styles.kpiDot}>·</span>
            <span style={{ color: "#0284c7", fontWeight: 600 }}>
              {pipelineStats.waitingVisa} Waiting Visa
            </span>
          </div>
        </div>

        {!isConsultant && (
          <>
            {/* KPI 2: Antrean Verifikasi Berkas */}
            <div className={styles.kpiItem}>
              <div className={styles.kpiLabel}>
                <span>Document Verification</span>
                <FileDoneOutlined style={{ color: "#2563eb", fontSize: 15 }} />
              </div>
              <div className={styles.kpiValue}>{pendingApprovalsCount.total}</div>
              <div className={styles.kpiSub}>
                <span style={{ color: "#ea580c", fontWeight: 600 }}>
                  {pendingApprovalsCount.pending} Pending
                </span>
                <span className={styles.kpiDot}>·</span>
                <span style={{ color: "#16a34a", fontWeight: 600 }}>
                  {pendingApprovalsCount.approved} Approved
                </span>
              </div>
            </div>

            {/* KPI 3: Draf Dokumen AI & Direktur */}
            <div className={styles.kpiItem}>
              <div className={styles.kpiLabel}>
                <span>Document Review</span>
                <FileTextOutlined style={{ color: "#d97706", fontSize: 15 }} />
              </div>
              <div className={styles.kpiValue}>{pendingAiDocsCount.total}</div>
              <div className={styles.kpiSub}>
                <span>{pendingAiDocsCount.letters} AI Letters</span>
                <span className={styles.kpiDot}>·</span>
                <span>{pendingAiDocsCount.cv} AI CVs</span>
              </div>
            </div>
          </>
        )}

        {/* KPI 4: Monitoring Kuota Translasi */}
        <div className={styles.kpiItem}>
          <div className={styles.kpiLabel}>
            <span>Translation Quota</span>
            <TranslationOutlined style={{ color: "#9333ea", fontSize: 15 }} />
          </div>
          <div className={styles.kpiValue}>
            {translationStats.studentsCount}
            <span
              style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}
            >
              {" "}
              students
            </span>
          </div>
          <div
            className={styles.kpiSub}
            style={{ color: "#9333ea", fontWeight: 600 }}
          >
            {translationStats.totalRemainingPages} pages pending
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Side-by-Side SVG Charts ── */}
      <div className={styles.chartsGrid}>
        {/* Chart Left: Trend Line & Area */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <h3 className={styles.chartTitle}>
                Registration Trends
              </h3>
              <p className={styles.chartSubtitle}>{trendSubtitle}</p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                flexWrap: "nowrap",
                flexShrink: 0,
                marginLeft: "auto",
              }}
            >
              {/* Permanent Aesthetic Month Stepper on Chart Card */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  padding: "2px",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.04)",
                  height: 30,
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  title="Bulan sebelumnya"
                  style={{
                    width: 24,
                    height: 24,
                    border: "none",
                    background: "transparent",
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#64748b",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#64748b";
                  }}
                >
                  <LeftOutlined style={{ fontSize: 10 }} />
                </button>

                <Dropdown
                  menu={{
                    items: monthOptions.map((opt) => ({
                      key: opt.value,
                      label: opt.label,
                      onClick: () => {
                        const [y, m] = opt.value.split("-").map(Number);
                        setSelectedMonth(new Date(y, m, 1));
                        setTimeRange("month");
                      },
                    })),
                    selectedKeys: [
                      `${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}`,
                    ],
                  }}
                  trigger={["click"]}
                  placement="bottomCenter"
                >
                  <button
                    type="button"
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: "0 8px",
                      height: 24,
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1e293b",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#f1f5f9";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>
                      {selectedMonth.toLocaleDateString("id-ID", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <DownOutlined style={{ fontSize: 8, color: "#94a3b8" }} />
                  </button>
                </Dropdown>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  disabled={isLatestMonth}
                  title="Bulan berikutnya"
                  style={{
                    width: 24,
                    height: 24,
                    border: "none",
                    background: "transparent",
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: isLatestMonth ? "not-allowed" : "pointer",
                    color: isLatestMonth ? "#cbd5e1" : "#64748b",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLatestMonth) {
                      e.currentTarget.style.background = "#f1f5f9";
                      e.currentTarget.style.color = "#0f172a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = isLatestMonth
                      ? "#cbd5e1"
                      : "#64748b";
                  }}
                >
                  <RightOutlined style={{ fontSize: 10 }} />
                </button>
              </div>
            </div>
          </div>
          <MonthlyTrendLineChart data={monthlyTrendData} />

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 20,
              paddingTop: 10,
              borderTop: "1px solid #f1f5f9",
              marginTop: 6,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#1b3d6d",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#334155", fontWeight: 600, fontSize: 12 }}>
                Registration
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />
              <span style={{ color: "#334155", fontWeight: 600, fontSize: 12 }}>
                Visa Granted
              </span>
            </div>
          </div>
        </div>

        {/* Chart Right: Country Distribution Bar */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <h3 className={styles.chartTitle}>Destination Countries</h3>
              <p className={styles.chartSubtitle}>{countrySubtitle}</p>
            </div>
            <Tag
              style={{
                margin: 0,
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 11,
                marginLeft: "auto",
                flexShrink: 0,
              }}
            >
              {countryBarData.length} Negara
            </Tag>
          </div>
          <CountryBarChart data={countryBarData} />
        </div>
      </div>

      {/* ── SECTION 3: Standard Pipeline Table & Operational Controls ── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderRow}>
          <div>
            <h3 className={styles.tableTitle}>Student Pipeline</h3>
            <p className={styles.tableSub}>
              {pipelineStudents.length} siswa ditampilkan
            </p>
          </div>
          <AppButton
            variant="primary"
            icon={<FolderOpenOutlined />}
            onClick={() => router.push(pipelinePath)}
          >
            Buka
          </AppButton>
        </div>

        {/* Inline Summary Row: Konsultan Aktif + Beban Kerja */}
        <div className={styles.inlineSummaryRow}>
          <div className={styles.inlineSummaryBlock}>
            <span className={styles.inlineSummaryLabel}>
              {isConsultant ? "Konsultan Dampingan" : "Konsultan Aktif"}
            </span>
            {isConsultant ? (
              <span className={styles.summaryPill}>
                {effectiveConsultantName || "Konsultan"}{" "}
                <strong>{pipelineStudents.length} Siswa</strong>
              </span>
            ) : consultantSummary.length ? (
              consultantSummary.map((c) => (
                <span key={c.name} className={styles.summaryPill}>
                  {c.name} <strong>{c.count}</strong>
                </span>
              ))
            ) : (
              <span className={styles.summaryPill}>Belum ada data</span>
            )}
          </div>

          <div className={styles.inlineSummaryDivider} />

          <div className={styles.inlineSummaryBlock}>
            <span className={styles.inlineSummaryLabel}>Beban Verifikasi</span>
            <span className={styles.summaryPill}>
              Berkas Pending{" "}
              <strong style={{ color: "#ea580c" }}>
                {pendingApprovalsCount.pending}
              </strong>
            </span>
            <span className={styles.summaryPill}>
              Perlu Translasi{" "}
              <strong style={{ color: "#9333ea" }}>
                {translationStats.studentsCount} Siswa
              </strong>
            </span>
            <span className={styles.summaryPill}>
              Surat AI{" "}
              <strong style={{ color: "#2563eb" }}>
                {pendingAiDocsCount.letters}
              </strong>
            </span>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <Select
            value={countryFilter}
            onChange={setCountryFilter}
            style={{ minWidth: 150 }}
            options={[
              { value: "all", label: "Semua Negara" },
              ...countryOptions.map((item) => ({
                value: item,
                label: item,
              })),
            ]}
          />

          <Select
            value={stepFilter}
            onChange={setStepFilter}
            style={{ minWidth: 140 }}
            options={[
              { value: "all", label: "Semua Step" },
              ...stepOptions.map((item) => ({ value: item, label: item })),
            ]}
          />

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ minWidth: 150 }}
            options={[
              { value: "all", label: "Semua Status" },
              { value: "On Progress", label: "On Progress" },
              { value: "Waiting Visa", label: "Waiting Visa" },
              { value: "On Hold", label: "On Hold" },
              { value: "Completed", label: "Completed" },
              { value: "Cancel", label: "Cancel" },
            ]}
          />

          <Select
            value={lastUpdateFilter}
            onChange={setLastUpdateFilter}
            style={{ minWidth: 150 }}
            options={[
              { value: "all", label: "Semua Pembaruan" },
              { value: "today", label: "Diperbarui Hari Ini" },
              { value: "7d", label: "7 Hari Terakhir" },
              { value: "30d", label: "30 Hari Terakhir" },
            ]}
          />
        </div>

        {/* Shared Standard Student Pipeline Table */}
        <StudentPipelineTable
          students={pipelineStudents}
          role={isConsultant ? "consultant" : "admission"}
          lastActivityMap={lastActivityByStudent}
          visaTypeNameById={visaTypeNameById}
        />
      </div>

      {/* ── SECTION 4: Operational Log & Important Notes ── */}
      <div className={styles.gridActivities}>
        {/* Left: Recent Activity Log */}
        <DashboardCard
          title="Recent Activities"
          subtitle="Catatan riwayat pendaftaran dan pembaruan berkas terbaru"
        >
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            {recentActivities.length ? (
              recentActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: "#fff",
                        border: "2px solid #dbeafe",
                        color: activity.actorColor,
                        display: "grid",
                        placeItems: "center",
                        fontSize: 16,
                      }}
                    >
                      {activity.icon}
                    </div>

                    {index < recentActivities.length - 1 && (
                      <div
                        style={{
                          width: 2,
                          height: 42,
                          background: "#e2e8f0",
                        }}
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, paddingTop: 2 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <Text type="secondary" style={{ fontSize: 11.5 }}>
                        {activity.time}
                      </Text>

                      <Tag
                        style={{
                          margin: 0,
                          borderRadius: 999,
                          background: `${activity.actorColor}14`,
                          color: activity.actorColor,
                          borderColor: "transparent",
                          fontSize: 10.5,
                          fontWeight: 600,
                        }}
                      >
                        {activity.actor}
                      </Tag>
                    </div>

                    <Text
                      strong
                      style={{
                        display: "block",
                        marginTop: 4,
                        fontSize: 14,
                        color: "#0f172a",
                      }}
                    >
                      {activity.title}
                    </Text>

                    <Text
                      type="secondary"
                      style={{ fontSize: 12, color: "#64748b" }}
                    >
                      {activity.subtitle}
                    </Text>
                  </div>
                </div>
              ))
            ) : (
              <Empty description="Belum ada aktivitas terbaru." />
            )}
          </Space>
        </DashboardCard>

        {/* Right: Important Notes & Country Updates */}
        <DashboardCard
          title="Country Regulations"
          subtitle="Pengumuman penting dan regulasi visa per negara"
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
                      borderRadius: 12,
                      padding: 14,
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "#eff6ff",
                          color: "#2563eb",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 17,
                          flexShrink: 0,
                        }}
                      >
                        <InfoCircleOutlined />
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "flex-start",
                          }}
                        >
                          <Text
                            strong
                            style={{
                              fontSize: 13.5,
                              color: "#0f172a",
                              lineHeight: 1.3,
                            }}
                          >
                            {item.title}
                          </Text>

                          <Tag
                            style={{
                              margin: 0,
                              borderRadius: 999,
                              padding: "2px 8px",
                              background: tone.background,
                              color: tone.color,
                              borderColor: tone.border,
                              whiteSpace: "nowrap",
                              fontSize: 10.5,
                              fontWeight: 600,
                            }}
                          >
                            {formatPriorityLabel(item.priority)}
                          </Tag>
                        </div>

                        <Text
                          type="secondary"
                          style={{
                            display: "block",
                            marginTop: 2,
                            fontSize: 11.5,
                          }}
                        >
                          {item.country?.name || "Semua Negara"}
                        </Text>

                        <Text
                          style={{
                            display: "block",
                            marginTop: 6,
                            color: "#475569",
                            fontSize: 12,
                            lineHeight: 1.45,
                          }}
                        >
                          {item.description ||
                            "Tidak ada deskripsi tambahan."}
                        </Text>

                        <Text
                          type="secondary"
                          style={{
                            display: "block",
                            marginTop: 8,
                            fontSize: 11,
                          }}
                        >
                          {formatShortDate(
                            item.updated_at || item.created_at,
                          )}
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
