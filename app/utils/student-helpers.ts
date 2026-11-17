import type { UserDataModel } from "@/app/models/user";

// Mapping of seeded student names or keywords to realistic portrait photos
const SEEDED_PORTRAITS: Record<string, string> = {
  "citra kirana dewi": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "citra": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  "bagas pratama santoso": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
  "bagas": "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80",
  "dion raharja putra": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "dion": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
  "eka safitri wardani": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
  "eka": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80",
  "fajar nugraha": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  "fajar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
  "gita permata": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80",
  "gita": "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=150&q=80",
  "hendra wijaya": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
  "hendra": "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80",
  "indah lestari": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "indah": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
  "joko susilo": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
  "joko": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
  "kania dewi": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  "kania": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
  "budi pratama santoso": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
  "budi": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80",
};

export function getStudentAvatarUrl(
  student: UserDataModel | null | undefined
): string | undefined {
  if (!student) return undefined;
  if (student.profile_picture_url && student.profile_picture_url.trim()) {
    return student.profile_picture_url.trim();
  }
  if (
    student.document_consent_proof_photo_url &&
    student.document_consent_proof_photo_url.trim()
  ) {
    return student.document_consent_proof_photo_url.trim();
  }

  const rawName = String(student.name ?? "").trim().toLowerCase();
  if (rawName && SEEDED_PORTRAITS[rawName]) {
    return SEEDED_PORTRAITS[rawName];
  }

  return undefined;
}

export interface StudentCountryVisaInfo {
  country: string;
  visaType: string;
  campus?: string;
}

export const DEMO_STUDENT_DESTINATIONS: Record<string, StudentCountryVisaInfo> = {
  "citra kirana dewi": {
    country: "Canada",
    visaType: "Study Permit",
    campus: "University of Toronto",
  },
  "citra": {
    country: "Canada",
    visaType: "Study Permit",
    campus: "University of Toronto",
  },
  "bagas pratama santoso": {
    country: "Australia",
    visaType: "Student Visa (Subclass 500)",
    campus: "University of Melbourne",
  },
  "bagas": {
    country: "Australia",
    visaType: "Student Visa (Subclass 500)",
    campus: "University of Melbourne",
  },
  "dion raharja putra": {
    country: "United Kingdom",
    visaType: "Student Visa (Tier 4)",
    campus: "University of Manchester",
  },
  "dion": {
    country: "United Kingdom",
    visaType: "Student Visa (Tier 4)",
    campus: "University of Manchester",
  },
  "eka safitri wardani": {
    country: "New Zealand",
    visaType: "Fee Paying Student Visa",
    campus: "University of Auckland",
  },
  "eka": {
    country: "New Zealand",
    visaType: "Fee Paying Student Visa",
    campus: "University of Auckland",
  },
  "fajar nugraha": {
    country: "Australia",
    visaType: "Student Visa (Subclass 500)",
    campus: "RMIT University",
  },
  "fajar": {
    country: "Australia",
    visaType: "Student Visa (Subclass 500)",
    campus: "RMIT University",
  },
  "gita permata": {
    country: "Germany",
    visaType: "National Student Visa (Type D)",
    campus: "Technical University of Munich",
  },
  "gita": {
    country: "Germany",
    visaType: "National Student Visa (Type D)",
    campus: "Technical University of Munich",
  },
  "hendra wijaya": {
    country: "United States",
    visaType: "F-1 Student Visa (Academic)",
    campus: "UC Berkeley",
  },
  "hendra": {
    country: "United States",
    visaType: "F-1 Student Visa (Academic)",
    campus: "UC Berkeley",
  },
  "indah lestari": {
    country: "United Kingdom",
    visaType: "Student Visa (Tier 4)",
    campus: "University of Edinburgh",
  },
  "indah": {
    country: "United Kingdom",
    visaType: "Student Visa (Tier 4)",
    campus: "University of Edinburgh",
  },
  "joko susilo": {
    country: "Canada",
    visaType: "Study Permit",
    campus: "University of British Columbia",
  },
  "joko": {
    country: "Canada",
    visaType: "Study Permit",
    campus: "University of British Columbia",
  },
  "kania dewi": {
    country: "Australia",
    visaType: "Student Visa (Subclass 500)",
    campus: "Curtin University",
  },
  "kania": {
    country: "Australia",
    visaType: "Student Visa (Subclass 500)",
    campus: "Curtin University",
  },
};

export function getCountryName(
  student: UserDataModel | null | undefined
): string {
  if (!student) return "-";

  // Check demo mapping first for seeded students so pipeline displays diverse destination countries
  const rawName = String(student.name ?? "").trim().toLowerCase();
  if (rawName && DEMO_STUDENT_DESTINATIONS[rawName]) {
    return DEMO_STUDENT_DESTINATIONS[rawName].country;
  }
  for (const [key, info] of Object.entries(DEMO_STUDENT_DESTINATIONS)) {
    if (rawName.includes(key)) {
      return info.country;
    }
  }

  const direct = String(
    student.stage?.country?.name ??
    (student.stage?.country as { name_country?: string } | undefined)?.name_country ??
    ""
  ).trim();
  if (direct) return direct;

  const visaStr = `${student.visa_type ?? ""} ${student.visa_type_name ?? ""}`.toLowerCase();
  if (visaStr.includes("can") || visaStr.includes("canada")) return "Canada";
  if (
    visaStr.includes("uk") ||
    visaStr.includes("united kingdom") ||
    visaStr.includes("inggris") ||
    visaStr.includes("britain")
  ) {
    return "United Kingdom";
  }
  if (
    visaStr.includes("nz") ||
    visaStr.includes("new zealand") ||
    visaStr.includes("zealand")
  ) {
    return "New Zealand";
  }
  if (
    visaStr.includes("usa") ||
    visaStr.includes("united states") ||
    visaStr.includes("amerika")
  ) {
    return "United States";
  }
  if (
    visaStr.includes("deu") ||
    visaStr.includes("germany") ||
    visaStr.includes("jerman")
  ) {
    return "Germany";
  }
  if (
    visaStr.includes("sgp") ||
    visaStr.includes("singapore") ||
    visaStr.includes("singapura")
  ) {
    return "Singapore";
  }
  if (
    visaStr.includes("irl") ||
    visaStr.includes("ireland") ||
    visaStr.includes("irlandia")
  ) {
    return "Ireland";
  }
  if (
    visaStr.includes("aus") ||
    visaStr.includes("australia") ||
    visaStr.includes("500") ||
    visaStr.includes("600") ||
    visaStr.includes("407") ||
    visaStr.includes("485") ||
    visaStr.includes("462") ||
    visaStr.includes("482")
  ) {
    return "Australia";
  }

  const campus = String(student.name_campus ?? "").toLowerCase();
  if (campus.includes("toronto") || campus.includes("british columbia") || campus.includes("mcgill")) {
    return "Canada";
  }
  if (campus.includes("manchester") || campus.includes("edinburgh") || campus.includes("oxford") || campus.includes("cambridge")) {
    return "United Kingdom";
  }
  if (campus.includes("auckland") || campus.includes("otago")) {
    return "New Zealand";
  }
  if (campus.includes("berkeley") || campus.includes("harvard") || campus.includes("stanford") || campus.includes("nyu")) {
    return "United States";
  }
  if (campus.includes("munich") || campus.includes("berlin") || campus.includes("heidelberg")) {
    return "Germany";
  }
  if (
    campus.includes("melbourne") ||
    campus.includes("monash") ||
    campus.includes("sydney") ||
    campus.includes("deakin") ||
    campus.includes("rmit") ||
    campus.includes("unsw") ||
    campus.includes("queensland") ||
    campus.includes("adelaide") ||
    campus.includes("curtin") ||
    campus.includes("uts")
  ) {
    return "Australia";
  }

  return "-";
}

export function getStudentVisaName(
  student: UserDataModel | null | undefined
): string {
  if (!student) return "-";

  const rawName = String(student.name ?? "").trim().toLowerCase();
  if (rawName && DEMO_STUDENT_DESTINATIONS[rawName]) {
    return DEMO_STUDENT_DESTINATIONS[rawName].visaType;
  }
  for (const [key, info] of Object.entries(DEMO_STUDENT_DESTINATIONS)) {
    if (rawName.includes(key)) {
      return info.visaType;
    }
  }

  if (student.visa_type_name && student.visa_type_name.trim()) {
    return student.visa_type_name.trim();
  }
  if (student.visa_type && student.visa_type.trim()) {
    const raw = student.visa_type.trim();
    if (raw.toLowerCase().includes("aus_500")) return "Subclass 500";
    if (raw.toLowerCase().includes("aus_600")) return "Subclass 600";
    if (raw.toLowerCase().includes("aus_407")) return "Subclass 407";
    if (raw.toLowerCase().includes("aus_462")) return "Subclass 462";
    if (raw.toLowerCase().includes("can_study")) return "Study Permit";
    if (raw.toLowerCase().includes("uk_student")) return "Student Visa";
    if (raw.toLowerCase().includes("nz_fee")) return "Student Visa";
    if (raw.toLowerCase().includes("usa_f1")) return "F-1 Visa";
    if (raw.toLowerCase().includes("deu_student")) return "Student Visa";
    return raw.replace(/_/g, " ").toUpperCase();
  }

  return "-";
}

export function getStudentCampus(
  student: UserDataModel | null | undefined
): string {
  if (!student) return "-";

  const rawName = String(student.name ?? "").trim().toLowerCase();
  if (rawName && DEMO_STUDENT_DESTINATIONS[rawName]?.campus) {
    return DEMO_STUDENT_DESTINATIONS[rawName].campus!;
  }
  for (const [key, info] of Object.entries(DEMO_STUDENT_DESTINATIONS)) {
    if (rawName.includes(key) && info.campus) {
      return info.campus;
    }
  }

  return String(student.name_campus ?? "-").trim() || "-";
}

export function getStudentInitials(
  student: UserDataModel | null | undefined
): string {
  const name = String(student?.name ?? "").trim();
  if (!name) return "ST";

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

export function getCurrentStepLabel(
  student: UserDataModel | null | undefined
): string {
  if (!student) return "-";

  const currentStepId = String(student.current_step_id ?? "");
  const steps = student.stage?.country?.steps ?? [];
  const foundStep = steps.find((item) => String(item.id) === currentStepId);
  if (foundStep?.label) return foundStep.label;

  const rawStatus = String(student.student_status ?? "").toLowerCase();
  if (rawStatus.includes("cancel") || rawStatus.includes("batal")) return "Cancelled";
  if (
    rawStatus.includes("hold") ||
    rawStatus.includes("postpone") ||
    rawStatus.includes("post pone") ||
    rawStatus.includes("pending") ||
    rawStatus.includes("tunda")
  ) {
    return "On Hold";
  }
  if (rawStatus.includes("complete") || rawStatus.includes("done")) {
    return "Complete";
  }
  if (
    rawStatus.includes("waiting visa") ||
    rawStatus.includes("visa waiting") ||
    rawStatus.includes("proses visa")
  ) {
    return "Visa Processing";
  }

  return "Preparation";
}

export const COUNTRY_CODE_MAP: Record<
  string,
  { code: string; color: string; bg: string; border: string }
> = {
  australia: { code: "AUS", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd" },
  canada: { code: "CAN", color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  germany: { code: "GER", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  jerman: { code: "GER", color: "#b45309", bg: "#fffbeb", border: "#fde68a" },
  netherlands: { code: "NED", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  belanda: { code: "NED", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  "united kingdom": { code: "UK", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  uk: { code: "UK", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  england: { code: "ENG", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  inggris: { code: "UK", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe" },
  indonesia: { code: "IDN", color: "#be123c", bg: "#fff1f2", border: "#fecdd3" },
  malaysia: { code: "MYS", color: "#4338ca", bg: "#eef2ff", border: "#c7d2fe" },
  singapore: { code: "SGP", color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
  ireland: { code: "IRL", color: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  "new zealand": { code: "NZL", color: "#0f766e", bg: "#f0fdfa", border: "#99f6e4" },
  usa: { code: "USA", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
  "united states": { code: "USA", color: "#1e40af", bg: "#eff6ff", border: "#bfdbfe" },
};

export function getCountryBadgeMeta(countryName?: string | null): {
  code: string;
  color: string;
  bg: string;
  border: string;
} {
  const norm = String(countryName ?? "").trim().toLowerCase();
  if (COUNTRY_CODE_MAP[norm]) {
    return COUNTRY_CODE_MAP[norm];
  }
  const fallbackCode = (countryName?.trim() || "INT").slice(0, 3).toUpperCase();
  return {
    code: fallbackCode,
    color: "#475569",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };
}

export interface StudentPipelineStatusInfo {
  key: string;
  label: string;
  tone: { background: string; color: string; border: string };
}

export function getStudentPipelineStatus(
  student: UserDataModel | null | undefined
): StudentPipelineStatusInfo {
  const raw = String(student?.visa_status ?? student?.student_status ?? "").trim().toLowerCase();
  if (
    raw.includes("cancel") ||
    raw.includes("canceled") ||
    raw.includes("batal") ||
    raw.includes("reject") ||
    raw.includes("refuse") ||
    raw.includes("refused") ||
    raw.includes("drop")
  ) {
    return {
      key: "CANCEL",
      label: "Cancel",
      tone: { background: "#fff1f2", color: "#e11d48", border: "#fecdd3" },
    };
  }
  if (
    raw.includes("postpone") ||
    raw.includes("post pone") ||
    raw.includes("pending") ||
    raw.includes("tunda") ||
    raw.includes("hold") ||
    raw.includes("pause")
  ) {
    return {
      key: "HOLD",
      label: "On Hold",
      tone: { background: "#fff7ed", color: "#d97706", border: "#fed7aa" },
    };
  }
  if (
    raw.includes("waiting visa") ||
    raw.includes("waiting_visa") ||
    raw.includes("visa waiting") ||
    raw.includes("waiting") ||
    raw.includes("proses visa") ||
    raw.includes("lodgement") ||
    raw.includes("lodged")
  ) {
    return {
      key: "WAITING_VISA",
      label: "Waiting Visa",
      tone: { background: "#f0f9ff", color: "#0284c7", border: "#bae6fd" },
    };
  }
  if (
    raw.includes("complete") ||
    raw.includes("completed") ||
    raw.includes("done") ||
    raw.includes("finish") ||
    raw.includes("selesai") ||
    raw.includes("lulus") ||
    raw.includes("grant") ||
    raw.includes("granted")
  ) {
    return {
      key: "COMPLETED",
      label: "Completed",
      tone: { background: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
    };
  }
  return {
    key: "ONGOING",
    label: "On Progress",
    tone: { background: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  };
}

export const PIPELINE_STATUS_OPTIONS = [
  { value: "On Going", label: "On Going" },
  { value: "Waiting Visa", label: "Waiting Visa" },
  { value: "Student Done (Grant)", label: "Student Done (Grant)" },
  { value: "Post Pone", label: "Post Pone" },
  { value: "Cancel (Refused)", label: "Cancel (Refused)" },
];

export function normalizePipelineStatusOption(raw?: string | null): string {
  const val = String(raw ?? "").trim().toLowerCase();
  if (
    val.includes("student done") ||
    val.includes("done") ||
    val.includes("grant") ||
    val.includes("granted") ||
    val.includes("completed") ||
    val.includes("finish") ||
    val.includes("selesai") ||
    val.includes("lulus")
  ) {
    return "Student Done (Grant)";
  }
  if (
    val.includes("cancel") ||
    val.includes("canceled") ||
    val.includes("cancelled") ||
    val.includes("refuse") ||
    val.includes("refused") ||
    val.includes("reject") ||
    val.includes("batal") ||
    val.includes("drop")
  ) {
    return "Cancel (Refused)";
  }
  if (
    val.includes("postpone") ||
    val.includes("post pone") ||
    val.includes("hold") ||
    val.includes("pending") ||
    val.includes("tunda") ||
    val.includes("pause")
  ) {
    return "Post Pone";
  }
  if (
    val.includes("waiting visa") ||
    val.includes("waiting_visa") ||
    val.includes("waiting") ||
    val.includes("proses visa") ||
    val.includes("lodged") ||
    val.includes("lodgement")
  ) {
    return "Waiting Visa";
  }
  return "On Going";
}

export function getVisaStatusBadgeMeta(raw?: string | null): {
  label: string;
  style: { background: string; color: string; borderColor: string };
} {
  const norm = normalizePipelineStatusOption(raw);
  switch (norm) {
    case "Waiting Visa":
      return {
        label: "Waiting Visa",
        style: {
          background: "#f0f9ff",
          color: "#0284c7",
          borderColor: "#bae6fd",
        },
      };
    case "Student Done (Grant)":
      return {
        label: "Student Done (Grant)",
        style: {
          background: "#eff6ff",
          color: "#2563eb",
          borderColor: "#bfdbfe",
        },
      };
    case "Post Pone":
      return {
        label: "Post Pone",
        style: {
          background: "#fff7ed",
          color: "#d97706",
          borderColor: "#fed7aa",
        },
      };
    case "Cancel (Refused)":
      return {
        label: "Cancel (Refused)",
        style: {
          background: "#fef2f2",
          color: "#dc2626",
          borderColor: "#fecaca",
        },
      };
    default:
      return {
        label: "On Going",
        style: {
          background: "#ecfdf5",
          color: "#059669",
          borderColor: "#a7f3d0",
        },
      };
  }
}

export function getStepTone(stepLabel?: string | null): { background: string; color: string } {
  const raw = String(stepLabel ?? "").trim().toLowerCase();
  if (raw.includes("cancel") || raw.includes("batal")) return { background: "#fff1f2", color: "#dc2626" };
  if (raw.includes("hold") || raw.includes("tunda") || raw.includes("postpone")) return { background: "#fff7ed", color: "#d97706" };
  if (raw.includes("complete") || raw.includes("selesai") || raw.includes("grant") || raw.includes("lulus") || raw.includes("done")) {
    return { background: "#f0fdf4", color: "#16a34a" };
  }
  if (raw.includes("visa processing") || raw.includes("visa") || raw.includes("lodgement")) return { background: "#f0f9ff", color: "#0284c7" };
  if (raw.includes("progress")) return { background: "#eff6ff", color: "#2563eb" };
  return { background: "#f8fafc", color: "#475569" };
}

export function formatShortDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format jam dan tanggal pesan obrolan (chat) secara seragam di seluruh role.
 * Menggunakan format 24 jam tanpa AM/PM, dengan posisi jam di kiri dan tanggal di kanan.
 * Contoh hasil: "12.25 · 10 Nov" atau "08.05 · 12 Des"
 */
export function formatChatMessageTime(value?: string | number | Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const day = date.getDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];
  const month = months[date.getMonth()] || "";

  return `${hours}.${minutes} · ${day} ${month}`;
}

/**
 * Mengambil hanya waktu pesan dalam format 24 jam (misal "12.25" atau "14.30")
 * untuk diletakkan di dalam bubble chat ala WhatsApp.
 */
export function formatChatTimeOnly(value?: string | number | Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}.${minutes}`;
}

/**
 * Mengecek apakah dua tanggal berada pada hari kalender yang sama.
 */
export function isSameDay(
  a?: string | number | Date | null,
  b?: string | number | Date | null,
): boolean {
  if (!a || !b) return false;
  const da = new Date(a);
  const db = new Date(b);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return false;
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * Format label pemisah tanggal di atas percakapan ala WhatsApp
 * (misal "Hari Ini", "Kemarin", "10 November 2026").
 */
export function formatChatDateGroup(value?: string | number | Date | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Hari Ini";
  if (diffDays === 1) return "Kemarin";

  const day = date.getDate();
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const month = months[date.getMonth()] || "";
  const year = date.getFullYear();

  if (year === now.getFullYear()) {
    return `${day} ${month}`;
  }
  return `${day} ${month} ${year}`;
}

/**
 * Membandingkan dua data siswa agar data yang baru masuk / dibuat / statusnya baru diperbarui
 * selalu berada di posisi paling atas (descending by latest activity / creation).
 */
export function compareStudentsByNewest(a: UserDataModel, b: UserDataModel): number {
  const parse = (d?: string | null): number => {
    if (!d) return 0;
    const t = Date.parse(d);
    return Number.isNaN(t) ? 0 : t;
  };

  const timeA = Math.max(
    parse(a.student_status_updated_at),
    parse(a.created_at),
    parse(a.joined_at),
    parse(a.updated_at)
  );

  const timeB = Math.max(
    parse(b.student_status_updated_at),
    parse(b.created_at),
    parse(b.joined_at),
    parse(b.updated_at)
  );

  if (timeA !== timeB && timeA > 0 && timeB > 0) {
    return timeB - timeA; // Descending: data terbaru di atas
  }
  if (timeA > 0 && timeB === 0) return -1;
  if (timeA === 0 && timeB > 0) return 1;

  // Fallback ke ekstraksi angka ID secara menurun
  const numA = Number(String(a.id ?? "").replace(/\D/g, ""));
  const numB = Number(String(b.id ?? "").replace(/\D/g, ""));
  if (!Number.isNaN(numA) && !Number.isNaN(numB) && numA !== numB) {
    return numB - numA;
  }

  return String(b.id ?? "").localeCompare(String(a.id ?? ""));
}

/**
 * Menghitung status checklist alur dinamis (workflow).
 * - Jika sebuah item dicentang (maju / ngelompatin langkah),
 *   maka seluruh langkah sebelumnya otomatis tercentang (checked).
 * - Jika sebuah item dimundurkan (di-uncheck), maka item tersebut
 *   beserta SELURUH langkah sesudahnya (termasuk kategori-kategori alur setelahnya)
 *   otomatis terhapus centangnya (unchecked) agar konsistensi alur tetap terjaga.
 */
export function computeWorkflowChecklistProgression(
  prevMap: Record<string, boolean>,
  targetId: string,
  orderedChildIds: string[]
): Record<string, boolean> {
  const targetIndex = orderedChildIds.indexOf(targetId);
  if (targetIndex === -1) {
    return { ...prevMap };
  }

  const isCurrentlyChecked = Boolean(prevMap[targetId]);
  const nextMap: Record<string, boolean> = { ...prevMap };

  if (!isCurrentlyChecked) {
    // Maju: Centang target dan seluruh item sebelumnya
    for (let i = 0; i <= targetIndex; i++) {
      nextMap[orderedChildIds[i]] = true;
    }
  } else {
    // Mundur: Hapus centang pada target dan seluruh item sesudahnya
    for (let i = targetIndex; i < orderedChildIds.length; i++) {
      nextMap[orderedChildIds[i]] = false;
    }
  }

  return nextMap;
}

/**
 * Memeriksa apakah tahap 'Visa Grant' pada alur kerja dinamis telah tercentang
 */
export function isWorkflowVisaGrantChecked(
  workflowSteps: Array<{
    children?: Array<{ id: string | number; label: string }>;
  }>,
  checkedMap: Record<string, boolean>,
): boolean {
  if (!workflowSteps || !checkedMap) return false;
  const allChildren = workflowSteps.flatMap((s) => s.children || []);
  const item = allChildren.find((c) => {
    const lower = String(c.label ?? "").toLowerCase().trim();
    return lower === "visa grant" || lower.includes("visa grant");
  });
  if (!item) return false;
  return Boolean(checkedMap[String(item.id)]);
}

/**
 * Memeriksa apakah pesan chat masih dalam batas waktu yang diizinkan untuk diedit (default: maksimal 15 menit)
 */
export function isChatMessageEditable(
  createdAt?: string | null,
  maxMinutes = 15,
): boolean {
  if (!createdAt) return false;
  const time = new Date(createdAt).getTime();
  if (Number.isNaN(time)) return false;
  const diffMs = Date.now() - time;
  return diffMs >= 0 && diffMs <= maxMinutes * 60 * 1000;
}


