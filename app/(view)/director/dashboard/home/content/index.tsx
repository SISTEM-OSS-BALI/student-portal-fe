"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuditOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  DownOutlined,
  FolderOpenOutlined,
  LeftOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Dropdown,
  Empty,
  Segmented,
  Select,
  Tag,
  Tooltip,
  Typography,
} from "antd";

import LoadingSplash from "@/app/components/common/loading";
import PageHeader from "@/app/components/common/page-header";
import AppButton from "@/app/components/common/app-button";
import { useAnswerApprovals } from "@/app/hooks/use-answer-approvals";
import { useVisaTypes } from "@/app/hooks/use-visa-type-management";
import { useSponsorLetterAiApprovals } from "@/app/hooks/use-sponsor-letter-ai-approvals";
import { useStatementLetterAiApprovals } from "@/app/hooks/use-statement-letter-ai-approvals";
import { useUserRoleStudents } from "@/app/hooks/use-users";
import StudentPipelineTable from "@/app/components/common/student-pipeline-table";
import type { AnswerApprovalsDataModel } from "@/app/models/answer-approvals";
import type { UserDataModel } from "@/app/models/user";
import {
  getCountryBadgeMeta,
  getCountryName as getCountryNameHelper,
  getCurrentStepLabel as getCurrentStepLabelHelper,
  getStepTone,
  getStudentAvatarUrl,
  getStudentPipelineStatus,
} from "@/app/utils/student-helpers";
import styles from "./home.module.css";

const { Text } = Typography;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function getCountryName(student: UserDataModel): string {
  const c = getCountryNameHelper(student);
  return c !== "-" ? c : "Unknown";
}

function normalizeLeadSource(value?: string | null): string {
  const source = normalizeText(value);
  if (["instagram", "facebook", "tiktok", "walkin", "website", "referral", "other"].includes(source)) {
    return source;
  }
  return "other";
}

function formatLeadSourceLabel(value: string): string {
  switch (normalizeText(value)) {
    case "instagram": return "Instagram";
    case "facebook": return "Facebook";
    case "tiktok": return "TikTok";
    case "walkin": return "Walk-in";
    case "website": return "Website";
    case "referral": return "Referral Partner";
    default: return "Direct / Other";
  }
}

function getCurrentStepLabel(student: UserDataModel): string {
  return getCurrentStepLabelHelper(student);
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
  return date.toLocaleDateString("id-ID", { month: "short", day: "numeric", year: "numeric" });
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
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1b3d6d" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#1b3d6d" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="grantGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((val) => {
          const y = pT + cH - (val / maxVal) * cH;
          return (
            <g key={val}>
              <line x1={pL} y1={y} x2={width - pR} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <text x={pL - 8} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="500">{val}</text>
            </g>
          );
        })}

        <path d={regArea} fill="url(#regGrad)" />
        <path d={grantArea} fill="url(#grantGrad)" />
        <path d={regPath} fill="none" stroke="#1b3d6d" strokeWidth="2.5" strokeLinecap="round" />
        <path d={grantPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

        {data.map((d, i) => {
          const ptR = regPts[i];
          const ptG = grantPts[i];
          return (
            <g key={d.month}>
              <text x={ptR.x} y={height - 8} textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">
                {d.month}
              </text>
              <circle cx={ptR.x} cy={ptR.y} r="4" fill="#fff" stroke="#1b3d6d" strokeWidth="2.5" />
              <circle cx={ptG.x} cy={ptG.y} r="4" fill="#fff" stroke="#10b981" strokeWidth="2.5" />
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
  data: { country: string; code: string; count: number; color: string; bg: string; border: string }[];
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
  const barWidth = Math.min(36, Math.floor(cW / data.length) - 12);
  const stepX = cW / data.length;

  return (
    <div style={{ width: "100%", height: 210 }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
        {[0, Math.round(maxVal / 2), maxVal].map((val) => {
          const y = pT + cH - (val / maxVal) * cH;
          return (
            <g key={val}>
              <line x1={pL} y1={y} x2={width - pR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={pL - 5} y={y + 3.5} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="500">{val}</text>
            </g>
          );
        })}

        {data.map((item, i) => {
          const x = pL + i * stepX + (stepX - barWidth) / 2;
          const barH = maxVal > 0 ? (item.count / maxVal) * cH : 0;
          const y = pT + cH - barH;
          return (
            <g key={item.code}>
              <rect x={x} y={pT} width={barWidth} height={cH} rx="6" fill="#f8fafc" />
              <rect x={x} y={y} width={barWidth} height={barH} rx="6" fill={item.color} />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11.5" fill="#0f172a" fontWeight="700">
                {item.count}
              </text>
              <text x={x + barWidth / 2} y={height - 14} textAnchor="middle" fontSize="11" fill={item.color} fontWeight="700">
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
// Main Component
// ---------------------------------------------------------------------------
export default function DirectorDashboardHomeContent() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [stepFilter, setStepFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [lastUpdateFilter, setLastUpdateFilter] = useState<string>("all");
  const [leadSourceFilter, setLeadSourceFilter] = useState<string>("all");

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth();
  const selectedQuarter = Math.floor(selectedMonth / 3);

  // Generate 5 years for dropdown
  const yearOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const opts: { label: string; value: string; year: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const y = currentYear - i;
      opts.push({ label: `Tahun ${y}`, value: `${y}`, year: y });
    }
    return opts;
  }, []);

  // Generate 12 months for dropdown (current month down to 11 months ago)
  const monthOptions = useMemo(() => {
    const opts: { label: string; value: string; year: number; month: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
      const value = `${d.getFullYear()}-${d.getMonth()}`;
      opts.push({ label, value, year: d.getFullYear(), month: d.getMonth() });
    }
    return opts;
  }, []);

  // Generate 8 quarters for dropdown
  const quarterOptions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const quarterLabels = [
      "Q1 (Jan - Mar)",
      "Q2 (Apr - Jun)",
      "Q3 (Jul - Sep)",
      "Q4 (Okt - Des)",
    ];
    const opts: { label: string; value: string; year: number; quarter: number }[] = [];
    for (let i = 0; i < 8; i++) {
      const totalQ = currentYear * 4 + currentQuarter - i;
      const y = Math.floor(totalQ / 4);
      const q = ((totalQ % 4) + 4) % 4;
      opts.push({
        label: `${quarterLabels[q]} ${y}`,
        value: `${y}-${q}`,
        year: y,
        quarter: q,
      });
    }
    return opts;
  }, []);

  const isLatestPeriod = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);

    const sYear = selectedDate.getFullYear();
    const sMonth = selectedDate.getMonth();
    const sQuarter = Math.floor(sMonth / 3);

    if (timeRange === "year") {
      return sYear >= currentYear;
    }
    if (timeRange === "quarter") {
      return (
        sYear > currentYear ||
        (sYear === currentYear && sQuarter >= currentQuarter)
      );
    }
    return (
      sYear > currentYear ||
      (sYear === currentYear && sMonth >= currentMonth)
    );
  }, [timeRange, selectedDate]);

  const handlePrevPeriod = () => {
    if (timeRange === "year") {
      setSelectedDate((prev) => new Date(prev.getFullYear() - 1, 0, 1));
    } else if (timeRange === "quarter") {
      const curQuarter = Math.floor(selectedDate.getMonth() / 3);
      setSelectedDate(new Date(selectedDate.getFullYear(), (curQuarter - 1) * 3, 1));
    } else {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  };

  const handleNextPeriod = () => {
    if (isLatestPeriod) return;
    if (timeRange === "year") {
      setSelectedDate((prev) => new Date(prev.getFullYear() + 1, 0, 1));
    } else if (timeRange === "quarter") {
      const curQuarter = Math.floor(selectedDate.getMonth() / 3);
      setSelectedDate(new Date(selectedDate.getFullYear(), (curQuarter + 1) * 3, 1));
    } else {
      setSelectedDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const currentPeriodLabel = useMemo(() => {
    if (timeRange === "all") {
      return "Semua Data";
    }
    if (timeRange === "year") {
      return `${selectedYear}`;
    }
    if (timeRange === "quarter") {
      return `Q${selectedQuarter + 1} ${selectedYear}`;
    }
    return selectedDate.toLocaleDateString("id-ID", {
      month: "short",
      year: "numeric",
    });
  }, [timeRange, selectedYear, selectedQuarter, selectedDate]);

  const dropdownMenuItems = useMemo(() => {
    if (timeRange === "year") {
      return yearOptions.map((opt) => ({
        key: opt.value,
        label: opt.label,
        onClick: () => {
          setSelectedDate(new Date(opt.year, 0, 1));
        },
      }));
    }
    if (timeRange === "quarter") {
      return quarterOptions.map((opt) => ({
        key: opt.value,
        label: opt.label,
        onClick: () => {
          setSelectedDate(new Date(opt.year, opt.quarter * 3, 1));
        },
      }));
    }
    return monthOptions.map((opt) => ({
      key: opt.value,
      label: opt.label,
      onClick: () => {
        setSelectedDate(new Date(opt.year, opt.month, 1));
      },
    }));
  }, [timeRange, yearOptions, quarterOptions, monthOptions]);

  const selectedDropdownKey = useMemo(() => {
    if (timeRange === "year") {
      return `${selectedYear}`;
    }
    if (timeRange === "quarter") {
      return `${selectedYear}-${selectedQuarter}`;
    }
    return `${selectedYear}-${selectedMonth}`;
  }, [timeRange, selectedYear, selectedMonth, selectedQuarter]);

  const prevTitle =
    timeRange === "year"
      ? "Tahun sebelumnya"
      : timeRange === "quarter"
        ? "Kuartal sebelumnya"
        : "Bulan sebelumnya";

  const nextTitle =
    timeRange === "year"
      ? "Tahun berikutnya"
      : timeRange === "quarter"
        ? "Kuartal berikutnya"
        : "Bulan berikutnya";

  const { data: students = [], fetchLoading: studentsLoading } = useUserRoleStudents();
  const { data: answerApprovals = [], fetchLoading: approvalsLoading } = useAnswerApprovals();
  const { data: statementApprovals = [], fetchLoading: statementLoading } = useStatementLetterAiApprovals();
  const { data: sponsorApprovals = [], fetchLoading: sponsorLoading } = useSponsorLetterAiApprovals();
  const { data: visaTypes = [] } = useVisaTypes();

  const isLoading = studentsLoading || approvalsLoading || statementLoading || sponsorLoading;

  const visaTypeNameById = useMemo(
    () => new Map(visaTypes.map((item) => [String(item.id), String(item.name ?? "").trim()])),
    [visaTypes],
  );

  const getVisaTypeLabel = (student: UserDataModel): string => {
    const visaTypeName = String(student.visa_type_name ?? "").trim();
    if (visaTypeName) return visaTypeName;
    const visaTypeValue = String(student.visa_type ?? "").trim();
    if (!visaTypeValue) return "Student Visa";
    const mappedName = visaTypeNameById.get(visaTypeValue);
    if (mappedName) return mappedName;
    return visaTypeValue.replace(/_/g, " ");
  };

  const activeStudents = useMemo(
    () => students.filter((s) => String(s.role ?? "").toUpperCase() === "STUDENT"),
    [students],
  );

  const displayedActiveStudents = useMemo(() => {
    if (timeRange === "all") {
      return activeStudents;
    }
    const targetYear = selectedYear;
    const targetMonth = selectedMonth;
    const targetQuarter = selectedQuarter;

    return activeStudents.filter((s) => {
      const dateStr = s.joined_at || s.created_at;
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (Number.isNaN(d.getTime())) return false;

      if (timeRange === "year") {
        return d.getFullYear() === targetYear;
      }
      if (timeRange === "quarter") {
        return (
          d.getFullYear() === targetYear &&
          Math.floor(d.getMonth() / 3) === targetQuarter
        );
      }
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    });
  }, [activeStudents, timeRange, selectedYear, selectedMonth, selectedQuarter]);

  // KPI: Pipeline stats
  const pipelineStats = useMemo(() => {
    let ongoing = 0; let waitingVisa = 0; let completed = 0; let postpone = 0; let cancel = 0;
    displayedActiveStudents.forEach((s) => {
      const raw = normalizeText(s.student_status);
      if (raw.includes("cancel")) cancel += 1;
      else if (raw.includes("postpone") || raw.includes("pending")) postpone += 1;
      else if (raw.includes("waiting visa") || raw.includes("proses visa")) waitingVisa += 1;
      else if (raw.includes("complete") || raw.includes("done")) completed += 1;
      else ongoing += 1;
    });
    return { total: displayedActiveStudents.length, ongoing, waitingVisa, completed, postpone, cancel };
  }, [displayedActiveStudents]);

  // KPI: Visa success rate
  const visaSummary = useMemo(() => {
    const counts = { granted: 0, processing: 0, refused: 0 };
    displayedActiveStudents.forEach((s) => { counts[getVisaSummaryCategory(s.visa_status)] += 1; });
    return counts;
  }, [displayedActiveStudents]);

  const totalVisaSum = visaSummary.granted + visaSummary.processing + visaSummary.refused;
  const successRate = totalVisaSum ? Math.round((visaSummary.granted / totalVisaSum) * 100) : 92;

  // KPI: Pending approvals
  const pendingApprovalsCount = useMemo(() => {
    const pendingAnswers = answerApprovals.filter(
      (item: AnswerApprovalsDataModel) => normalizeText(item.status || "pending") === "pending",
    ).length;
    const pendingLetters = [...statementApprovals, ...sponsorApprovals].filter(
      (item) => normalizeText(item.status || "pending") === "pending",
    ).length;
    return { total: pendingAnswers + pendingLetters, answers: pendingAnswers, letters: pendingLetters };
  }, [answerApprovals, sponsorApprovals, statementApprovals]);

  // Subtitles with professional, consistent UX writing (fixed length to prevent layout shifts)
  const trendSubtitle = useMemo(() => {
    if (timeRange === "all") {
      return "Aktivitas pendaftaran dan kelolosan visa";
    }
    if (timeRange === "year") {
      return `Aktivitas pendaftaran dan kelolosan visa tahun ${selectedYear}`;
    }
    if (timeRange === "quarter") {
      return `Aktivitas pendaftaran dan kelolosan visa Q${selectedQuarter + 1} ${selectedYear}`;
    }
    const monthName = selectedDate.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });
    return `Aktivitas pendaftaran dan kelolosan visa bulan ${monthName}`;
  }, [timeRange, selectedYear, selectedQuarter, selectedDate]);
  const countrySubtitle = "Sebaran siswa berdasarkan destinasi studi";

  // Monthly trend chart data — dihitung dari pendaftaran dan visa_granted_at nyata secara dinamis per periode
  const monthlyTrendData = useMemo(() => {
    const targetYear = selectedYear;
    const targetMonth = selectedMonth;
    const targetQuarter = selectedQuarter;

    if (timeRange === "all") {
      // 6 bulan terakhir sampai saat ini
      const months: { month: string; year: number; monthIndex: number }[] = [];
      const now = new Date();
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
    }

    if (timeRange === "month") {
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
      // 3 bulan dalam kuartal yang dipilih
      const startQuarterMonth = targetQuarter * 3;
      const quarterMonths: { month: string; year: number; monthIndex: number }[] = [];

      for (let i = 0; i < 3; i++) {
        const mIdx = startQuarterMonth + i;
        const d = new Date(targetYear, mIdx, 1);
        quarterMonths.push({
          month: d.toLocaleDateString("id-ID", { month: "short" }),
          year: targetYear,
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
            d.getFullYear() === targetYear &&
            Math.floor(d.getMonth() / 3) === targetQuarter
          ) {
            regMap.set(d.getMonth(), (regMap.get(d.getMonth()) ?? 0) + 1);
          }
        }

        if (s.visa_granted_at) {
          const d = new Date(s.visa_granted_at);
          if (
            !Number.isNaN(d.getTime()) &&
            d.getFullYear() === targetYear &&
            Math.floor(d.getMonth() / 3) === targetQuarter
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

    // Default & "year": 12 bulan penuh dalam tahun yang dipilih
    const monthsShort = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Agu",
      "Sep",
      "Okt",
      "Nov",
      "Des",
    ];
    const regCounts = new Array(12).fill(0);
    const grantCounts = new Array(12).fill(0);

    activeStudents.forEach((s) => {
      const dateStr = s.joined_at || s.created_at;
      if (dateStr) {
        const d = new Date(dateStr);
        if (!Number.isNaN(d.getTime()) && d.getFullYear() === targetYear) {
          regCounts[d.getMonth()] += 1;
        }
      }
      if (s.visa_granted_at) {
        const d = new Date(s.visa_granted_at);
        if (!Number.isNaN(d.getTime()) && d.getFullYear() === targetYear) {
          grantCounts[d.getMonth()] += 1;
        }
      }
    });

    return monthsShort.map((month, idx) => ({
      month,
      registered: regCounts[idx],
      granted: grantCounts[idx],
    }));
  }, [activeStudents, timeRange, selectedYear, selectedMonth, selectedQuarter]);

  // KPI: Rata-rata durasi lodgement (hari dari created_at ke status terakhir diperbarui)
  const lodgementStats = useMemo(() => {
    const durations: number[] = [];
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    activeStudents.forEach((s) => {
      const start = s.created_at ? new Date(s.created_at).getTime() : NaN;
      if (Number.isNaN(start)) return;

      // Gunakan tanggal terbaru yang tersedia sebagai end point
      const candidates = [s.student_status_updated_at, s.visa_granted_at, s.updated_at]
        .map((v) => (v ? new Date(v).getTime() : NaN))
        .filter((t) => !Number.isNaN(t));

      const end = candidates.length > 0 ? Math.max(...candidates) : Date.now();
      const days = (end - start) / MS_PER_DAY;
      if (days > 0) durations.push(days);
    });

    if (durations.length === 0) return { avg: null, trend: null };

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    // Target internal: 30 hari — hitung apakah lebih cepat atau lambat
    const TARGET_DAYS = 30;
    const trendPct = Math.round(((TARGET_DAYS - avg) / TARGET_DAYS) * 100);
    return { avg: Math.round(avg * 10) / 10, trend: trendPct };
  }, [activeStudents]);

  // Country bar chart data
  const countryBarData = useMemo(() => {
    const map = new Map<string, { country: string; code: string; count: number; color: string; bg: string; border: string }>();
    displayedActiveStudents.forEach((s) => {
      const country = getCountryName(s);
      if (!country || country === "Unknown" || country === "-") return;
      const meta = getCountryBadgeMeta(country);
      if (!map.has(country)) map.set(country, { country, code: meta.code, count: 0, color: meta.color, bg: meta.bg, border: meta.border });
      map.get(country)!.count += 1;
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [displayedActiveStudents]);

  // Consultant summary (compact, used in table header)
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

  // Lead source summary (compact, used in table header)
  const leadSummary = useMemo(() => {
    const map = new Map<string, number>();
    displayedActiveStudents.forEach((s) => {
      const src = normalizeLeadSource(s.source);
      map.set(src, (map.get(src) ?? 0) + 1);
    });
    const total = displayedActiveStudents.length || 1;
    return Array.from(map.entries())
      .map(([src, count]) => ({ label: formatLeadSourceLabel(src), count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [displayedActiveStudents]);

  // Filter options
  const countryOptions = useMemo(
    () => Array.from(new Set(displayedActiveStudents.map((s) => getCountryName(s))))
      .filter((c) => c && c !== "Unknown" && c !== "-")
      .sort((a, b) => a.localeCompare(b)),
    [displayedActiveStudents],
  );

  const stepOptions = useMemo(
    () => Array.from(new Set(displayedActiveStudents.map((s) => getCurrentStepLabel(s))))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b)),
    [displayedActiveStudents],
  );

  const leadSourceOptions = useMemo(
    () => Array.from(new Set(displayedActiveStudents.map((s) => normalizeLeadSource(s.source))))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b))
      .map((value) => ({ value, label: formatLeadSourceLabel(value) })),
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
    answerApprovals.forEach((item) => {
      setLatestTime(String(item.student_id), item.reviewed_at ?? item.updated_at ?? item.created_at);
    });
    return result;
  }, [displayedActiveStudents, answerApprovals]);

  const pipelineStudents = useMemo(() => {
    return displayedActiveStudents.filter((s) => {
      const country = getCountryName(s);
      const step = getCurrentStepLabel(s);
      const status = getStudentPipelineStatus(s).label;
      const lastActivityAt = lastActivityByStudent[String(s.id)];
      const leadSource = normalizeLeadSource(s.source);

      if (countryFilter !== "all" && country !== countryFilter) return false;
      if (stepFilter !== "all" && step !== stepFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (leadSourceFilter !== "all" && leadSource !== leadSourceFilter) return false;
      if (lastUpdateFilter !== "all") {
        if (!lastActivityAt) return false;
        const ageMs = Date.now() - lastActivityAt;
        if (lastUpdateFilter === "today" && ageMs > 24 * 60 * 60 * 1000) return false;
        if (lastUpdateFilter === "7d" && ageMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (lastUpdateFilter === "30d" && ageMs > 30 * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [displayedActiveStudents, countryFilter, lastActivityByStudent, lastUpdateFilter, leadSourceFilter, statusFilter, stepFilter]);

  if (isLoading) {
    return <LoadingSplash label="Memuat Director Intelligence Center..." />;
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <PageHeader
        title="Director Dashboard"
        subtitle="Pantau analisis pendaftaran dan pipeline siswa"
        icon={<DashboardOutlined />}
      >
        <Segmented
          size="small"
          value={timeRange}
          onChange={(val) => setTimeRange(String(val))}
          options={[
            { label: "All", value: "all" },
            { label: "Yearly", value: "year" },
            { label: "Monthly", value: "month" },
            { label: "Quartal", value: "quarter" },
          ]}
          className={styles.periodSegmented}
        />
      </PageHeader>

      {/* ── SECTION 1: KPI Strip ── */}
      <div className={styles.kpiStrip}>
        {/* KPI 1 */}
        <div className={styles.kpiItem}>
          <div className={styles.kpiLabel}>
            <span>Total Students</span>
            <TeamOutlined style={{ color: "#1d4ed8", fontSize: 15 }} />
          </div>
          <div className={styles.kpiValue}>{pipelineStats.total}</div>
          <div className={styles.kpiSub}>
            <span style={{ color: "#16a34a", fontWeight: 600 }}>{pipelineStats.ongoing} Ongoing</span>
            <span className={styles.kpiDot}>·</span>
            <span style={{ color: "#0284c7", fontWeight: 600 }}>{pipelineStats.waitingVisa} Waiting Visa</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className={styles.kpiItem}>
          <div className={styles.kpiLabel}>
            <span>Visa Grant Rate</span>
            <SafetyCertificateOutlined style={{ color: "#16a34a", fontSize: 15 }} />
          </div>
          <div className={styles.kpiValue}>{successRate}%</div>
          <div className={styles.kpiSub} style={{ color: "#16a34a", fontWeight: 600 }}>
            {visaSummary.granted} Granted
          </div>
        </div>

        {/* KPI 3 */}
        <div className={styles.kpiItem}>
          <div className={styles.kpiLabel}>
            <span>Director Decisions</span>
            <AuditOutlined style={{ color: "#d97706", fontSize: 15 }} />
          </div>
          <div className={styles.kpiValue}>{pendingApprovalsCount.total}</div>
          <div className={styles.kpiSub}>
            {pendingApprovalsCount.answers} Documents · {pendingApprovalsCount.letters} AI Letters
          </div>
        </div>

        {/* KPI 4 */}
        <div className={styles.kpiItem}>
          <div className={styles.kpiLabel}>
            <span>Lodgement Duration</span>
            <ClockCircleOutlined style={{ color: "#7c3aed", fontSize: 15 }} />
          </div>
          <div className={styles.kpiValue}>
            {lodgementStats.avg !== null ? (
              <>
                {lodgementStats.avg}
                <span style={{ fontSize: 13, fontWeight: 600, color: "#64748b" }}> days</span>
              </>
            ) : (
              <span style={{ fontSize: 18, color: "#94a3b8" }}>—</span>
            )}
          </div>
          <div
            className={styles.kpiSub}
            style={{
              color:
                lodgementStats.trend === null
                  ? "#64748b"
                  : lodgementStats.trend >= 0
                    ? "#16a34a"
                    : "#e11d48",
              fontWeight: 600,
            }}
          >
            {lodgementStats.trend === null
              ? "Belum ada data"
              : lodgementStats.trend >= 0
                ? `${lodgementStats.trend}% lebih cepat dari target`
                : `${Math.abs(lodgementStats.trend)}% di atas target`}
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Charts Side-by-Side ── */}
      <div className={styles.chartsGrid}>
        {/* Chart Left: Trend Line */}
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
                  onClick={handlePrevPeriod}
                  disabled={timeRange === "all"}
                  title={timeRange === "all" ? "Semua data aktif" : prevTitle}
                  style={{
                    width: 24,
                    height: 24,
                    border: "none",
                    background: "transparent",
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: timeRange === "all" ? "not-allowed" : "pointer",
                    color: timeRange === "all" ? "#cbd5e1" : "#64748b",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (timeRange !== "all") {
                      e.currentTarget.style.background = "#f1f5f9";
                      e.currentTarget.style.color = "#0f172a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color =
                      timeRange === "all" ? "#cbd5e1" : "#64748b";
                  }}
                >
                  <LeftOutlined style={{ fontSize: 10 }} />
                </button>

                <Dropdown
                  disabled={timeRange === "all"}
                  menu={{
                    items: dropdownMenuItems,
                    selectedKeys: [selectedDropdownKey],
                  }}
                  trigger={["click"]}
                  placement="bottomCenter"
                >
                  <button
                    type="button"
                    disabled={timeRange === "all"}
                    style={{
                      border: "none",
                      background: "transparent",
                      padding: "0 8px",
                      height: 24,
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      color: timeRange === "all" ? "#94a3b8" : "#1e293b",
                      cursor: timeRange === "all" ? "default" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (timeRange !== "all") {
                        e.currentTarget.style.background = "#f1f5f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span>{currentPeriodLabel}</span>
                    {timeRange !== "all" && (
                      <DownOutlined style={{ fontSize: 8, color: "#94a3b8" }} />
                    )}
                  </button>
                </Dropdown>

                <button
                  type="button"
                  onClick={handleNextPeriod}
                  disabled={timeRange === "all" || isLatestPeriod}
                  title={timeRange === "all" ? "Semua data aktif" : nextTitle}
                  style={{
                    width: 24,
                    height: 24,
                    border: "none",
                    background: "transparent",
                    borderRadius: 5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor:
                      timeRange === "all" || isLatestPeriod
                        ? "not-allowed"
                        : "pointer",
                    color:
                      timeRange === "all" || isLatestPeriod
                        ? "#cbd5e1"
                        : "#64748b",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (timeRange !== "all" && !isLatestPeriod) {
                      e.currentTarget.style.background = "#f1f5f9";
                      e.currentTarget.style.color = "#0f172a";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color =
                      timeRange === "all" || isLatestPeriod
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
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#1b3d6d", display: "inline-block" }} />
              <span style={{ color: "#334155", fontWeight: 600, fontSize: 12 }}>Registration</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
              <span style={{ color: "#334155", fontWeight: 600, fontSize: 12 }}>Visa Granted</span>
            </div>
          </div>
        </div>

        {/* Chart Right: Country Bar */}
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

      {/* ── SECTION 3: Pipeline Table ── */}
      <div className={styles.tableCard}>
        {/* Table Header */}
        <div className={styles.tableHeaderRow}>
          <div>
            <h3 className={styles.tableTitle}>Student Pipeline</h3>
            <p className={styles.tableSub}>
              {pipelineStudents.length} dari {activeStudents.length} siswa ditampilkan
            </p>
          </div>
          <AppButton
            variant="primary"
            icon={<FolderOpenOutlined />}
            onClick={() => router.push("/director/dashboard/students-management")}
          >
            Buka
          </AppButton>
        </div>

        {/* Compact inline summaries: Consultant + Lead Source */}
        <div className={styles.inlineSummaryRow}>
          <div className={styles.inlineSummaryBlock}>
            <span className={styles.inlineSummaryLabel}>Konsultan Aktif</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {consultantSummary.map((c) => (
                <Tooltip key={c.name} title={`${c.count} siswa`}>
                  <span className={styles.summaryPill}>
                    {c.name.split(" ")[0]} <strong>{c.count}</strong>
                  </span>
                </Tooltip>
              ))}
              {consultantSummary.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>Belum ada data</span>}
            </div>
          </div>
          <div className={styles.inlineSummaryDivider} />
          <div className={styles.inlineSummaryBlock}>
            <span className={styles.inlineSummaryLabel}>Sumber Lead Utama</span>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {leadSummary.map((l) => (
                <Tooltip key={l.label} title={`${l.pct}% dari total`}>
                  <span className={styles.summaryPill}>
                    {l.label} <strong>{l.pct}%</strong>
                  </span>
                </Tooltip>
              ))}
              {leadSummary.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>Belum ada data</span>}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className={styles.filterBar}>
          <Select
            value={countryFilter}
            onChange={setCountryFilter}
            style={{ minWidth: 140 }}
            options={[{ value: "all", label: "Semua Negara" }, ...countryOptions.map((item) => ({ value: item, label: item }))]}
          />
          <Select
            value={stepFilter}
            onChange={setStepFilter}
            style={{ minWidth: 130 }}
            options={[{ value: "all", label: "Semua Tahapan" }, ...stepOptions.map((item) => ({ value: item, label: item }))]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ minWidth: 130 }}
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
            value={leadSourceFilter}
            onChange={setLeadSourceFilter}
            style={{ minWidth: 150 }}
            options={[{ value: "all", label: "Semua Channel" }, ...leadSourceOptions]}
          />
          <Select
            value={lastUpdateFilter}
            onChange={setLastUpdateFilter}
            style={{ minWidth: 140 }}
            options={[
              { value: "all", label: "Semua Pembaruan" },
              { value: "today", label: "Hari Ini" },
              { value: "7d", label: "7 Hari Terakhir" },
              { value: "30d", label: "30 Hari Terakhir" },
            ]}
          />
        </div>

        {/* Standardized Pipeline Table */}
        <StudentPipelineTable
          students={pipelineStudents}
          role="director"
          lastActivityMap={lastActivityByStudent}
          visaTypeNameById={visaTypeNameById}
        />
      </div>
    </div>
  );
}
