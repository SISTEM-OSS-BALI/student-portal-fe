"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Tour,
  Typography,
  Upload,
} from "antd";
import type { TourProps } from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  DownloadOutlined,
  ExportOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  GlobalOutlined,
  InboxOutlined,
  InfoCircleFilled,
  InfoCircleOutlined,
  LinkOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ScanOutlined,
  SearchOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import type { UploadFile, UploadProps } from "antd";
import { useOCRClassifier } from "@/app/hooks/use-ocr-classifier";
import type { OCRClassifyResultModel } from "@/app/models/ocr";
import { useAuth } from "@/app/utils/use-auth";
import { useDocuments } from "@/app/hooks/use-documents-management";
import { useStagesManagement } from "@/app/hooks/use-stages-management";
import { useVisaTypes } from "@/app/hooks/use-visa-type-management";
import { useUser } from "@/app/hooks/use-users";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { usePageTour } from "@/app/hooks/use-page-tour";
import {
  MAX_UPLOAD_SIZE_MB,
  buildUploadSizeErrorMessage,
  isAllowedUploadSize,
} from "@/app/utils/upload";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import { buildFilePreviewUrl } from "@/app/utils/file-preview";
import PageHeader from "@/app/components/common/page-header";
import DocumentItemHeader from "@/app/components/common/document-item-header";
import type {
  AnswerDocumentDataModel,
  AnswerDocumentPayloadCreateModel,
} from "@/app/models/question";
import { generateStandardFileName } from "@/app/utils/document-auto-rename";
import { compareStudentNameWithOCR } from "@/app/utils/ocr-name-matcher";
import {
  normalizeDocumentLabel,
  getStandardDocumentRequired,
  getStandardDocumentOrder,
} from "@/app/utils/document-standards";
import styles from "./country-document.module.css";

const { Text, Title, Paragraph } = Typography;

const sanitizeFileName = (name: string) =>
  name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

const getFileExt = (name: string) => {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx) : "";
};

const formatUploadDate = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const resolveAccept = (fileType?: string) => {
  if (!fileType) return undefined;
  const normalized = fileType.toLowerCase();

  if (normalized.includes("pdf")) return ".pdf";
  if (
    normalized.includes("image") ||
    normalized.includes("jpg") ||
    normalized.includes("jpeg") ||
    normalized.includes("png")
  ) {
    return "image/*";
  }
  if (normalized.includes("doc")) return ".doc,.docx";

  return undefined;
};

const resolveFileTypeLabel = (fileType?: string) => {
  if (!fileType) return "Semua tipe file";
  return fileType;
};

const getPreviewKind = (url?: string, fileName?: string, fileType?: string) => {
  const normalizedUrl = String(url ?? "").toLowerCase();
  const normalizedName = String(fileName ?? "").toLowerCase();
  const normalizedType = String(fileType ?? "").toLowerCase();

  const isPdf =
    normalizedType.includes("pdf") ||
    normalizedUrl.includes(".pdf") ||
    normalizedName.endsWith(".pdf");
  if (isPdf) return "pdf";

  const isImage =
    normalizedType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp", ".gif"].some(
      (ext) => normalizedUrl.includes(ext) || normalizedName.endsWith(ext),
    );
  if (isImage) return "image";

  return "other";
};

const normalizeUpload = (e: { fileList?: UploadFile[] } | UploadFile[] | undefined) => {
  if (Array.isArray(e)) return e;
  return e?.fileList ?? [];
};

const categoryDisplayMap: Record<string, string> = {
  identity: "Identity",
  academic: "Academic",
  finance: "Finance",
  other: "Supporting",
  supporting: "Supporting",
  pribadi: "Identity",
  edukasi: "Academic",
  finansial: "Finance",
  lainnya: "Supporting",
  akademik: "Academic",
  identitas: "Identity",
  keuangan: "Finance",
};

const getCategoryBadgeLabel = (category?: string | null): string => {
  if (!category) return "";
  const key = category.trim().toLowerCase();
  return (
    categoryDisplayMap[key] ||
    (category.charAt(0).toUpperCase() + category.slice(1).toLowerCase())
  );
};

const cleanDocumentNotes = (notes?: string | null): string => {
  if (!notes) return "Format berkas PDF, PNG, JPG (Maks. 5MB)";
  return notes
    .replace(/\s*\/\s*/g, " atau ")
    .replace(/Format berkas:\s*/i, "Format berkas ")
    .trim();
};

type UploadedDocumentResponse = {
  url?: string;
  path?: string;
};

type UploadedDocumentFile = UploadFile<UploadedDocumentResponse>;

type DocumentFormValues = {
  documents?: Record<string, UploadedDocumentFile[] | undefined>;
};

type CustomRequestOptions = Parameters<
  NonNullable<UploadProps["customRequest"]>
>[0];

type DocumentStatusInfo = {
  color: string;
  background: string;
  label: string;
};

const buildAutoFileName = (
  pattern: string | undefined,
  file: File,
  context: {
    student_name?: string;
    document_label?: string;
    internal_code?: string;
    country_name?: string;
  },
) => {
  if (!pattern) {
    return sanitizeFileName(file.name);
  }

  const ext = getFileExt(file.name);
  let next = pattern;

  next = next.replaceAll("{studentName}", context.student_name ?? "student");
  next = next.replaceAll("{documentLabel}", context.document_label ?? "document");
  next = next.replaceAll("{internalCode}", context.internal_code ?? "DOC");
  next = next.replaceAll("{country}", context.country_name ?? "country");
  next = next.replaceAll("{ext}", ext.replace(".", ""));

  if (ext && !next.toLowerCase().endsWith(ext.toLowerCase())) {
    next = `${next}${ext}`;
  }

  return sanitizeFileName(next);
};

const getDocumentStatusInfo = (
  draftFile?: UploadedDocumentFile,
  existingFile?: AnswerDocumentDataModel,
): DocumentStatusInfo => {
  if (draftFile?.status === "uploading") {
    return {
      label: "Uploading",
      color: "#2563eb",
      background: "#eff6ff",
    };
  }

  if (draftFile?.status === "done") {
    return {
      label: "Ready to submit",
      color: "#16a34a",
      background: "#ecfdf5",
    };
  }

  if (draftFile?.status === "error") {
    return {
      label: "Upload failed",
      color: "#dc2626",
      background: "#fef2f2",
    };
  }

  if (existingFile?.file_url) {
    return {
      label: "Uploaded",
      color: "#16a34a",
      background: "#ecfdf5",
    };
  }

  return {
    label: "Not uploaded",
    color: "#ef4444",
    background: "#fff1f2",
  };
};

const summaryCardStyle = {
  borderRadius: 20,
  borderColor: "#e2e8f0",
  boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
  background: "#ffffff",
} satisfies CSSProperties;

const guidelineItems = [
  "Gunakan hasil pindai dokumen atau foto beresolusi tinggi dengan pencahayaan memadai.",
  "Pastikan seluruh teks, tanda tangan, dan stempel terbaca dengan jelas dan tidak buram.",
  "Unggah dokumen secara utuh tanpa terpotong di bagian sudut maupun tepi halaman.",
  "Pastikan nama lengkap dan tanggal lahir pada dokumen sesuai dengan paspor resmi.",
  "Dokumen yang diunggah harus dokumen asli atau resmi milik pemohon yang masih berlaku.",
];

type BulkMatchItem = {
  uid: string;
  file: File;
  matchedDocId: string;
  matchedLabel: string;
  confidence: number;
  isOcrLoading?: boolean;
  source?: "FILENAME" | "OCR" | "MANUAL" | "UNMATCHED";
  detectedNote?: string;
  isRejected?: boolean;
};

const isGenericFileName = (fileName: string): boolean => {
  const clean = fileName
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .trim();

  const genericPatterns = [
    /^camscanner/i,
    /^img[_\-\s\d]/i,
    /^scan[_\-\s\d]/i,
    /^scanned[_\-\s]/i,
    /^screenshot/i,
    /^document[_\-\s\d]*$/i,
    /^doc[_\-\s\d]*$/i,
    /^new doc/i,
    /^image[_\-\s\d]*$/i,
    /^photo[_\-\s\d]*$/i,
    /^pasted[_\-\s]/i,
    /^\d+$/,
    /^[\d\-_.\s()]+$/, // e.g. "02-12-2024 22.15(1)"
  ];

  return genericPatterns.some((pattern) => pattern.test(clean));
};

const findDocumentByOcrType = <T extends { id: string | number; label?: string; internal_code?: string }>(
  detectedType: string,
  availableDocs: T[],
): T | null => {
  const normType = String(detectedType || "").toUpperCase().trim();
  if (!normType || normType === "UNRECOGNIZED" || normType === "OTHER") return null;

  const ocrMapping: Record<string, string[]> = {
    PASSPORT: ["PASSPORT", "PASPOR", "PASPORT", "doc_pass"],
    NATIONAL_ID: [
      "NATIONAL_ID",
      "KTP",
      "ID_CARD",
      "IDCARD",
      "ID CARD",
      "doc_ktp",
      "IDENTITAS",
      "TANDA PENDUDUK",
      "KARTU TANDA PENDUDUK",
    ],
    KTP: [
      "NATIONAL_ID",
      "KTP",
      "ID_CARD",
      "IDCARD",
      "ID CARD",
      "doc_ktp",
      "IDENTITAS",
      "TANDA PENDUDUK",
      "KARTU TANDA PENDUDUK",
    ],
    FAMILY_CARD: ["FAMILY_CARD", "FAMILY CARD", "KK", "KARTU KELUARGA", "doc_family_card"],
    BIRTH_CERTIFICATE: [
      "BIRTH_CERTIFICATE",
      "BIRTH CERTIFICATE",
      "AKTA KELAHIRAN",
      "AKTA LAHIR",
      "AKTE LAHIR",
      "AKTE",
      "doc_birth_cert",
    ],
    IJAZAH: [
      "IJAZAH",
      "GRADUATION_CERTIFICATE",
      "BACHELOR_CERT",
      "HIGH_SCHOOL_CERT",
      "DIPLOMA_CERT",
      "SMA",
      "S1",
      "doc_ijzh",
    ],
    GRADUATION_CERTIFICATE: [
      "IJAZAH",
      "GRADUATION_CERTIFICATE",
      "BACHELOR_CERT",
      "HIGH_SCHOOL_CERT",
      "DIPLOMA_CERT",
      "SMA",
      "S1",
      "doc_ijzh",
    ],
    TRANSKRIP: [
      "TRANSKRIP",
      "TRANSCRIPT",
      "ACADEMIC_TRANSCRIPT",
      "DAFTAR NILAI",
      "doc_trns",
    ],
    ACADEMIC_TRANSCRIPT: [
      "TRANSKRIP",
      "TRANSCRIPT",
      "ACADEMIC_TRANSCRIPT",
      "DAFTAR NILAI",
      "doc_trns",
    ],
    ENG_CERT: ["ENG_CERT", "IELTS", "TOEFL", "PTE", "DET", "ENGLISH_TEST", "doc_ielts"],
    ENGLISH_TEST: ["ENG_CERT", "IELTS", "TOEFL", "PTE", "DET", "ENGLISH_TEST", "doc_ielts"],
    CURRICULUM_VITAE: ["CURRICULUM_VITAE", "CV", "RESUME", "doc_cv"],
    STATEMENT_OF_PURPOSE: [
      "STATEMENT_OF_PURPOSE",
      "STATEMENT_LETTER",
      "SOP",
      "GTE",
      "SURAT PERNYATAAN",
      "doc_sop",
    ],
    STATEMENT_LETTER: [
      "STATEMENT_OF_PURPOSE",
      "STATEMENT_LETTER",
      "SOP",
      "GTE",
      "SURAT PERNYATAAN",
      "doc_sop",
    ],
    RECOMMENDATION_LETTER: [
      "RECOMMENDATION_LETTER",
      "SURAT REKOMENDASI",
      "REKOMENDASI",
      "doc_rekomendasi",
    ],
    FINANCIAL: [
      "FINANCIAL",
      "REKENING KORAN",
      "BANK_STATEMENT",
      "SPONSOR_BANK_STMT",
      "doc_sponsor_bank_stmt",
      "SPONSOR_BANK_REF",
      "doc_sponsor_bank_ref",
      "BUKTI KEUANGAN",
      "TABUNGAN",
      "doc_bank",
    ],
    BANK_STATEMENT: [
      "SPONSOR_BANK_STMT",
      "doc_sponsor_bank_stmt",
      "FINANCIAL",
      "REKENING KORAN",
      "BANK_STATEMENT",
      "SPONSOR_BANK_REF",
      "doc_sponsor_bank_ref",
      "BUKTI KEUANGAN",
      "TABUNGAN",
      "doc_bank",
    ],
    SPONSOR_LETTER: [
      "SPONSOR_LETTER",
      "SPONSORSHIP_LETTER",
      "SURAT SPONSOR",
      "doc_sponsor",
    ],
    SPONSORSHIP_LETTER: [
      "SPONSOR_LETTER",
      "SPONSORSHIP_LETTER",
      "SURAT SPONSOR",
      "doc_sponsor",
    ],
    POLICE_CLEARANCE: [
      "POLICE_CLEARANCE",
      "SKCK",
      "CATATAN KEPOLISIAN",
      "doc_skck",
    ],
    MEDICAL_CHECKUP: [
      "MEDICAL_CHECKUP",
      "MEDICAL REPORT",
      "KESEHATAN",
      "MCU",
      "doc_medical",
    ],
    PLANE_TICKET: ["PLANE_TICKET", "TIKET PESAWAT", "FLIGHT TICKET", "doc_plane_ticket"],
    INVITATION_LETTER: ["INVITATION_LETTER", "SURAT UNDANGAN", "doc_invitation_letter"],
    PREV_VISA: ["PREV_VISA", "PREVIOUS VISA", "VISA GRANT", "VISA REFUSAL", "doc_prev_visa"],
    OLD_PASSPORT: ["OLD_PASSPORT", "PASPOR LAMA", "doc_old_passport"],
    PROOF_BUSINESS: ["PROOF_BUSINESS", "BUKTI USAHA", "doc_proof_business"],
    SPONSOR_SIGN: ["SPONSOR_SIGN", "TTD SPONSOR", "doc_sponsor_sign"],
    SPONSOR_BANK_REF: ["SPONSOR_BANK_REF", "REFERENSI BANK", "doc_sponsor_bank_ref"],
    SPONSOR_BANK_STMT: ["SPONSOR_BANK_STMT", "REKENING KORAN SPONSOR", "doc_sponsor_bank_stmt"],
    SPONSOR_LAND_ASSET: ["SPONSOR_LAND_ASSET", "SERTIFIKAT TANAH", "SHM", "doc_sponsor_land_asset", "SPONSOR_ASSET", "ASSET_CERTIFICATE", "SERTIFIKAT ASET", "BUKTI ASET", "LAND ASSET"],
    ASSET_CERTIFICATE: ["SPONSOR_LAND_ASSET", "doc_sponsor_land_asset", "SPONSOR_ASSET", "ASSET_CERTIFICATE", "SERTIFIKAT ASET", "BUKTI ASET"],
    SPONSOR_SIUP: ["SPONSOR_SIUP", "SIUP", "doc_sponsor_siup"],
    SPONSOR_NIB: ["SPONSOR_NIB", "NIB", "doc_sponsor_nib"],
    NPWP: ["NPWP", "NOMOR POKOK WAJIB PAJAK", "PAJAK", "doc_npwp"],
    SPONSOR_NPWP: ["SPONSOR_NPWP", "SPONSOR NPWP", "NPWP SPONSOR", "doc_sponsor_npwp"],
    PROFILE_PHOTO: ["PROFILE_PHOTO", "PAS_FOTO", "PASFOTO", "PAS_PHOTO", "doc_photo"],
    SPONSOR_ID: ["SPONSOR_ID", "SPONSOR_ID_CARD", "KTP SPONSOR", "SPONSOR KTP", "doc_sponsor_id"],
    STUDENT_SIGN: ["STUDENT_SIGN", "SIGN", "TANDA TANGAN", "SIGNATURE", "doc_sign"],
    HIGH_SCHOOL_CERT: ["HIGH_SCHOOL_CERT", "IJAZAH_SMA", "IJAZAH SMA", "HIGH SCHOOL CERT", "doc_ijzh_sma"],
    BACHELOR_CERT: ["BACHELOR_CERT", "IJAZAH_S1", "IJAZAH S1", "BACHELOR CERT", "doc_ijzh_s1"],
    DIPLOMA_CERT: ["DIPLOMA_CERT", "IJAZAH_D3", "IJAZAH D3", "DIPLOMA CERT", "doc_ijzh_d3"],
    DET_CERT: ["DET_CERT", "DET", "DUOLINGO", "DUOLINGO ENGLISH TEST", "doc_det"],
    SPONSOR_WORK_REF: ["SPONSOR_WORK_REF", "WORK REFERENCE", "SPONSOR WORK REFERENCE", "KETERANGAN KERJA SPONSOR", "doc_sponsor_work_ref"],
    ACADEMIC_REPORT: ["ACADEMIC_REPORT", "TRANSKRIP", "TRANSCRIPT", "RAPORT", "doc_trns"],
  };

  const codes = ocrMapping[normType] || [normType];
  const found = availableDocs.find((doc) => {
    const rawCode = String(doc.internal_code ?? "").toUpperCase();
    const rawLabel = String(doc.label ?? "").toUpperCase();
    const cleanCode = rawCode.replace(/[^A-Z0-9]/g, "");
    const cleanLabel = rawLabel.replace(/[^A-Z0-9]/g, "");

    return codes.some((c) => {
      const cleanC = c.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (!cleanC) return false;
      return (
        rawCode === c ||
        rawLabel === c ||
        cleanCode === cleanC ||
        cleanLabel === cleanC ||
        cleanCode.includes(cleanC) ||
        cleanLabel.includes(cleanC) ||
        cleanC.includes(cleanCode) ||
        cleanC.includes(cleanLabel)
      );
    });
  });

  return found ?? null;
};

const matchDocumentToSlot = (
  fileName: string,
  availableDocs: Array<{ id: string | number; label?: string; internal_code?: string; category?: string; file_type?: string }>,
): { doc: (typeof availableDocs)[0]; confidence: number } | null => {
  if (!availableDocs.length) return null;
  if (isGenericFileName(fileName)) return null;

  const cleanName = fileName
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/[_\-+.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const keywordMap: Array<{ keywords: string[]; codes: string[] }> = [
    { keywords: ["paspor", "passport"], codes: ["PASSPORT", "doc_pass"] },
    { keywords: ["ktp", "national id", "identitas", "id card", "tanda penduduk"], codes: ["NATIONAL_ID", "ID_CARD", "doc_ktp", "KTP"] },
    { keywords: ["kk", "kartu keluarga", "family card"], codes: ["FAMILY_CARD", "doc_family_card"] },
    { keywords: ["akta lahir", "akte lahir", "akta kelahiran", "akte kelahiran", "birth certificate"], codes: ["BIRTH_CERTIFICATE", "doc_birth_cert"] },
    { keywords: ["pasfoto", "pas foto", "foto formal", "photo formal", "formal photo", "4x6", "3x4", "foto paspor", "pasfoto formal", "profile photo", "photo", "foto"], codes: ["PROFILE_PHOTO", "doc_photo"] },
    { keywords: ["ijazah sma", "high school certificate", "high school cert", "smk", "sma", "smu", "sekolah menengah"], codes: ["HIGH_SCHOOL_CERT", "doc_ijzh_sma"] },
    { keywords: ["ijazah s1", "bachelor certificate", "bachelor cert", "sarjana", "strata 1"], codes: ["BACHELOR_CERT", "doc_ijzh_s1"] },
    { keywords: ["ijazah d3", "diploma certificate", "diploma cert", "ahli madya", "vokasi"], codes: ["DIPLOMA_CERT", "doc_ijzh_d3"] },
    { keywords: ["ijazah", "graduation cert", "surat tanda tamat belajar", "sttb"], codes: ["IJAZAH", "GRADUATION_CERTIFICATE", "doc_ijzh"] },
    { keywords: ["transkrip", "transcript", "daftar nilai", "kartu hasil studi"], codes: ["TRANSKRIP", "TRANSCRIPT", "doc_trns"] },
    { keywords: ["duolingo", "det cert", "duolingo english test"], codes: ["DET_CERT", "doc_det"] },
    { keywords: ["ielts", "toefl", "pte", "english cert", "bahasa inggris", "sertifikat bahasa"], codes: ["ENG_CERT", "IELTS", "doc_ielts"] },
    { keywords: ["cv", "curriculum vitae", "resume"], codes: ["CURRICULUM_VITAE", "doc_cv"] },
    { keywords: ["sop", "statement of purpose", "gte", "motivation letter", "surat motivasi"], codes: ["STATEMENT_OF_PURPOSE", "doc_sop"] },
    { keywords: ["sponsor bank statement", "rekening koran sponsor", "sponsor bank", "bank statement sponsor", "bank dokumen sponsor", "bank documents", "father bank", "mother bank", "bank ayah", "bank ibu", "bank penjamin", "bank sponsor"], codes: ["SPONSOR_BANK_STMT", "doc_sponsor_bank_stmt"] },
    { keywords: ["sponsor bank reference", "referensi bank sponsor", "sponsor bank ref", "bank reference sponsor", "bank ref sponsor"], codes: ["SPONSOR_BANK_REF", "doc_sponsor_bank_ref"] },
    { keywords: ["rekening", "koran", "bank statement", "tabungan", "financial", "keuangan"], codes: ["FINANCIAL", "BANK_STATEMENT", "doc_bank"] },
    { keywords: ["sponsor land", "tanah sponsor", "land asset", "sertifikat tanah", "shm", "sponsor asset", "asset certificate", "sertifikat aset", "bukti aset", "aset sponsor", "asset sponsor", "daftar aset", "kepemilikan aset"], codes: ["SPONSOR_LAND_ASSET", "doc_sponsor_land_asset"] },
    { keywords: ["sponsor siup", "siup sponsor", "siup"], codes: ["SPONSOR_SIUP", "doc_sponsor_siup"] },
    {
      keywords: [
        "proof of business",
        "proof business",
        "bukti usaha",
        "business photos",
        "business photo",
        "foto usaha",
        "business supplier",
        "supplier photos",
        "business leasing",
        "leasing photos",
        "business reference",
        "referensi usaha",
        "foto toko",
        "foto tempat kerja",
        "supplier",
        "leasing",
      ],
      codes: ["PROOF_BUSINESS", "doc_proof_business"],
    },
    { keywords: ["sponsor nib", "nib sponsor", "nib"], codes: ["SPONSOR_NIB", "doc_sponsor_nib"] },
    {
      keywords: [
        "sponsor work",
        "keterangan kerja sponsor",
        "work reference sponsor",
        "sponsor work reference",
        "work certificate",
        "certificate of employment",
        "surat keterangan kerja",
        "keterangan kerja",
        "surat kerja",
        "work reference",
        "pengalaman kerja",
      ],
      codes: ["SPONSOR_WORK_REF", "doc_sponsor_work_ref"],
    },
    { keywords: ["sponsor npwp", "npwp sponsor", "npwp ayah", "npwp ibu", "npwp ortu", "npwp orang tua", "npwp penjamin", "sponsor tax", "tax sponsor", "tax card", "father tax", "mother tax", "tax ayah", "tax ibu", "tax penjamin"], codes: ["SPONSOR_NPWP", "doc_sponsor_npwp"] },
    { keywords: ["sponsor ktp", "sponsor id", "ktp sponsor", "ktp ayah", "ktp ibu", "ktp ortu", "ktp penjamin"], codes: ["SPONSOR_ID", "doc_sponsor_id"] },
    {
      keywords: [
        "sponsor sign",
        "sign sponsor",
        "sponsor signature",
        "signature sponsor",
        "signature father",
        "father signature",
        "father sign",
        "sign father",
        "signature mother",
        "mother signature",
        "mother sign",
        "sign mother",
        "parent sign",
        "sign parent",
        "parent signature",
        "signature parent",
        "ttd sponsor",
        "ttd ayah",
        "ttd ibu",
        "ttd ortu",
        "ttd orang tua",
        "ttd penjamin",
        "tanda tangan sponsor",
        "tanda tangan ayah",
        "tanda tangan ibu",
        "tanda tangan penjamin",
        "tanda tangan orang tua",
        "tanda tangan parent",
      ],
      codes: ["SPONSOR_SIGN", "doc_sponsor_sign"],
    },
    { keywords: ["student sign", "tanda tangan student", "ttd student", "sign student", "student signature"], codes: ["STUDENT_SIGN", "doc_sign"] },
    { keywords: ["tanda tangan", "signature", "ttd", "sign"], codes: ["STUDENT_SIGN", "doc_sign"] },
    { keywords: ["surat sponsor", "sponsor letter", "pernyataan sponsor"], codes: ["SPONSOR_LETTER", "doc_sponsor"] },
    { keywords: ["skck", "police clearance", "kepolisian"], codes: ["POLICE_CLEARANCE", "doc_skck"] },
    { keywords: ["medical", "kesehatan", "checkup", "check up", "dokter"], codes: ["MEDICAL_CHECKUP", "doc_medical"] },
    { keywords: ["tiket", "ticket", "pesawat", "flight", "plane"], codes: ["PLANE_TICKET", "AIRLINE_TICKET"] },
    { keywords: ["undangan", "invitation"], codes: ["INVITATION_LETTER"] },
    { keywords: ["previous visa", "visa grant", "visa refusal", "visa lama", "visa"], codes: ["PREVIOUS_VISA", "VISA_GRANT_REFUSAL"] },
    { keywords: ["old passport", "paspor lama"], codes: ["OLD_PASSPORT"] },
    { keywords: ["npwp", "nomor pokok wajib pajak", "kartu npwp"], codes: ["NPWP", "doc_npwp"] },
  ];

  let bestDoc: (typeof availableDocs)[0] | null = null;
  let bestScore = 0;

  for (const doc of availableDocs) {
    let score = 0;
    const docCode = String(doc.internal_code ?? "").toUpperCase();
    const docLabel = String(doc.label ?? "").toLowerCase();
    const docId = String(doc.id).toUpperCase();

    // PROTEKSI: Jika nama berkas adalah Foto Usaha / Sponsor / Bisnis, JANGAN PERNAH cocokkan ke Pasfoto Mahasiswa
    const isBusinessOrSponsorPhoto =
      cleanName.includes("business") ||
      cleanName.includes("usaha") ||
      cleanName.includes("toko") ||
      cleanName.includes("leasing") ||
      cleanName.includes("supplier") ||
      cleanName.includes("sponsor");
    if (isBusinessOrSponsorPhoto && (docCode === "PROFILE_PHOTO" || docId === "DOC_PHOTO")) {
      continue;
    }

    // PROTEKSI: Jika nama berkas adalah Foto Santai, JANGAN cocokkan ke Pasfoto Formal
    const isCasualPhoto =
      cleanName.includes("canggu") ||
      cleanName.includes("pantai") ||
      cleanName.includes("beach") ||
      cleanName.includes("santai") ||
      cleanName.includes("casual") ||
      cleanName.includes("liburan") ||
      cleanName.includes("vacation") ||
      cleanName.includes("holiday") ||
      cleanName.includes("wisata") ||
      cleanName.includes("black sand");
    if (isCasualPhoto && (docCode === "PROFILE_PHOTO" || docId === "DOC_PHOTO")) {
      continue;
    }

    // PROTEKSI: Jika nama berkas adalah Rapor / Transkrip / Nilai, JANGAN PERNAH cocokkan ke slot Ijazah Kelulusan
    const isRaportOrTranscript =
      cleanName.includes("raport") ||
      cleanName.includes("rapor") ||
      cleanName.includes("report") ||
      cleanName.includes("nilai") ||
      cleanName.includes("transkrip") ||
      cleanName.includes("transcript") ||
      cleanName.includes("kartu hasil studi") ||
      cleanName.includes("khs");
    if (isRaportOrTranscript && (docCode.includes("CERT") || docCode.includes("IJAZAH") || docId.includes("DOC_IJZH"))) {
      continue;
    }

    // PROTEKSI: Jika slot adalah KTP Sponsor, nama berkas WAJIB memiliki indikasi KTP / ID Card eksplisit
    const isSponsorIdSlot = docCode === "SPONSOR_ID" || docId === "DOC_SPONSOR_ID";
    const hasExplicitKtpOrId =
      cleanName.includes("ktp") ||
      cleanName.includes("id card") ||
      cleanName.includes("identitas") ||
      cleanName.includes("tanda penduduk");
    if (isSponsorIdSlot && !hasExplicitKtpOrId) {
      continue;
    }

    // PROTEKSI: Jika nama berkas adalah NPWP / Pajak, JANGAN PERNAH cocokkan ke slot KTP / Identitas
    const isTaxFileName = cleanName.includes("npwp") || cleanName.includes("pajak") || cleanName.includes("tax");
    if (isTaxFileName && (docCode === "SPONSOR_ID" || docCode === "NATIONAL_ID" || docId === "DOC_SPONSOR_ID" || docId === "DOC_KTP")) {
      continue;
    }

    // PROTEKSI: Jika nama berkas adalah KTP / Identitas, JANGAN PERNAH cocokkan ke slot NPWP / Pajak
    const isKtpFileName = cleanName.includes("ktp") || cleanName.includes("id card") || cleanName.includes("identitas");
    if (isKtpFileName && (docCode === "SPONSOR_NPWP" || docCode === "NPWP" || docId === "DOC_SPONSOR_NPWP" || docId === "DOC_NPWP")) {
      continue;
    }

    // PROTEKSI: Jika nama berkas adalah Bank / Keuangan, JANGAN PERNAH cocokkan ke slot bahasa / sertifikat
    const isBankFileName =
      cleanName.includes("bank") ||
      cleanName.includes("rekening") ||
      cleanName.includes("financial") ||
      cleanName.includes("tabungan") ||
      cleanName.includes("koran");
    if (isBankFileName && (docCode === "ENG_CERT" || docCode === "DET_CERT" || docId === "DOC_IELTS" || docId === "DOC_DET")) {
      continue;
    }

    // PROTEKSI: Jika nama berkas adalah Tanda Tangan Sponsor / Ayah / Ibu, JANGAN PERNAH cocokkan ke slot Tanda Tangan Student
    const isSponsorSignFileName =
      (cleanName.includes("sponsor") ||
        cleanName.includes("father") ||
        cleanName.includes("mother") ||
        cleanName.includes("ayah") ||
        cleanName.includes("ibu") ||
        cleanName.includes("penjamin") ||
        cleanName.includes("parent")) &&
      (cleanName.includes("sign") ||
        cleanName.includes("ttd") ||
        cleanName.includes("signature") ||
        cleanName.includes("tanda tangan"));
    if (isSponsorSignFileName && (docCode === "STUDENT_SIGN" || docId === "DOC_SIGN")) {
      continue;
    }

    // PROTEKSI: Jika nama berkas adalah Tanda Tangan Student, JANGAN PERNAH cocokkan ke slot Tanda Tangan Sponsor
    const isStudentSignFileName =
      (cleanName.includes("student") || cleanName.includes("mahasiswa")) &&
      (cleanName.includes("sign") ||
        cleanName.includes("ttd") ||
        cleanName.includes("signature") ||
        cleanName.includes("tanda tangan"));
    if (isStudentSignFileName && (docCode === "SPONSOR_SIGN" || docId === "DOC_SPONSOR_SIGN")) {
      continue;
    }

    // PROTEKSI: Slot Tanda Tangan Sponsor WAJIB memiliki indikasi sponsor pada nama berkas
    if ((docCode === "SPONSOR_SIGN" || docId === "DOC_SPONSOR_SIGN") && !isSponsorSignFileName) {
      continue;
    }

    for (const rule of keywordMap) {
      const codeMatches = rule.codes.some(c => c.toUpperCase() === docCode || c.toUpperCase() === docId);
      if (codeMatches) {
        for (const kw of rule.keywords) {
          if (cleanName.includes(kw)) {
            score += 100;
            break;
          }
        }
      }
    }

    const stopWords = new Set([
      "dan", "atau", "the", "and", "for", "with", "dari", "pada", "yang",
      "surat", "dokumen", "document", "sponsor", "card", "high", "school",
      "certificate", "foto", "photo", "bukti", "keterangan"
    ]);
    const labelWords = docLabel.split(/[\s/()]+/).filter((w) => w.length > 2 && !stopWords.has(w));
    for (const w of labelWords) {
      if (cleanName.includes(w)) {
        score += 25;
      }
    }

    if (docCode && cleanName.toUpperCase().includes(docCode)) {
      score += 80;
    }

    if (score > bestScore) {
      bestScore = score;
      bestDoc = doc;
    }
  }

  if (bestDoc && bestScore >= 60) {
    const confidence = Math.min(99, Math.max(70, Math.round(50 + bestScore / 2)));
    return { doc: bestDoc, confidence };
  }

  return null;
};

export default function CountryDocumentComponent() {
  const { notification } = App.useApp();
  const [docForm] = Form.useForm<DocumentFormValues>();
  const watchedDocuments = Form.useWatch("documents", docForm);
  const [activeDocumentId, setActiveDocumentId] = useState<string>("");
  const [docSearchQuery, setDocSearchQuery] = useState<string>("");
  const [docFilterCategory, setDocFilterCategory] = useState<
    "all" | "required" | "optional" | "pending" | "uploaded"
  >("all");

  const { user_id } = useAuth();
  const { data: currentUser, fetchLoading: userLoading } = useUser({ id: user_id });
  const { data: masterDocuments = [], fetchLoading: masterDocsLoading } = useDocuments({});
  const { data: stages, fetchLoading: stagesLoading } = useStagesManagement({});
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: visaTypes = [] } = useVisaTypes();
  const { uploadDocument } = useDocumentUpload();
  const effectiveStudentId = String(currentUser?.id ?? user_id ?? "");

  const [tourOpen, setTourOpen] = useState(false);
  const closeTour = () => setTourOpen(false);
  const restartTour = () => setTourOpen(true);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitSuccessModalOpen, setSubmitSuccessModalOpen] = useState(false);

  const tourSteps: TourProps["steps"] = [
    {
      title: "Unggah Dokumen",
      description:
        "Halaman ini digunakan untuk mengunggah seluruh dokumen persyaratan yang diperlukan dalam pengajuan visa Anda.",
      target: null,
    },
    {
      title: "Informasi Aplikasi",
      description:
        "Menampilkan negara tujuan, jenis visa, dan status fitur penamaan dokumen otomatis.",
      target: () => document.getElementById("docs-header")!,
      placement: "bottom",
    },
    {
      title: "Daftar Dokumen",
      description:
        "Daftar dokumen persyaratan yang harus dipenuhi beserta status pengunggahan masing-masing berkas.",
      target: () => document.getElementById("docs-selector")!,
      placement: "bottom",
    },
    {
      title: "Area Unggah Dokumen",
      description:
        "Tarik dan letakkan file ke area ini, atau klik untuk memilih file dari perangkat Anda.",
      target: () => document.getElementById("docs-upload-area")!,
      placement: "top",
    },
    {
      title: "Status Kelengkapan",
      description:
        "Pantau jumlah dokumen yang telah diunggah dan dokumen yang masih belum dilengkapi.",
      target: () => document.getElementById("docs-progress-card")!,
      placement: "left",
    },
    {
      title: "Pengajuan untuk Peninjauan",
      description:
        "Setelah seluruh dokumen wajib terpenuhi, kirim dokumen untuk diverifikasi oleh tim admission.",
      target: () => document.getElementById("docs-submit-btn")!,
      placement: "top",
    },
  ];

  const {
    data: answerDocuments,
    fetchLoading: answerDocumentsLoading,
    onCreate: submitDocuments,
    onCreateLoading: submittingDocuments,
    onDelete: deleteAnswerDocument,
  } = useAnswerDocuments({
    queryString: effectiveStudentId ? `student_id=${effectiveStudentId}` : undefined,
    enabled: Boolean(effectiveStudentId),
  });

  const { classifyFile } = useOCRClassifier();

  // Bulk upload & auto-matching state
  const [bulkFiles, setBulkFiles] = useState<BulkMatchItem[]>([]);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");

  // Mobile viewport detection
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preview modal state
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<{
    url: string;
    rawUrl?: string;
    name: string;
    label: string;
    type?: string;
  } | null>(null);
  const [imgError, setImgError] = useState(false);
  const [htmlPreviewContent, setHtmlPreviewContent] = useState<string | null>(null);
  const [htmlPreviewLoading, setHtmlPreviewLoading] = useState(false);

  useEffect(() => {
    setImgError(false);
    if (!previewModalOpen || !previewItem?.url) {
      setHtmlPreviewContent(null);
      setHtmlPreviewLoading(false);
      return;
    }

    const urlLower = previewItem.url.toLowerCase();
    const nameLower = previewItem.name.toLowerCase();
    const typeLower = (previewItem.type || "").toLowerCase();
    const isHtml =
      urlLower.includes(".html") ||
      urlLower.includes(".htm") ||
      nameLower.endsWith(".html") ||
      nameLower.endsWith(".htm") ||
      typeLower.includes("html") ||
      nameLower.includes("_cv");

    if (isHtml) {
      setHtmlPreviewLoading(true);
      fetch(previewItem.url)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal mengambil berkas HTML");
          return res.text();
        })
        .then((html) => {
          setHtmlPreviewContent(html);
        })
        .catch(() => {
          setHtmlPreviewContent(null);
        })
        .finally(() => {
          setHtmlPreviewLoading(false);
        });
    } else {
      setHtmlPreviewContent(null);
      setHtmlPreviewLoading(false);
    }
  }, [previewModalOpen, previewItem]);

  // Single file uploading state per docId
  const [singleUploading, setSingleUploading] = useState<Record<string, boolean>>({});
  // Single file deleting state per docId
  const [singleDeleting, setSingleDeleting] = useState<Record<string, boolean>>({});

  const handleOpenPreview = (
    url: string,
    name: string,
    label: string,
    type?: string,
    rawUrl?: string,
  ) => {
    setImgError(false);
    setPreviewItem({ url, rawUrl: rawUrl || url, name, label, type });
    setPreviewModalOpen(true);
  };

  const countryDocuments = useMemo(() => {
    const countryId = currentUser?.stage?.country_id;

    // 1. Ambil dokumen spesifik stage negara tujuan jika sudah diset
    const stageDocs = countryId
      ? (stages ?? [])
          .filter((stage) => stage.country_id === countryId)
          .map((stage) => stage.document)
          .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
      : [];

    const stageDocIdSet = new Set<string>();
    const docMap = new Map<string, (typeof masterDocuments)[number]>();

    if (stageDocs.length > 0) {
      // 2. Masukkan dokumen stage negara sesuai status required aslinya dari master doc
      stageDocs.forEach((doc) => {
        if (doc?.id) {
          const idStr = String(doc.id);
          const masterMatch = (masterDocuments ?? []).find((d) => String(d.id) === idStr);
          const isReq = masterMatch !== undefined ? Boolean(masterMatch.required) : Boolean(doc.required);
          docMap.set(idStr, { ...doc, required: isReq });
          stageDocIdSet.add(idStr);
        }
      });
    } else {
      // 3. Fallback jika belum ada konfigurasi stage negara, gunakan dokumen master
      (masterDocuments ?? []).forEach((doc) => {
        if (doc?.id) {
          docMap.set(String(doc.id), doc);
        }
      });
    }

    // 4. Pastikan semua dokumen yang pernah diunggah oleh student ini selalu muncul di daftar
    // Cegah duplikasi slot jika dokumen dengan tipe standar yang sama sudah terdaftar di stage negara
    const existingStandardLabels = new Set(
      Array.from(docMap.values()).map((d) => normalizeDocumentLabel(d)),
    );

    (answerDocuments ?? []).forEach((ans) => {
      const docId = String(ans.document_id);
      if (docMap.has(docId)) return;

      const masterMatch = (masterDocuments ?? []).find(
        (d) => String(d.id) === docId || d.internal_code === docId,
      );

      const candidateDoc = masterMatch || {
        id: docId,
        label: ans.file_name ? ans.file_name.replace(/\.[^/.]+$/, "") : "Dokumen Terunggah",
        internal_code: "UPLOADED_DOC",
        file_type: ans.file_type || "pdf",
        category: "General",
        example_url: null,
        translation_needed: "NO" as any,
        required: false,
        auto_rename_pattern: "NONE" as any,
        notes: "Dokumen yang telah berhasil diunggah",
        created_at: ans.created_at,
        updated_at: ans.updated_at,
      };

      const stdLabel = normalizeDocumentLabel(candidateDoc);
      if (existingStandardLabels.has(stdLabel)) {
        return;
      }

      docMap.set(docId, candidateDoc as any);
      existingStandardLabels.add(stdLabel);
    });

    // 5. Prioritaskan nama dokumen kustom yang diatur di master data, lalu urutkan
    const normalizedDocs = Array.from(docMap.values()).map((doc) => {
      const userLabel = doc.label ? String(doc.label).trim() : "";
      return {
        ...doc,
        label: userLabel || normalizeDocumentLabel(doc),
        required:
          doc.required !== undefined && doc.required !== null
            ? Boolean(doc.required)
            : getStandardDocumentRequired(doc),
      };
    });

    return normalizedDocs.sort((a, b) => {
      const orderA = getStandardDocumentOrder(a);
      const orderB = getStandardDocumentOrder(b);
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return String(a.label ?? "").localeCompare(String(b.label ?? ""));
    });
  }, [currentUser?.stage?.country_id, stages, masterDocuments, answerDocuments]);

  const documentMap = useMemo(() => {
    return new Map(countryDocuments.map((doc) => [String(doc.id), doc]));
  }, [countryDocuments]);

  const latestAnswerByDocumentId = useMemo(() => {
    const map = new Map<string, AnswerDocumentDataModel>();

    (answerDocuments ?? []).forEach((item) => {
      const key = String(item.document_id);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, item);
        return;
      }

      const existingTime = Date.parse(existing.created_at);
      const nextTime = Date.parse(item.created_at);

      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        map.set(key, item);
      }
    });

    return map;
  }, [answerDocuments]);

  const occupiedDocumentIds = useMemo(() => {
    const set = new Set<string>();
    (answerDocuments ?? []).forEach((ans) => {
      const docIdStr = String(ans.document_id);
      set.add(docIdStr);
      const matched = countryDocuments.find(
        (d) => String(d.id) === docIdStr || d.internal_code === docIdStr,
      );
      if (matched) {
        set.add(String(matched.id));
        if (matched.internal_code) {
          set.add(matched.internal_code);
        }
      }
    });

    const hasVerifiedOnboardingSignature = Boolean(
      currentUser?.document_consent_signature_url ||
      currentUser?.statement_letter_file_url,
    );
    if (hasVerifiedOnboardingSignature) {
      set.add("doc_sign");
      set.add("STUDENT_SIGN");
    }

    return set;
  }, [answerDocuments, countryDocuments, currentUser]);

  const isDocumentOccupied = useCallback(
    (doc: { id: string | number; internal_code?: string }) => {
      const idStr = String(doc.id);
      const codeStr = String(doc.internal_code || "");
      return occupiedDocumentIds.has(idStr) || (codeStr ? occupiedDocumentIds.has(codeStr) : false);
    },
    [occupiedDocumentIds],
  );

  const handleSingleDocUpload = async (doc: (typeof countryDocuments)[number], file: File) => {
    const docId = String(doc.id);
    if (!isAllowedUploadSize(file)) {
      notification.error({
        message: "Ukuran file terlalu besar",
        description: buildUploadSizeErrorMessage(file.name),
      });
      return false;
    }

    const singleNotifyKey = `single-upload-${docId}`;

    try {
      setSingleUploading((prev) => ({ ...prev, [docId]: true }));
      notification.open({
        key: singleNotifyKey,
        icon: <LoadingOutlined spin style={{ color: "#2563eb" }} />,
        message: `Memindai ${doc.label} dengan OCR...`,
        duration: 0,
      });

      // Verifikasi kecocokan dokumen menggunakan OCR
      try {
        const ocrRes = await classifyFile({
          file,
          expected_code: doc.internal_code,
          expected_label: doc.label,
        });

        if (ocrRes) {
          if (ocrRes.status === "MISMATCH") {
            notification.warning({
              message: `Dokumen terdeteksi sebagai ${ocrRes.detected_label || ocrRes.detected_type}`,
            });
          }

          if (ocrRes.extracted_fields?.full_name && currentUser?.name) {
            const nameCheck = compareStudentNameWithOCR(
              ocrRes.extracted_fields.full_name,
              currentUser.name,
            );
            if (nameCheck.status === "MISMATCH") {
              notification.warning({
                message: "Nama pada berkas berbeda dengan profil akun",
              });
            }
          }
        }
      } catch {
        // Fallback jika API OCR sedang sibuk, proses penyimpanan dokumen tetap diteruskan
      }

      const studentDisplayName = currentUser?.name ?? "Student";
      const standardFileName = generateStandardFileName({
        pattern: doc.auto_rename_pattern,
        studentName: studentDisplayName,
        documentCode: doc.internal_code,
        originalFileName: file.name,
      });
      const userId = effectiveStudentId || "student";
      const path = `documents/${userId}/${doc.id}/${standardFileName}`;
      const studentFolderKey = `${studentDisplayName}-${userId}`;

      const result = await uploadDocument({
        file,
        path,
        content_type: file.type,
        student_folder_key: studentFolderKey,
      });

      if (result?.url && effectiveStudentId) {
        await submitDocuments([
          {
            document_id: docId,
            student_id: effectiveStudentId,
            file_name: standardFileName,
            file_url: result.url,
            file_path: result.path,
            file_type: file.type,
            status: "done",
          },
        ]);
      }

      notification.success({
        key: singleNotifyKey,
        message: `${doc.label} berhasil disimpan`,
      });
    } catch (err) {
      notification.error({
        key: singleNotifyKey,
        message: "Gagal mengunggah dokumen",
      });
    } finally {
      setSingleUploading((prev) => ({ ...prev, [docId]: false }));
    }

    return false;
  };

  const handleDeleteDoc = async (doc: (typeof countryDocuments)[number]) => {
    const docId = String(doc.id);
    const matchingAnswers = (answerDocuments ?? []).filter(
      (item) =>
        String(item.document_id) === docId ||
        (doc.internal_code && String(item.document_id) === String(doc.internal_code)),
    );

    try {
      setSingleDeleting((prev) => ({ ...prev, [docId]: true }));

      if (matchingAnswers.length > 0) {
        await Promise.all(
          matchingAnswers.map((item) => deleteAnswerDocument(item.id)),
        );
      }

      docForm.setFieldValue(["documents", docId], undefined);
      if (doc.internal_code) {
        docForm.setFieldValue(["documents", doc.internal_code], undefined);
      }

      notification.success({
        message: "Dokumen Berhasil Dihapus",
        description: `Berkas untuk ${doc.label} telah berhasil dikosongkan.`,
      });
    } catch (err) {
      notification.error({
        message: "Gagal Menghapus Dokumen",
        description:
          err instanceof Error ? err.message : "Terjadi kesalahan saat menghapus dokumen.",
      });
    } finally {
      setSingleDeleting((prev) => ({ ...prev, [docId]: false }));
    }
  };

  const handleBulkFilesSelect = async (fileList: File[]) => {
    if (!fileList || !fileList.length) return;

    setIsProcessingFiles(true);
    setProcessingStatus(`Memindai ${fileList.length} berkas dokumen...`);

    const bulkNotifyKey = "bulk-ocr-process";
    notification.open({
      key: bulkNotifyKey,
      icon: <LoadingOutlined spin style={{ color: "#2563eb" }} />,
      message: `Memindai ${fileList.length} berkas dengan OCR...`,
      duration: 0,
    });

    const unmappedItems: BulkMatchItem[] = [];
    const skippedItems: Array<{ fileName: string; reason: string }> = [];
    const rejectedItems: Array<{ fileName: string; reason: string }> = [];
    const studentDisplayName = currentUser?.name ?? "Student";
    const userId = effectiveStudentId || "student";
    const studentFolderKey = `${studentDisplayName}-${userId}`;
    const claimedDocIds = new Set<string>();
    const hasVerifiedOnboardingSignature = Boolean(
      currentUser?.document_consent_signature_url ||
      currentUser?.statement_letter_file_url,
    );
    let successCount = 0;

    const isSlotAvailable = (doc: {
      id: string | number;
      internal_code?: string;
      label?: string;
    }) => {
      const idStr = String(doc.id);
      const codeStr = String(doc.internal_code || "");
      if (claimedDocIds.has(idStr) || (codeStr && claimedDocIds.has(codeStr))) {
        return false;
      }
      if (isDocumentOccupied(doc)) {
        return false;
      }
      return true;
    };

    for (let idx = 0; idx < fileList.length; idx++) {
      const file = fileList[idx];
      setProcessingStatus(`Memeriksa berkas "${file.name}" (${idx + 1}/${fileList.length})...`);

      // 1. Coba pencocokan nama file jika bukan nama generik
      let targetDoc: (typeof countryDocuments)[number] | null = null;
      let matchSource: "FILENAME" | "OCR" = "FILENAME";
      let confidence = 0;
      let ocrDetectedNote = "";
      let isExplicitlyRejected = false;
      let ocrMatchedDoc: (typeof countryDocuments)[number] | null = null;
      let currentOcrRes: OCRClassifyResultModel | null = null;

      const filenameMatch = matchDocumentToSlot(file.name, countryDocuments);
      if (filenameMatch && filenameMatch.doc && filenameMatch.confidence >= 75) {
        const found = countryDocuments.find((d) => String(d.id) === String(filenameMatch.doc?.id));
        if (found) {
          const isStudentSign =
            String(found.id) === "doc_sign" || String(found.internal_code) === "STUDENT_SIGN";

          if (isStudentSign && hasVerifiedOnboardingSignature) {
            isExplicitlyRejected = true;
            ocrDetectedNote =
              "Tanda tangan mahasiswa sudah terverifikasi resmi dari onboarding. Berkas bulk upload dilewati agar tidak menduplikasi data.";
          } else if (!isSlotAvailable(found)) {
            // Slot sudah terisi atau di-claim, cek alternatif slot kosong
            let alternativeDoc: (typeof countryDocuments)[number] | null = null;
            const code = String(found.internal_code || "");
            const idStr = String(found.id);

            if (idStr === "doc_ktp" || code === "NATIONAL_ID" || code === "KTP") {
              const sponsorDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_sponsor_id" || String(d.internal_code) === "SPONSOR_ID",
              );
              if (sponsorDoc && isSlotAvailable(sponsorDoc)) {
                alternativeDoc = sponsorDoc;
              }
            } else if (idStr === "doc_npwp" || code === "NPWP") {
              const sponsorNpwpDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_sponsor_npwp" || String(d.internal_code) === "SPONSOR_NPWP",
              );
              if (sponsorNpwpDoc && isSlotAvailable(sponsorNpwpDoc)) {
                alternativeDoc = sponsorNpwpDoc;
              }
            } else if (idStr === "doc_bank" || code === "BANK_STATEMENT" || code === "FINANCIAL") {
              const sponsorBankDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_sponsor_bank_stmt" || String(d.internal_code) === "SPONSOR_BANK_STMT",
              );
              if (sponsorBankDoc && isSlotAvailable(sponsorBankDoc)) {
                alternativeDoc = sponsorBankDoc;
              }
            } else if (idStr === "doc_cert" || code === "HIGHSCHOOL_CERT" || code === "IJAZAH") {
              const transcriptDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_trns" ||
                  String(d.internal_code) === "TRANSCRIPT" ||
                  String(d.internal_code) === "TRANSKRIP",
              );
              if (transcriptDoc && isSlotAvailable(transcriptDoc)) {
                alternativeDoc = transcriptDoc;
              }
            } else if (idStr === "doc_trns" || code === "TRANSCRIPT" || code === "TRANSKRIP") {
              const certDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_cert" ||
                  String(d.internal_code) === "HIGHSCHOOL_CERT" ||
                  String(d.internal_code) === "IJAZAH",
              );
              if (certDoc && isSlotAvailable(certDoc)) {
                alternativeDoc = certDoc;
              }
            }

            if (alternativeDoc) {
              targetDoc = alternativeDoc;
              confidence = filenameMatch.confidence;
            } else {
              isExplicitlyRejected = true;
              ocrDetectedNote = `Slot ${found.label} sudah terisi. Berkas dilewati (skip) agar tidak menimpa dokumen yang sudah ada.`;
            }
          } else {
            targetDoc = found;
            confidence = filenameMatch.confidence;
          }
        }
      }

      // 2. Jika nama file acak/generik atau belum cocok, verifikasi isi dokumen langsung via OCR
      if (!targetDoc && !isExplicitlyRejected && !ocrDetectedNote) {
        try {
          setProcessingStatus(`Memverifikasi jenis dokumen: "${file.name}"...`);
          const fileNameLower = file.name.toLowerCase();
          const isCommercialOrOutOfScope =
            fileNameLower.includes("business plan") ||
            fileNameLower.includes("table manner") ||
            fileNameLower.includes("rencana bisnis");

          const isCasualPhoto =
            fileNameLower.includes("canggu") ||
            fileNameLower.includes("pantai") ||
            fileNameLower.includes("beach") ||
            fileNameLower.includes("santai") ||
            fileNameLower.includes("casual") ||
            fileNameLower.includes("liburan") ||
            fileNameLower.includes("vacation") ||
            fileNameLower.includes("wisata") ||
            fileNameLower.includes("black sand");

          const isPhotoFileName =
            (fileNameLower.includes("photo") || fileNameLower.includes("foto")) &&
            !fileNameLower.includes("business") &&
            !fileNameLower.includes("usaha") &&
            !fileNameLower.includes("sponsor") &&
            !fileNameLower.includes("supplier") &&
            !fileNameLower.includes("leasing") &&
            !isCasualPhoto;

          const ocrRes = await classifyFile({ file });
          if (ocrRes && ocrRes.detected_type) {
            currentOcrRes = ocrRes;
            let detectedType = ocrRes.detected_type;
            const snippetLower = String(ocrRes.raw_text_snippet || "").toLowerCase();

            if (ocrRes.extracted_fields?.full_name && currentUser?.name) {
              const nameCheck = compareStudentNameWithOCR(
                ocrRes.extracted_fields.full_name,
                currentUser.name,
              );
              if (nameCheck.status === "MISMATCH") {
                notification.warning({
                  message: `Nama pada "${file.name}" berbeda dengan profil akun`,
                });
              }
            }

            const isCombinedCertAndTranscript =
              ocrRes.warning?.toLowerCase().includes("menggabungkan ijazah") ||
              ocrRes.warning?.toLowerCase().includes("ijazah dan nilai") ||
              detectedType === "COMBINED_CERT_TRANSCRIPT" ||
              ((snippetLower.includes("ijazah") ||
                snippetLower.includes("surat keterangan lulus") ||
                snippetLower.includes("diploma") ||
                snippetLower.includes("sarjana") ||
                snippetLower.includes("kelulusan") ||
                snippetLower.includes("menamatkan") ||
                fileNameLower.includes("ijazah")) &&
               (snippetLower.includes("rapor") ||
                snippetLower.includes("raport") ||
                snippetLower.includes("transkrip") ||
                snippetLower.includes("daftar nilai") ||
                snippetLower.includes("capaian kompetensi") ||
                snippetLower.includes("laporan hasil belajar") ||
                fileNameLower.includes("rapor") ||
                fileNameLower.includes("transkrip")));

            const isCombinedKtpAndFamilyCard =
              ocrRes.warning?.toLowerCase().includes("kartu keluarga") ||
              detectedType === "COMBINED_KTP_KK" ||
              ((snippetLower.includes("kartu tanda penduduk") || snippetLower.includes("nik") || fileNameLower.includes("ktp")) &&
               (snippetLower.includes("kartu keluarga") || snippetLower.includes("nomor kk") || fileNameLower.includes("kk")));

            // Cek apakah dokumen ini dokumen di luar persyaratan visa (Out of Scope)
            if (detectedType === "BUSINESS_PLAN" || fileNameLower.includes("business plan")) {
              ocrDetectedNote = "Terdeteksi Business Plan, bukan berkas persyaratan visa";
              isExplicitlyRejected = true;
              detectedType = "UNRECOGNIZED";
            } else if (detectedType === "TABLE_MANNER" || fileNameLower.includes("table manner")) {
              ocrDetectedNote = "Terdeteksi Sertifikat Table Manner, bukan berkas persyaratan visa";
              isExplicitlyRejected = true;
              detectedType = "UNRECOGNIZED";
            } else if (!isCombinedCertAndTranscript && (detectedType === "ACADEMIC_REPORT" || fileNameLower.includes("raport") || fileNameLower.includes("rapor"))) {
              ocrDetectedNote = "Terdeteksi Rapor atau Penilaian Belajar, bukan Ijazah Kelulusan";
            } else if (isCasualPhoto) {
              ocrDetectedNote = "Foto santai / tempat wisata tidak dapat digunakan sebagai Pasfoto Formal";
              isExplicitlyRejected = true;
            } else if ((detectedType === "UNRECOGNIZED" || detectedType === "OTHER") && !isPhotoFileName) {
              const hasDynamicKeywordMatch = countryDocuments.some((doc) => {
                const kwStr = (doc as any).ocr_keywords;
                if (kwStr && typeof kwStr === "string") {
                  const kws = kwStr.split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean);
                  if (kws.some((k: string) => k.length >= 3 && (snippetLower.includes(k) || fileNameLower.includes(k)))) return true;
                }
                if (doc.label) {
                  const docLabelLower = String(doc.label || "").toLowerCase();
                  const labelWords = docLabelLower
                    .split(/\s+/)
                    .filter((w) => w.length >= 4 && !["surat", "berkas", "dokumen", "bukti", "sertifikat"].includes(w));
                  if (labelWords.some((w) => snippetLower.includes(w))) return true;
                }
                return false;
              });

              if (!hasDynamicKeywordMatch) {
                ocrDetectedNote = "Isi berkas tidak dikenali sebagai dokumen persyaratan visa";
                isExplicitlyRejected = true;
              }
            }

            const hasTaxIndicators =
              snippetLower.includes("npwp") ||
              snippetLower.includes("pajak") ||
              snippetLower.includes("tax") ||
              snippetLower.includes("djp") ||
              snippetLower.includes("kpp") ||
              snippetLower.includes("wajib pajak") ||
              fileNameLower.includes("npwp") ||
              fileNameLower.includes("pajak") ||
              fileNameLower.includes("tax") ||
              Boolean(ocrRes.extracted_fields?.additional_fields?.npwp_number);

            // Koreksi proteksi mutlak: Jika ada indikator pajak/NPWP tapi terdeteksi sebagai KTP/SPONSOR_ID, paksa ke NPWP!
            if (hasTaxIndicators && (detectedType === "KTP" || detectedType === "NATIONAL_ID" || detectedType === "SPONSOR_ID")) {
              detectedType = "NPWP";
            }

            let matchedByOcr: (typeof countryDocuments)[number] | null | undefined = null;

            // Penanganan jika berkas terdeteksi menggabungkan Ijazah dan Nilai Rapor / Transkrip
            if (!matchedByOcr && !isExplicitlyRejected && isCombinedCertAndTranscript) {
              const certDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_cert" ||
                  String(d.internal_code) === "HIGHSCHOOL_CERT" ||
                  String(d.internal_code) === "IJAZAH" ||
                  String(d.internal_code) === "BACHELOR_CERT" ||
                  String(d.internal_code) === "CERTIFICATE",
              );
              const transcriptDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_trns" ||
                  String(d.internal_code) === "TRANSCRIPT" ||
                  String(d.internal_code) === "TRANSKRIP" ||
                  String(d.internal_code) === "ACADEMIC_TRANSCRIPT",
              );

              if (certDoc && isSlotAvailable(certDoc)) {
                matchedByOcr = certDoc;
                detectedType = "HIGHSCHOOL_CERT";
                ocrDetectedNote =
                  "Dokumen terdeteksi menggabungkan Ijazah dan Nilai Rapor / Transkrip yang dipetakan ke slot Ijazah. Tolong pisahkan berkas jika slot Transkrip Nilai memerlukan dokumen tersendiri.";
              } else if (transcriptDoc && isSlotAvailable(transcriptDoc)) {
                matchedByOcr = transcriptDoc;
                detectedType = "TRANSCRIPT";
                ocrDetectedNote =
                  "Dokumen terdeteksi menggabungkan Ijazah dan Nilai Rapor / Transkrip yang dipetakan ke slot Transkrip Nilai. Tolong pisahkan berkas jika slot Ijazah memerlukan dokumen tersendiri.";
              } else {
                isExplicitlyRejected = true;
                ocrDetectedNote =
                  "Slot Ijazah dan Transkrip Nilai sudah terisi. Berkas terdeteksi menggabungkan Ijazah dan Rapor sehingga dilewati.";
              }
            }

            // Penanganan jika berkas terdeteksi menggabungkan KTP dan Kartu Keluarga (KK)
            if (!matchedByOcr && !isExplicitlyRejected && isCombinedKtpAndFamilyCard) {
              const ktpDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_ktp" ||
                  String(d.internal_code) === "NATIONAL_ID" ||
                  String(d.internal_code) === "KTP",
              );
              const kkDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_family_card" ||
                  String(d.internal_code) === "FAMILY_CARD" ||
                  String(d.internal_code) === "KK",
              );

              if (ktpDoc && isSlotAvailable(ktpDoc)) {
                matchedByOcr = ktpDoc;
                detectedType = "NATIONAL_ID";
                ocrDetectedNote =
                  "Dokumen terdeteksi memuat KTP dan Kartu Keluarga yang dipetakan ke slot KTP. Tolong pisahkan berkas jika slot Kartu Keluarga memerlukan dokumen tersendiri.";
              } else if (kkDoc && isSlotAvailable(kkDoc)) {
                matchedByOcr = kkDoc;
                detectedType = "FAMILY_CARD";
                ocrDetectedNote =
                  "Dokumen terdeteksi memuat KTP dan Kartu Keluarga yang dipetakan ke slot Kartu Keluarga. Tolong pisahkan berkas jika slot KTP memerlukan dokumen tersendiri.";
              } else {
                isExplicitlyRejected = true;
                ocrDetectedNote =
                  "Slot KTP dan Kartu Keluarga sudah terisi. Berkas gabungan dilewati.";
              }
            }

            // Penanganan jika berkas adalah Pasfoto Formal Mahasiswa:
            if (detectedType === "PROFILE_PHOTO" || isPhotoFileName) {
              const photoDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_photo" ||
                  String(d.internal_code) === "PROFILE_PHOTO",
              );
              if (photoDoc) {
                if (isSlotAvailable(photoDoc)) {
                  matchedByOcr = photoDoc;
                  detectedType = "PROFILE_PHOTO";
                } else {
                  isExplicitlyRejected = true;
                  ocrDetectedNote = `Slot ${photoDoc.label} sudah terisi. Berkas dilewati (skip).`;
                }
              }
            }

            // Penanganan jika berkas adalah Bukti Usaha Sponsor:
            if (
              !matchedByOcr &&
              !isExplicitlyRejected &&
              (detectedType === "PROOF_BUSINESS" ||
                detectedType === "SUPPLIER_REFERENCE" ||
                fileNameLower.includes("proof of business") ||
                fileNameLower.includes("bukti usaha") ||
                fileNameLower.includes("business supplier") ||
                fileNameLower.includes("supplier photos") ||
                fileNameLower.includes("business leasing") ||
                fileNameLower.includes("leasing photos") ||
                fileNameLower.includes("business reference") ||
                fileNameLower.includes("foto usaha"))
            ) {
              const proofBizDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_proof_business" ||
                  String(d.internal_code) === "PROOF_BUSINESS",
              );
              if (proofBizDoc) {
                if (isSlotAvailable(proofBizDoc)) {
                  matchedByOcr = proofBizDoc;
                  detectedType = "PROOF_BUSINESS";
                } else {
                  isExplicitlyRejected = true;
                  ocrDetectedNote = `Slot ${proofBizDoc.label} sudah terisi. Berkas dilewati (skip).`;
                }
              }
            }

            // Penanganan jika berkas adalah Rapor (hanya rapor tanpa ijazah)
            if (
              !matchedByOcr &&
              !isExplicitlyRejected &&
              !isCombinedCertAndTranscript &&
              (detectedType === "ACADEMIC_REPORT" || fileNameLower.includes("raport") || fileNameLower.includes("rapor"))
            ) {
              const transcriptDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_trns" || String(d.internal_code) === "TRANSCRIPT" || String(d.internal_code) === "TRANSKRIP",
              );
              if (transcriptDoc && isSlotAvailable(transcriptDoc)) {
                matchedByOcr = transcriptDoc;
              } else {
                matchedByOcr = null;
                isExplicitlyRejected = true;
                ocrDetectedNote = transcriptDoc && !isSlotAvailable(transcriptDoc)
                  ? `Slot ${transcriptDoc.label} sudah terisi. Berkas dilewati.`
                  : "Terdeteksi Rapor atau Penilaian Belajar, bukan Ijazah Kelulusan";
              }
            }

            // Penanganan jika berkas adalah Sertifikat Tanah / Aset Sponsor:
            if (
              !matchedByOcr &&
              !isExplicitlyRejected &&
              (detectedType === "SPONSOR_LAND_ASSET" ||
                detectedType === "ASSET_CERTIFICATE" ||
                fileNameLower.includes("asset") ||
                fileNameLower.includes("aset") ||
                fileNameLower.includes("shm") ||
                fileNameLower.includes("tanah"))
            ) {
              const landAssetDoc = countryDocuments.find(
                (d) =>
                  String(d.id) === "doc_sponsor_land_asset" ||
                  String(d.internal_code) === "SPONSOR_LAND_ASSET",
              );
              if (landAssetDoc) {
                if (isSlotAvailable(landAssetDoc)) {
                  matchedByOcr = landAssetDoc;
                  detectedType = "SPONSOR_LAND_ASSET";
                } else {
                  isExplicitlyRejected = true;
                  ocrDetectedNote = `Slot ${landAssetDoc.label} sudah terisi. Berkas dilewati.`;
                }
              }
            }

            // Penanganan jika berkas adalah KTP:
            if (
              !matchedByOcr &&
              !isExplicitlyRejected &&
              (detectedType === "KTP" || detectedType === "NATIONAL_ID" || detectedType === "SPONSOR_ID") &&
              !hasTaxIndicators &&
              !isCommercialOrOutOfScope
            ) {
              const studentName = (currentUser?.name || "").toLowerCase().trim();
              const ocrName = (ocrRes.extracted_fields?.full_name || "").toLowerCase().trim();
              const isNameMatch =
                Boolean(studentName && ocrName) &&
                (studentName.includes(ocrName) || ocrName.includes(studentName));

              const studentDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_ktp" || String(d.internal_code) === "NATIONAL_ID" || String(d.internal_code) === "KTP",
              );
              const sponsorDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_sponsor_id" || String(d.internal_code) === "SPONSOR_ID",
              );

              if (isNameMatch && studentDoc && isSlotAvailable(studentDoc)) {
                matchedByOcr = studentDoc;
              } else if (!isNameMatch && sponsorDoc && isSlotAvailable(sponsorDoc)) {
                matchedByOcr = sponsorDoc;
              } else if (studentDoc && isSlotAvailable(studentDoc)) {
                matchedByOcr = studentDoc;
              } else if (sponsorDoc && isSlotAvailable(sponsorDoc)) {
                matchedByOcr = sponsorDoc;
              } else {
                isExplicitlyRejected = true;
                ocrDetectedNote = "Slot KTP Mahasiswa dan KTP Sponsor sudah terisi. Berkas dilewati.";
              }
            }

            // Penanganan jika berkas adalah NPWP:
            if (
              !matchedByOcr &&
              !isExplicitlyRejected &&
              (detectedType === "NPWP" || detectedType === "SPONSOR_NPWP" || hasTaxIndicators) &&
              !isCommercialOrOutOfScope
            ) {
              const studentName = (currentUser?.name || "").toLowerCase().trim();
              const ocrName = (ocrRes.extracted_fields?.full_name || "").toLowerCase().trim();
              const isNameMatch =
                Boolean(studentName && ocrName) &&
                (studentName.includes(ocrName) || ocrName.includes(studentName));

              const isSponsorNPWPHint =
                fileNameLower.includes("sponsor") ||
                fileNameLower.includes("ayah") ||
                fileNameLower.includes("ibu") ||
                fileNameLower.includes("ortu") ||
                fileNameLower.includes("penjamin") ||
                fileNameLower.includes("father") ||
                fileNameLower.includes("mother") ||
                fileNameLower.includes("papa") ||
                fileNameLower.includes("mama") ||
                snippetLower.includes("sponsor") ||
                snippetLower.includes("penjamin") ||
                snippetLower.includes("orang tua") ||
                snippetLower.includes("ayah") ||
                snippetLower.includes("ibu");

              const studentNpwpDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_npwp" || String(d.internal_code) === "NPWP",
              );
              const sponsorNpwpDoc = countryDocuments.find(
                (d) => String(d.id) === "doc_sponsor_npwp" || String(d.internal_code) === "SPONSOR_NPWP",
              );

              if (isSponsorNPWPHint && sponsorNpwpDoc && isSlotAvailable(sponsorNpwpDoc)) {
                matchedByOcr = sponsorNpwpDoc;
              } else if (isNameMatch && studentNpwpDoc && isSlotAvailable(studentNpwpDoc)) {
                matchedByOcr = studentNpwpDoc;
              } else if (studentNpwpDoc && isSlotAvailable(studentNpwpDoc)) {
                matchedByOcr = studentNpwpDoc;
              } else if (sponsorNpwpDoc && isSlotAvailable(sponsorNpwpDoc)) {
                matchedByOcr = sponsorNpwpDoc;
              } else {
                isExplicitlyRejected = true;
                ocrDetectedNote = "Slot NPWP Mahasiswa dan NPWP Sponsor sudah terisi. Berkas dilewati.";
              }
            }

            // Penanganan jika berkas adalah Bank / Rekening:
            const hasBankIndicators =
              snippetLower.includes("rekening") ||
              snippetLower.includes("bank statement") ||
              snippetLower.includes("account statement") ||
              snippetLower.includes("mutasi rekening") ||
              snippetLower.includes("buku tabungan") ||
              fileNameLower.includes("bank") ||
              fileNameLower.includes("rekening") ||
              fileNameLower.includes("statement") ||
              fileNameLower.includes("mutasi");

            if (hasBankIndicators && (detectedType === "ENG_CERT" || detectedType === "ENGLISH_TEST" || detectedType === "IELTS" || detectedType === "TOEFL" || detectedType === "PTE" || detectedType === "DET_CERT" || detectedType === "DET")) {
              detectedType = "SPONSOR_BANK_STMT";
            }

            if (
              !matchedByOcr &&
              !isExplicitlyRejected &&
              (detectedType === "BANK_STATEMENT" || detectedType === "FINANCIAL" || detectedType === "SPONSOR_BANK_STMT" || detectedType === "SPONSOR_BANK_REF" || hasBankIndicators)
            ) {
              const isReference = fileNameLower.includes("ref") || snippetLower.includes("referensi bank") || snippetLower.includes("bank reference");
              if (isReference) {
                const refDoc = countryDocuments.find(
                  (d) => String(d.id) === "doc_sponsor_bank_ref" || String(d.internal_code) === "SPONSOR_BANK_REF",
                );
                if (refDoc) {
                  if (isSlotAvailable(refDoc)) {
                    matchedByOcr = refDoc;
                  } else {
                    isExplicitlyRejected = true;
                    ocrDetectedNote = `Slot ${refDoc.label} sudah terisi. Berkas dilewati.`;
                  }
                }
              } else {
                const isSponsorBankHint =
                  fileNameLower.includes("sponsor") ||
                  fileNameLower.includes("ayah") ||
                  fileNameLower.includes("ibu") ||
                  fileNameLower.includes("father") ||
                  fileNameLower.includes("mother") ||
                  fileNameLower.includes("ortu") ||
                  fileNameLower.includes("penjamin") ||
                  snippetLower.includes("sponsor") ||
                  snippetLower.includes("father") ||
                  snippetLower.includes("mother");

                const sponsorBankDoc = countryDocuments.find(
                  (d) => String(d.id) === "doc_sponsor_bank_stmt" || String(d.internal_code) === "SPONSOR_BANK_STMT",
                );
                const studentBankDoc = countryDocuments.find(
                  (d) => String(d.id) === "doc_bank" || String(d.internal_code) === "BANK_STATEMENT" || String(d.internal_code) === "FINANCIAL",
                );

                if (isSponsorBankHint && sponsorBankDoc && isSlotAvailable(sponsorBankDoc)) {
                  matchedByOcr = sponsorBankDoc;
                } else if (studentBankDoc && isSlotAvailable(studentBankDoc)) {
                  matchedByOcr = studentBankDoc;
                } else if (sponsorBankDoc && isSlotAvailable(sponsorBankDoc)) {
                  matchedByOcr = sponsorBankDoc;
                } else {
                  isExplicitlyRejected = true;
                  ocrDetectedNote = "Slot Rekening Koran Mahasiswa dan Sponsor sudah terisi. Berkas dilewati.";
                }
              }
            }

            // Penanganan jika berkas adalah Tanda Tangan:
            const hasSignIndicators =
              fileNameLower.includes("sign") ||
              fileNameLower.includes("ttd") ||
              fileNameLower.includes("signature") ||
              fileNameLower.includes("tanda tangan");

            if (
              !matchedByOcr &&
              !isExplicitlyRejected &&
              (detectedType === "STUDENT_SIGN" || detectedType === "SPONSOR_SIGN" || hasSignIndicators)
            ) {
              const isSponsorSignHint =
                fileNameLower.includes("sponsor") ||
                fileNameLower.includes("father") ||
                fileNameLower.includes("mother") ||
                fileNameLower.includes("ayah") ||
                fileNameLower.includes("ibu") ||
                fileNameLower.includes("penjamin") ||
                fileNameLower.includes("parent");

              if (isSponsorSignHint) {
                const sponsorSignDoc = countryDocuments.find(
                  (d) => String(d.id) === "doc_sponsor_sign" || String(d.internal_code) === "SPONSOR_SIGN",
                );
                if (sponsorSignDoc) {
                  if (isSlotAvailable(sponsorSignDoc)) {
                    matchedByOcr = sponsorSignDoc;
                  } else {
                    isExplicitlyRejected = true;
                    ocrDetectedNote = "Slot Tanda Tangan Sponsor sudah terisi. Berkas dilewati.";
                  }
                }
              } else {
                if (hasVerifiedOnboardingSignature || !isSlotAvailable({ id: "doc_sign", internal_code: "STUDENT_SIGN" } as any)) {
                  isExplicitlyRejected = true;
                  ocrDetectedNote =
                    "Tanda tangan mahasiswa sudah terverifikasi resmi dari onboarding. Berkas bulk upload dilewati agar tidak menduplikasi data.";
                } else {
                  const studentSignDoc = countryDocuments.find(
                    (d) => String(d.id) === "doc_sign" || String(d.internal_code) === "STUDENT_SIGN",
                  );
                  if (studentSignDoc && isSlotAvailable(studentSignDoc)) {
                    matchedByOcr = studentSignDoc;
                  } else {
                    isExplicitlyRejected = true;
                    ocrDetectedNote = "Slot Tanda Tangan Mahasiswa sudah terisi. Berkas dilewati.";
                  }
                }
              }
            }

            // Penanganan dokumen dinamis berdasarkan ocr_keywords dan label di master data dokumen
            if (!matchedByOcr && !isExplicitlyRejected && snippetLower) {
              for (const doc of countryDocuments) {
                const kwStr = (doc as any).ocr_keywords;
                let isMatch = false;

                if (kwStr && typeof kwStr === "string") {
                  const kws = kwStr.split(",").map((k: string) => k.trim().toLowerCase()).filter(Boolean);
                  isMatch = kws.some((k: string) => k.length >= 3 && (snippetLower.includes(k) || fileNameLower.includes(k)));
                }

                if (!isMatch && doc.label) {
                  const docLabelLower = String(doc.label || "").toLowerCase();
                  const labelWords = docLabelLower
                    .split(/\s+/)
                    .filter((w) => w.length >= 4 && !["surat", "berkas", "dokumen", "bukti", "sertifikat"].includes(w));
                  isMatch = labelWords.some((w) => snippetLower.includes(w));
                }

                if (isMatch) {
                  if (isSlotAvailable(doc)) {
                    matchedByOcr = doc;
                    detectedType = String(doc.internal_code || doc.label || "CUSTOM_DOC");
                    break;
                  } else {
                    isExplicitlyRejected = true;
                    ocrDetectedNote = `Slot ${doc.label} sudah terisi. Berkas dilewati agar tidak menimpa dokumen yang sudah ada.`;
                    break;
                  }
                }
              }
            }

            // Fallback OCR Umum
            if (!matchedByOcr && detectedType !== "UNRECOGNIZED" && !isExplicitlyRejected) {
              const candidate = findDocumentByOcrType(detectedType, countryDocuments);
              if (candidate) {
                if (isSlotAvailable(candidate)) {
                  matchedByOcr = candidate;
                } else {
                  isExplicitlyRejected = true;
                  ocrDetectedNote = `Slot ${candidate.label} sudah terisi. Berkas dilewati agar tidak menimpa dokumen yang sudah ada.`;
                }
              }
            }

            if (matchedByOcr) {
              ocrMatchedDoc = matchedByOcr;
              const found = countryDocuments.find((d) => String(d.id) === String(matchedByOcr.id));
              if (found) {
                targetDoc = found;
                matchSource = "OCR";
                confidence = Math.round(
                  typeof ocrRes.confidence === "number"
                    ? ocrRes.confidence > 1
                      ? ocrRes.confidence
                      : ocrRes.confidence * 100
                    : 85,
                );
              }
            }
          }
        } catch {
          // abaikan galat verifikasi berkas acak
        }
      }

      if (targetDoc) {
        claimedDocIds.add(String(targetDoc.id));
        if (targetDoc.internal_code) {
          claimedDocIds.add(targetDoc.internal_code);
        }
      }

      // 3. Jika slot dokumen kosong ditemukan, langsung simpan ke slot tersebut
      if (targetDoc) {
        try {
          setProcessingStatus(`Menyimpan "${file.name}" ke slot ${targetDoc.label}...`);
          const standardFileName = generateStandardFileName({
            pattern: targetDoc.auto_rename_pattern,
            studentName: studentDisplayName,
            documentCode: targetDoc.internal_code,
            originalFileName: file.name,
          });
          const path = `documents/${userId}/${targetDoc.id}/${standardFileName}`;

          const uploadRes = await uploadDocument({
            file,
            path,
            content_type: file.type,
            student_folder_key: studentFolderKey,
          });

          if (uploadRes?.url && effectiveStudentId) {
            await submitDocuments([
              {
                document_id: String(targetDoc.id),
                student_id: effectiveStudentId,
                file_name: standardFileName,
                file_url: uploadRes.url,
                file_path: uploadRes.path,
                file_type: file.type,
                status: "done",
              },
            ]);
            successCount++;
          }

          notification.success({
            message: `Berkas "${file.name}" mengisi slot ${targetDoc.label}`,
          });
        } catch (uploadErr) {
          notification.error({
            message: `Gagal menyimpan berkas "${file.name}"`,
          });
        }
      } else if (isExplicitlyRejected) {
        // Catat sebagai berkas dilewati / ditolak
        if (ocrDetectedNote?.toLowerCase().includes("sudah terisi") || ocrDetectedNote?.toLowerCase().includes("dilewati")) {
          skippedItems.push({
            fileName: file.name,
            reason: ocrDetectedNote,
          });
          notification.warning({
            message: `Slot sudah terisi, berkas "${file.name}" dilewati`,
          });
        } else {
          rejectedItems.push({
            fileName: file.name,
            reason: ocrDetectedNote || "Berkas di luar persyaratan visa",
          });
          notification.warning({
            message: `Berkas "${file.name}" di luar persyaratan visa`,
          });
        }
      } else {
        // Jika tidak dapat diidentifikasi secara otomatis, kumpulkan untuk konfirmasi manual
        const potentialMatch =
          filenameMatch?.doc ??
          (ocrMatchedDoc
            ? countryDocuments.find((d) => String(d.id) === String(ocrMatchedDoc?.id))
            : undefined);

        unmappedItems.push({
          uid: `${file.name}-${idx}-${Date.now()}`,
          file,
          matchedDocId: potentialMatch && isSlotAvailable(potentialMatch) ? String(potentialMatch.id) : "",
          matchedLabel: potentialMatch && isSlotAvailable(potentialMatch) ? String(potentialMatch.label ?? "") : "",
          confidence: potentialMatch ? (filenameMatch?.confidence || confidence || 80) : 0,
          isOcrLoading: false,
          source: potentialMatch ? (filenameMatch ? "FILENAME" : "OCR") : "UNMATCHED",
          detectedNote:
            ocrDetectedNote ||
            (potentialMatch && !isSlotAvailable(potentialMatch)
              ? `Slot ${potentialMatch.label} sudah terisi.`
              : "Tidak ada slot dokumen persyaratan yang sesuai"),
          isRejected: false,
        });
      }
    }

    setIsProcessingFiles(false);
    setProcessingStatus("");

    if (successCount > 0) {
      notification.success({
        key: bulkNotifyKey,
        message: `${successCount} berkas berhasil mengisi slot dokumen`,
      });
    } else {
      notification.destroy(bulkNotifyKey);
    }

    // Tampilkan modal HANYA jika ada berkas ambigu yang memerlukan pemilihan slot secara manual
    if (unmappedItems.length > 0) {
      setBulkFiles(unmappedItems);
      setBulkModalOpen(true);
      notification.info({
        message: `${unmappedItems.length} berkas perlu konfirmasi kategori manual`,
      });
    }
  };

  const handleExecuteBulkUpload = async () => {
    if (!bulkFiles.length) return;

    const unmapped = bulkFiles.filter((item) => !item.matchedDocId);
    if (unmapped.length > 0) {
      notification.warning({
        message: "Pilih jenis dokumen untuk semua berkas",
      });
      return;
    }

    try {
      setBulkUploading(true);
      setBulkProgress(0);

      const studentDisplayName = currentUser?.name ?? "Student";
      const userId = effectiveStudentId || "student";
      const studentFolderKey = `${studentDisplayName}-${userId}`;
      const payload: AnswerDocumentPayloadCreateModel[] = [];

      for (let i = 0; i < bulkFiles.length; i++) {
        const item = bulkFiles[i];
        const targetDoc = countryDocuments.find((d) => String(d.id) === String(item.matchedDocId));
        if (!targetDoc) continue;

        const standardFileName = generateStandardFileName({
          pattern: targetDoc.auto_rename_pattern,
          studentName: studentDisplayName,
          documentCode: targetDoc.internal_code,
          originalFileName: item.file.name,
        });
        const path = `documents/${userId}/${targetDoc.id}/${standardFileName}`;

        const uploadRes = await uploadDocument({
          file: item.file,
          path,
          content_type: item.file.type,
          student_folder_key: studentFolderKey,
        });

        if (uploadRes?.url && effectiveStudentId) {
          payload.push({
            document_id: String(targetDoc.id),
            student_id: effectiveStudentId,
            file_name: standardFileName,
            file_url: uploadRes.url,
            file_path: uploadRes.path,
            file_type: item.file.type,
            status: "done",
          });
        }

        setBulkProgress(Math.round(((i + 1) / bulkFiles.length) * 100));
      }

      if (payload.length) {
        await submitDocuments(payload);
      }

      notification.success({
        message: `${payload.length} berkas berhasil disimpan`,
      });

      setBulkModalOpen(false);
      setBulkFiles([]);
    } catch (err) {
      notification.error({
        message: "Gagal mengunggah dokumen",
      });
    } finally {
      setBulkUploading(false);
    }
  };

  const visaTypeNameById = useMemo(() => {
    return new Map(
      visaTypes.map((item) => [String(item.id), String(item.name ?? "").trim()]),
    );
  }, [visaTypes]);

  const visaTypeLabel = useMemo(() => {
    const named = String(currentUser?.visa_type_name ?? "").trim();
    if (named) {
      return named;
    }

    const raw = String(currentUser?.visa_type ?? "").trim();
    if (!raw) {
      return "";
    }

    return visaTypeNameById.get(raw) ?? raw.replace(/_/g, " ");
  }, [currentUser?.visa_type, currentUser?.visa_type_name, visaTypeNameById]);

  const documentsWithState = useMemo(() => {
    return countryDocuments.map((doc) => {
      const key = String(doc.id);
      const draftFile = watchedDocuments?.[key]?.[0];
      let submittedFile =
        latestAnswerByDocumentId.get(key) ??
        (doc.internal_code ? latestAnswerByDocumentId.get(doc.internal_code) : undefined);

      // Cek apakah ada berkas yang tersimpan dengan alias atau tipe standar yang sama (misal doc-english-test vs doc_ielts)
      if (!submittedFile) {
        const stdLabel = normalizeDocumentLabel(doc);
        const ansMatch = (answerDocuments ?? []).find((ans) => {
          const ansDocId = String(ans.document_id);
          const masterMatch = (masterDocuments ?? []).find(
            (m) => String(m.id) === ansDocId || m.internal_code === ansDocId,
          );
          if (masterMatch && normalizeDocumentLabel(masterMatch) === stdLabel) {
            return true;
          }
          return false;
        });
        if (ansMatch) {
          submittedFile = ansMatch;
        }
      }

      // Sinkronisasi otomatis tanda tangan mahasiswa jika sudah ditandatangani saat onboarding verifikasi
      const isStudentSignDoc = key === "doc_sign" || doc.internal_code === "STUDENT_SIGN";
      const studentSignatureUrl =
        currentUser?.document_consent_signature_url ||
        currentUser?.statement_letter_file_url;

      if (!submittedFile && isStudentSignDoc && studentSignatureUrl) {
        submittedFile = {
          id: `verified_sig_${effectiveStudentId}`,
          document_id: key,
          student_id: effectiveStudentId,
          file_name: "Tanda Tangan Digital Mahasiswa - Terverifikasi Onboarding",
          file_url: studentSignatureUrl,
          file_path: "",
          file_type: "image/png",
          status: "done",
          created_at: currentUser?.created_at || new Date().toISOString(),
        } as AnswerDocumentDataModel;
      }

      const statusInfo = getDocumentStatusInfo(draftFile, submittedFile);
      const isCompleted =
        draftFile?.status === "done" || Boolean(submittedFile?.file_url);

      return {
        doc,
        draftFile,
        submittedFile,
        statusInfo,
        isCompleted,
      };
    });
  }, [countryDocuments, latestAnswerByDocumentId, watchedDocuments, currentUser, effectiveStudentId]);

  const effectiveActiveDocumentId = useMemo(() => {
    if (!documentsWithState.length) return "";
    const hasCurrent = documentsWithState.some(
      (item) => String(item.doc.id) === String(activeDocumentId),
    );
    if (hasCurrent) return String(activeDocumentId);
    return String(documentsWithState[0].doc.id);
  }, [activeDocumentId, documentsWithState]);

  const visibleDocuments = useMemo(() => {
    if (!effectiveActiveDocumentId) return documentsWithState.slice(0, 1);
    return documentsWithState.filter(
      (item) => String(item.doc.id) === String(effectiveActiveDocumentId),
    );
  }, [documentsWithState, effectiveActiveDocumentId]);

  const filteredDocumentsWithState = useMemo(() => {
    return documentsWithState.filter(({ doc, isCompleted }) => {
      const q = docSearchQuery.trim().toLowerCase();
      const matchesSearch = q
        ? String(doc.label ?? "").toLowerCase().includes(q) ||
          String(doc.internal_code ?? "").toLowerCase().includes(q) ||
          String(doc.category ?? "").toLowerCase().includes(q)
        : true;
      if (!matchesSearch) return false;

      if (docFilterCategory === "required") return Boolean(doc.required);
      if (docFilterCategory === "optional") return !doc.required;
      if (docFilterCategory === "pending") return !isCompleted;
      if (docFilterCategory === "uploaded") return isCompleted;
      return true;
    });
  }, [documentsWithState, docSearchQuery, docFilterCategory]);

  const totalDocuments = documentsWithState.length;
  const uploadedDocuments = documentsWithState.filter((item) => item.isCompleted).length;
  const requiredTotal = documentsWithState.filter((item) => item.doc.required).length;
  const requiredUploaded = documentsWithState.filter(
    (item) => item.doc.required && item.isCompleted,
  ).length;
  const optionalTotal = documentsWithState.filter((item) => !item.doc.required).length;
  const optionalUploaded = documentsWithState.filter(
    (item) => !item.doc.required && item.isCompleted,
  ).length;
  const pendingDocuments = documentsWithState.filter(
    (item) => item.doc.required && !item.isCompleted,
  ).length;
  const optionalDocuments = optionalTotal;
  const translationDocuments = documentsWithState.filter((item) =>
    String(item.doc.translation_needed ?? "").toUpperCase() === "YES",
  ).length;

  const progressPercent = totalDocuments
    ? Math.round((uploadedDocuments / totalDocuments) * 100)
    : 0;

  const handleSubmitReview = async () => {
    if (uploadedDocuments === 0) {
      notification.warning({
        message: "Dokumen Belum Diunggah",
        description:
          "Silakan unggah dokumen persyaratan terlebih dahulu sebelum mengajukan verifikasi.",
      });
      return;
    }

    try {
      setIsSubmittingReview(true);
      await queryClient.invalidateQueries({ queryKey: ["answer-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });

      notification.success({
        message: "Pengajuan Dokumen Berhasil",
        description:
          "Berkas persyaratan visa Anda telah berhasil diajukan untuk proses verifikasi oleh tim admisi.",
      });
      setSubmitSuccessModalOpen(true);
    } catch (err) {
      notification.error({
        message: "Pengajuan Gagal",
        description:
          err instanceof Error
            ? err.message
            : "Terjadi kendala saat mengajukan dokumen. Silakan coba kembali.",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitDocuments = async (values: DocumentFormValues) => {
    const documents = values.documents ?? {};
    const pendingDocs: string[] = [];
    const payload: AnswerDocumentPayloadCreateModel[] = [];

    Object.entries(documents).forEach(([document_id, fileList]) => {
      const file = Array.isArray(fileList) ? fileList[0] : undefined;
      if (!file) return;

      const response = file.response;
      if (file.status !== "done" || !response?.url) {
        const label = documentMap.get(String(document_id))?.label;
        pendingDocs.push(label ?? String(document_id));
        return;
      }

      payload.push({
        document_id: String(document_id),
        student_id: effectiveStudentId ? String(effectiveStudentId) : undefined,
        file_name: file.name,
        file_url: response.url,
        file_path: response.path,
        file_type: file.type,
        status: file.status,
      });
    });

    if (pendingDocs.length > 0) {
      notification.error({
        message: "Upload belum selesai",
        description: `Dokumen berikut belum selesai diunggah: ${pendingDocs.join(", ")}`,
      });
      return;
    }

    if (!payload.length) {
      if (uploadedDocuments > 0) {
        await handleSubmitReview();
        return;
      }
      notification.warning({
        message: "Dokumen Belum Diunggah",
        description:
          "Silakan unggah dokumen persyaratan terlebih dahulu sebelum mengajukan verifikasi.",
      });
      return;
    }

    try {
      await submitDocuments(payload);
      docForm.resetFields();
      notification.success({
        message: "Pengajuan Dokumen Berhasil",
        description:
          "Berkas persyaratan visa Anda telah berhasil diajukan untuk proses verifikasi oleh tim admisi.",
      });
      setSubmitSuccessModalOpen(true);
    } catch (error) {
      notification.error({
        message: "Pengajuan Gagal",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    }
  };

  return (
    <>
      <div className={styles.container}>
        <PageHeader
          title="Dokumen Visa"
          subtitle="Unggah dokumen persyaratan visa studi dan berkas pendukung Anda"
          icon={<FileTextOutlined />}
          headerExtra={
            <Button
              type="text"
              shape="circle"
              icon={<QuestionCircleOutlined style={{ fontSize: 18, color: "#94a3b8" }} />}
              onClick={restartTour}
              title="Panduan"
              aria-label="Panduan"
            />
          }
        />

        
        {/* 1. Header Badges & Quick Metrics */}
        <div id="docs-header">
          <Card className={styles.card}>
            <Row gutter={[16, 16]} align="middle" justify="space-between">
              <Col xs={24} md={14}>
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  <div className={styles.headerBadgeList}>
                    {currentUser?.stage?.country?.name ? (
                      <Tag
                        className={styles.headerBadge}
                        style={{
                          borderColor: "#bfdbfe",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                        }}
                      >
                        <GlobalOutlined />
                        <span>{currentUser.stage.country.name}</span>
                      </Tag>
                    ) : (
                      <Tag
                        className={styles.headerBadge}
                        style={{
                          borderColor: "#bfdbfe",
                          background: "#eff6ff",
                          color: "#1d4ed8",
                        }}
                      >
                        <GlobalOutlined />
                        <span>Semua Dokumen Persyaratan</span>
                      </Tag>
                    )}

                    {visaTypeLabel ? (
                      <Tag
                        className={styles.headerBadge}
                        style={{
                          borderColor: "#c7d2fe",
                          background: "#eef2ff",
                          color: "#4338ca",
                        }}
                      >
                        <SafetyCertificateOutlined />
                        <span>{visaTypeLabel}</span>
                      </Tag>
                    ) : null}

                    <Tag
                      className={styles.headerBadge}
                      style={{
                        borderColor: "#bbf7d0",
                        background: "#f0fdf4",
                        color: "#15803d",
                      }}
                    >
                      <ThunderboltOutlined />
                      <span>Standar Penamaan Otomatis Aktif</span>
                    </Tag>
                  </div>
                  <p className={styles.headerDesc} style={{ margin: 0 }}>
                    Unggah seluruh berkas dokumen persyaratan Anda melalui area unggah di bawah ini, atau unggah langsung pada masing-masing baris dokumen.
                  </p>
                </Space>
              </Col>

              {/* Progress Metric Card */}
              <Col xs={24} md={10} id="docs-progress-card">
                <div className={styles.progressCard}>
                  <div className={styles.progressHeader}>
                    <span className={styles.progressTitle}>
                      Status Kelengkapan Dokumen
                    </span>
                    <span
                      className={styles.progressPercent}
                      style={{ color: progressPercent === 100 ? "#16a34a" : "#2563eb" }}
                    >
                      {uploadedDocuments} dari {totalDocuments} ({progressPercent}%)
                    </span>
                  </div>
                  <Progress
                    percent={progressPercent}
                    strokeColor={{
                      "0%": "#3b82f6",
                      "100%": "#10b981",
                    }}
                    showInfo={false}
                    size="small"
                  />
                  <div className={styles.progressFooter}>
                    <span>Wajib {requiredUploaded} dari {requiredTotal}</span>
                    <span>Opsional {optionalUploaded} dari {optionalTotal}</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>

        {/* 2. Hero Smart Bulk Upload Box */}
        <div id="docs-upload-area">
          <Card className={styles.card}>
            <Upload.Dragger
              multiple
              disabled={isProcessingFiles}
              showUploadList={false}
              beforeUpload={(file, fileList) => {
                if (file === fileList[0]) {
                  handleBulkFilesSelect(fileList as unknown as File[]);
                }
                return false;
              }}
              accept=".pdf,.png,.jpg,.jpeg"
              style={{
                borderRadius: 12,
                border: "2px dashed #93c5fd",
                background: "#f8fafc",
                padding: "16px 14px",
              }}
            >
              {isProcessingFiles ? (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <Spin size="large" />
                  <Title level={5} style={{ margin: "10px 0 4px", color: "#1e293b", fontSize: 14 }}>
                    {processingStatus || "Sedang Memeriksa Berkas..."}
                  </Title>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>
                    Verifikasi kelayakan dan alokasi otomatis berkas ke slot persyaratan.
                  </Text>
                </div>
              ) : (
                <div style={{ textAlign: "center" }}>
                  <p className="ant-upload-drag-icon" style={{ marginBottom: 6 }}>
                    <CloudUploadOutlined style={{ fontSize: 34, color: "#2563eb" }} />
                  </p>
                  <Title level={5} style={{ margin: "0 0 4px 0", color: "#1e293b", fontWeight: 700, fontSize: 15 }}>
                    Unggah Berkas Sekaligus
                  </Title>
                  <Text style={{ fontSize: 12.5, color: "#64748b", display: "block", marginBottom: 10, maxWidth: 520, marginInline: "auto", lineHeight: 1.35 }}>
                    Tarik atau pilih berkas untuk penempatan otomatis sesuai slot dokumen.
                  </Text>
                  <Button
                    type="primary"
                    icon={<UploadOutlined />}
                    size="small"
                    style={{
                      borderRadius: 7,
                      background: "#2563eb",
                      boxShadow: "0 1px 4px rgba(37, 99, 235, 0.15)",
                      height: 32,
                      paddingInline: 16,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    Pilih Berkas Dokumen
                  </Button>
                  <div style={{ marginTop: 8, fontSize: 11.5, color: "#94a3b8" }}>
                    Format PDF, PNG, JPG (Maks. {MAX_UPLOAD_SIZE_MB}MB per berkas)
                  </div>
                </div>
              )}
            </Upload.Dragger>
          </Card>
        </div>

        {/* 3. Unified Document Checklist */}
        <div id="docs-selector">
          <Card className={styles.card}>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div>
                <Typography.Title level={5} style={{ margin: 0, color: "#0f172a", fontWeight: 700, fontSize: 14.5 }}>
                  Daftar Dokumen ({filteredDocumentsWithState.length})
                </Typography.Title>
                <Text style={{ color: "#64748b", fontSize: 11.5 }}>
                  Periksa kelengkapan setiap berkas persyaratan dan unggah langsung pada baris terkait.
                </Text>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <Input
                  prefix={<SearchOutlined style={{ color: "#94a3b8", fontSize: 13 }} />}
                  placeholder="Cari dokumen persyaratan..."
                  allowClear
                  value={docSearchQuery}
                  onChange={(e) => setDocSearchQuery(e.target.value)}
                  style={{ flex: 1, minWidth: 180, height: 34, borderRadius: 8, borderColor: "#cbd5e1", fontSize: 12.5 }}
                />

                <Select
                  value={docFilterCategory}
                  onChange={(val) => setDocFilterCategory(val)}
                  style={{ flex: "1 1 170px", minWidth: 150, height: 34, fontSize: 12.5 }}
                  options={[
                    { value: "all", label: `Semua Dokumen (${totalDocuments})` },
                    { value: "required", label: `Dokumen Wajib (${totalDocuments - optionalDocuments})` },
                    { value: "optional", label: `Dokumen Opsional (${optionalDocuments})` },
                    { value: "pending", label: `Belum Diunggah (${pendingDocuments})` },
                    { value: "uploaded", label: `Sudah Diunggah (${uploadedDocuments})` },
                  ]}
                />
              </div>
            </div>

            {/* List of document items */}
            {filteredDocumentsWithState.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                <FileTextOutlined style={{ fontSize: 36, marginBottom: 12, opacity: 0.5 }} />
                <p>Tidak ada dokumen yang sesuai dengan kriteria pencarian atau filter.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredDocumentsWithState.map((item) => {
                  const doc = item.doc;
                  const isUploaded = item.isCompleted;
                  const fileUrl = item.submittedFile?.file_url;
                  const fileName = item.submittedFile?.file_name ?? item.draftFile?.name;
                  const fileType = item.submittedFile?.file_type || item.draftFile?.type;
                  const isUploadingThis = singleUploading[String(doc.id)];
                  const isVerifiedOnboardingSign =
                    (String(doc.id) === "doc_sign" || doc.internal_code === "STUDENT_SIGN") &&
                    String(item.submittedFile?.id ?? "").startsWith("verified_sig_");

                  return (
                    <div
                      key={String(doc.id)}
                      className={`${styles.docItem} ${isUploaded ? styles.docItemUploaded : ""}`}
                    >
                      {/* Left: Icon & Title info */}
                      <div className={styles.docItemContent}>
                        <div className={`${styles.docItemIcon} ${isUploaded ? styles.docItemIconUploaded : ""}`}>
                          {isUploaded ? <CheckCircleFilled /> : <FilePdfOutlined />}
                        </div>

                        <div className={styles.docItemDetails}>
                          <DocumentItemHeader
                            required={doc.required}
                            categoryLabel={doc.category ? getCategoryBadgeLabel(doc.category) : undefined}
                            translationNeeded={doc.translation_needed}
                            title={doc.label}
                            notes={!isUploaded ? cleanDocumentNotes(doc.notes) : undefined}
                            uploaded={isUploaded}
                            fileName={fileName}
                          />
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className={styles.docItemActions}>
                        {isUploaded && fileUrl && (
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                              const previewUrl = buildFilePreviewUrl(
                                fileUrl,
                                fileName || `${doc.label}.pdf`,
                                fileType,
                                "raw",
                              );
                              handleOpenPreview(
                                previewUrl || fileUrl,
                                fileName || doc.label,
                                doc.label,
                                fileType,
                                fileUrl,
                              );
                            }}
                            style={{ borderRadius: 6 }}
                          >
                            Lihat
                          </Button>
                        )}

                        <Upload
                          showUploadList={false}
                          accept=".pdf,.png,.jpg,.jpeg"
                          beforeUpload={(file) => {
                            handleSingleDocUpload(doc, file as unknown as File);
                            return false;
                          }}
                        >
                          {isUploaded ? (
                            <Button
                              size="small"
                              icon={<SyncOutlined />}
                              loading={isUploadingThis}
                              style={{ borderRadius: 6 }}
                            >
                              Perbarui
                            </Button>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              ghost
                              icon={<UploadOutlined />}
                              loading={isUploadingThis}
                              style={{ borderRadius: 6 }}
                            >
                              Unggah
                            </Button>
                          )}
                        </Upload>

                        {isUploaded && !isVerifiedOnboardingSign && (
                          <Popconfirm
                            title={`Hapus berkas ${doc.label}?`}
                            description="Berkas yang dihapus akan dikosongkan dari slot persyaratan ini."
                            onConfirm={() => handleDeleteDoc(doc)}
                            okText="Hapus"
                            cancelText="Batal"
                            okButtonProps={{ danger: true, style: { borderRadius: 6 } }}
                            cancelButtonProps={{ style: { borderRadius: 6 } }}
                          >
                            <Button
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              loading={singleDeleting[String(doc.id)]}
                              style={{ borderRadius: 6 }}
                            >
                              Hapus
                            </Button>
                          </Popconfirm>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* 4. Upload Guidelines */}
        <div id="docs-guidelines">
          <Card className={styles.card}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <InfoCircleOutlined style={{ color: "#2563eb", fontSize: 20, marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ color: "#1e293b", fontSize: 14 }}>
                  Panduan Format dan Kualitas Dokumen
                </Text>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                    gap: "10px 24px",
                    marginTop: 10,
                    fontSize: 13,
                    color: "#475569",
                  }}
                >
                  {guidelineItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 10,
                        lineHeight: 1.55,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: "#3b82f6",
                          marginTop: 7,
                          flexShrink: 0,
                        }}
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* 5. Sticky Bottom Action Bar */}
        <div
          id="docs-submit-btn"
          className={styles.stickyBar}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text strong style={{ fontSize: 13.5, color: "#0f172a" }}>
                Status Dokumen
              </Text>
              {pendingDocuments === 0 && uploadedDocuments > 0 ? (
                <Badge
                  status="success"
                  text={<Text strong style={{ color: "#15803d", fontSize: 12.5 }}>Dokumen Lengkap ({uploadedDocuments}/{totalDocuments})</Text>}
                />
              ) : uploadedDocuments > 0 ? (
                <Badge
                  status="processing"
                  text={<Text strong style={{ color: "#2563eb", fontSize: 12.5 }}>{uploadedDocuments} dari {totalDocuments} Dokumen Terunggah</Text>}
                />
              ) : (
                <Badge
                  status="warning"
                  text={<Text strong style={{ color: "#b45309", fontSize: 12.5 }}>Belum Ada Dokumen Terunggah</Text>}
                />
              )}
            </div>
            <Text style={{ fontSize: 11.5, color: "#64748b", display: "block", marginTop: 2 }}>
              {uploadedDocuments > 0
                ? "Berkas siap diajukan untuk verifikasi admisi."
                : "Unggah dokumen persyaratan untuk verifikasi admisi."}
            </Text>
          </div>

          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            loading={isSubmittingReview || submittingDocuments}
            disabled={uploadedDocuments === 0}
            onClick={handleSubmitReview}
            style={{
              borderRadius: 8,
              height: 38,
              paddingInline: 20,
              fontSize: 13,
              fontWeight: 600,
              background: uploadedDocuments === 0 ? undefined : "#2563eb",
              boxShadow: uploadedDocuments === 0 ? undefined : "0 2px 8px rgba(37, 99, 235, 0.25)",
            }}
          >
            Ajukan Verifikasi Dokumen
          </Button>
        </div>

        {/* Modal: Submission Success Confirmation */}
        <Modal
          open={submitSuccessModalOpen}
          onCancel={() => setSubmitSuccessModalOpen(false)}
          footer={[
            <Button
              key="stay"
              onClick={() => setSubmitSuccessModalOpen(false)}
            >
              Tetap di Halaman Ini
            </Button>,
            <Button
              key="dashboard"
              type="primary"
              onClick={() => router.push("/student/dashboard/home")}
            >
              Kembali ke Dashboard
            </Button>,
          ]}
          centered
          width={480}
        >
          <div style={{ textAlign: "center", padding: "16px 8px" }}>
            <CheckCircleFilled style={{ fontSize: 52, color: "#16a34a", marginBottom: 16 }} />
            <Title level={4} style={{ margin: 0, color: "#0f172a", fontWeight: 600 }}>
              Dokumen Berhasil Diajukan
            </Title>
            <Paragraph style={{ color: "#64748b", fontSize: 14, marginTop: 8 }}>
              Berkas persyaratan visa Anda telah berhasil disimpan dan diteruskan ke tim admisi untuk proses peninjauan dan verifikasi.
            </Paragraph>
          </div>
        </Modal>

        {/* Modal 1: Smart Bulk Review & Mapping */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <InboxOutlined style={{ color: "#2563eb", fontSize: 18 }} />
              <span>Tentukan Jenis Dokumen ({bulkFiles.length} Berkas)</span>
            </div>
          }
          open={bulkModalOpen}
          onCancel={() => {
            if (!bulkUploading) {
              setBulkModalOpen(false);
              setBulkFiles([]);
            }
          }}
          width={720}
          footer={[
            bulkFiles.some((f) => f.isRejected) ? (
              <Button
                key="dismiss_rejected"
                danger
                disabled={bulkUploading}
                onClick={() => {
                  setBulkFiles((prev) => prev.filter((f) => !f.isRejected));
                }}
              >
                Hapus Berkas di Luar Persyaratan
              </Button>
            ) : null,
            <Button
              key="cancel"
              disabled={bulkUploading}
              onClick={() => {
                setBulkModalOpen(false);
                setBulkFiles([]);
              }}
            >
              Batal
            </Button>,
            <Button
              key="upload"
              type="primary"
              loading={bulkUploading}
              disabled={bulkFiles.length === 0 || bulkFiles.some((f) => f.isOcrLoading || !f.matchedDocId)}
              onClick={handleExecuteBulkUpload}
              style={{
                background: "#2563eb",
                borderRadius: 8,
                paddingInline: 20,
              }}
            >
              {bulkUploading ? "Mengunggah..." : "Simpan dan Unggah"}
            </Button>,
          ]}
        >
          <div style={{ marginBottom: 16 }}>
            {bulkFiles.some(f => f.isRejected) ? (
              <Alert
                type="warning"
                showIcon
                message="Beberapa berkas yang Anda unggah terdeteksi tidak termasuk dalam daftar persyaratan visa atau tidak sesuai kriteria resmi. Anda dapat menghapus berkas tersebut dengan tombol hapus tempat sampah atau memetakannya secara manual jika memang diperlukan."
                style={{ borderRadius: 8, fontSize: 13 }}
              />
            ) : (
              <Alert
                type="warning"
                showIcon
                message="Sistem belum dapat memastikan jenis dokumen untuk berkas berikut. Silakan pilih jenis dokumen yang sesuai agar berkas dapat dimasukkan ke slotnya."
                style={{ borderRadius: 8, fontSize: 13 }}
              />
            )}
          </div>

          {bulkUploading && (
            <div style={{ marginBottom: 16 }}>
              <Progress percent={bulkProgress} status="active" strokeColor="#2563eb" />
              <Text style={{ fontSize: 12, color: "#64748b" }}>
                Sedang mengunggah dan menyimpan berkas dokumen...
              </Text>
            </div>
          )}

          <div style={{ maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            {bulkFiles.map((item, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  border: item.isRejected ? "1px solid #fecaca" : "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: item.isRejected ? "#fff5f5" : "#f8fafc",
                  gap: 12,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text strong ellipsis style={{ fontSize: 13, color: "#1e293b", maxWidth: 280 }}>
                      {item.file.name}
                    </Text>
                    {item.isOcrLoading ? (
                      <Tag icon={<LoadingOutlined spin />} color="processing" style={{ margin: 0, fontSize: 10 }}>
                        Memverifikasi Dokumen...
                      </Tag>
                    ) : item.isRejected ? (
                      <Tag color="red" style={{ margin: 0, fontSize: 10 }}>
                        {item.detectedNote?.toLowerCase().includes("duplikasi") || item.detectedNote?.toLowerCase().includes("duplikat")
                          ? "Duplikat / Ditolak"
                          : "Di Luar Persyaratan"}
                      </Tag>
                    ) : item.source === "OCR" && item.matchedDocId ? (
                      <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>
                        Teridentifikasi Otomatis
                      </Tag>
                    ) : item.source === "FILENAME" && item.confidence >= 80 ? (
                      <Tag color="success" style={{ margin: 0, fontSize: 10 }}>
                        Sesuai Nama Berkas
                      </Tag>
                    ) : item.source === "MANUAL" ? (
                      <Tag color="purple" style={{ margin: 0, fontSize: 10 }}>
                        Pilihan Manual
                      </Tag>
                    ) : (
                      <Tag color="orange" style={{ margin: 0, fontSize: 10 }}>
                        Perlu Konfirmasi Kategori
                      </Tag>
                    )}
                  </div>
                  {item.detectedNote && (
                    <div style={{ fontSize: 11, color: item.isRejected ? "#dc2626" : "#64748b", marginTop: 2 }}>
                      {item.detectedNote}
                    </div>
                  )}
                  <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB
                  </Text>
                </div>

                <div style={{ flex: "1 1 220px", minWidth: 200, maxWidth: "100%" }}>
                  <Select
                    style={{ width: "100%" }}
                    placeholder="Pilih jenis dokumen..."
                    value={item.matchedDocId || undefined}
                    disabled={bulkUploading || item.isOcrLoading}
                    onChange={(newDocId) => {
                      const newTarget = countryDocuments.find((d) => String(d.id) === String(newDocId));
                      if (newTarget) {
                        setBulkFiles((prev) => {
                          const copy = [...prev];
                          copy[index] = {
                            ...copy[index],
                            matchedDocId: String(newTarget.id),
                            matchedLabel: String(newTarget.label ?? ""),
                            confidence: 100,
                            source: "MANUAL",
                            isOcrLoading: false,
                          };
                          return copy;
                        });
                      }
                    }}
                    options={countryDocuments.map((d) => {
                      const isOccupied = isDocumentOccupied(d);
                      return {
                        value: String(d.id),
                        label: `${d.label} ${d.required ? "- Wajib" : ""} ${isOccupied ? "- Sudah Terisi" : "- Slot Kosong"}`,
                        disabled: isOccupied,
                      };
                    })}
                  />
                </div>

                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  disabled={bulkUploading}
                  onClick={() => {
                    setBulkFiles((prev) => prev.filter((_, i) => i !== index));
                  }}
                />
              </div>
            ))}
          </div>
        </Modal>

        {/* Modal 2: File Preview */}
        <Modal
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileTextOutlined style={{ color: "#2563eb", fontSize: 18, flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: isMobileScreen ? 14 : 15,
                    color: "#0f172a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Lihat Dokumen - {previewItem?.label || "Berkas"}
                </div>
                {previewItem?.name && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      fontWeight: 400,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {previewItem.name}
                  </div>
                )}
              </div>
            </div>
          }
          open={previewModalOpen}
          onCancel={() => setPreviewModalOpen(false)}
          footer={
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: isMobileScreen ? "stretch" : "flex-end",
                gap: 8,
                width: "100%",
              }}
            >
              <Button
                key="close"
                onClick={() => setPreviewModalOpen(false)}
                style={isMobileScreen ? { flex: 1, minWidth: 80 } : undefined}
              >
                Tutup
              </Button>
              {previewItem?.url && (
                <Button
                  key="new-tab"
                  icon={<ExportOutlined />}
                  href={previewItem.rawUrl || previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={isMobileScreen ? { flex: 1, minWidth: 120 } : undefined}
                >
                  Buka di Tab Baru
                </Button>
              )}
              {previewItem?.url && (
                <Button
                  key="download"
                  type="primary"
                  href={previewItem.rawUrl || previewItem.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  icon={<DownloadOutlined />}
                  style={isMobileScreen ? { width: "100%" } : undefined}
                >
                  Unduh Berkas
                </Button>
              )}
            </div>
          }
          width={isMobileScreen ? "calc(100vw - 16px)" : 880}
          style={{
            top: isMobileScreen ? 12 : 36,
            maxWidth: "100%",
            paddingBottom: isMobileScreen ? 12 : 24,
          }}
          styles={{
            body: {
              padding: isMobileScreen ? "12px 14px" : "16px 20px",
              maxHeight: isMobileScreen ? "calc(82vh - 110px)" : "75vh",
              overflowY: "auto",
            },
          }}
        >
          {previewItem?.url ? (() => {
            const urlLower = previewItem.url.toLowerCase();
            const nameLower = previewItem.name.toLowerCase();
            const typeLower = (previewItem.type || "").toLowerCase();

            const isPdf =
              urlLower.includes(".pdf") ||
              nameLower.endsWith(".pdf") ||
              typeLower.includes("pdf");

            const isHtml =
              urlLower.includes(".html") ||
              urlLower.includes(".htm") ||
              nameLower.endsWith(".html") ||
              nameLower.endsWith(".htm") ||
              typeLower.includes("html");

            const isImage =
              urlLower.match(/\.(jpeg|jpg|png|webp|gif|svg)(\?.*)?$/i) ||
              nameLower.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) ||
              typeLower.includes("image");

            if (isHtml) {
              if (htmlPreviewLoading) {
                return (
                  <div style={{ textAlign: "center", padding: 60 }}>
                    <Spin tip="Memuat pratinjau dokumen CV..." />
                  </div>
                );
              }
              return (
                <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8 }}>
                  <iframe
                    srcDoc={htmlPreviewContent || undefined}
                    src={!htmlPreviewContent ? previewItem.url : undefined}
                    style={{
                      width: "100%",
                      height: isMobileScreen ? 400 : 600,
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      background: "#ffffff",
                    }}
                    title={`Pratinjau ${previewItem.name || "Dokumen"}`}
                  />
                </div>
              );
            }

            if (isPdf) {
              if (isMobileScreen) {
                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "24px 16px",
                      background: "#f8fafc",
                      borderRadius: 12,
                      border: "1px dashed #cbd5e1",
                      textAlign: "center",
                      gap: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        background: "#fee2e2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FilePdfOutlined style={{ fontSize: 30, color: "#dc2626" }} />
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: "#0f172a",
                          marginBottom: 6,
                          wordBreak: "break-word",
                        }}
                      >
                        {previewItem.name || "Berkas PDF"}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          color: "#64748b",
                          lineHeight: 1.5,
                          maxWidth: 300,
                          margin: "0 auto",
                        }}
                      >
                        Peramban seluler tidak mengizinkan tampilan PDF langsung di dalam bingkai ini. Silakan buka berkas di tab baru atau unduh langsung untuk melihatnya.
                      </div>
                    </div>
                    <Space direction="vertical" size={10} style={{ width: "100%", maxWidth: 280 }}>
                      <Button
                        type="primary"
                        icon={<ExportOutlined />}
                        size="large"
                        block
                        href={previewItem.rawUrl || previewItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ borderRadius: 8, background: "#2563eb", height: 40, fontWeight: 500 }}
                      >
                        Buka PDF di Tab Baru
                      </Button>
                      <Button
                        icon={<DownloadOutlined />}
                        size="large"
                        block
                        href={previewItem.rawUrl || previewItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ borderRadius: 8, height: 40 }}
                      >
                        Unduh Berkas PDF
                      </Button>
                    </Space>
                  </div>
                );
              }

              return (
                <iframe
                  src={previewItem.url}
                  style={{ width: "100%", height: 600, border: "none", borderRadius: 8 }}
                  title="Pratinjau PDF"
                />
              );
            }

            if (isImage) {
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: isMobileScreen ? 240 : 380,
                    background: "#f8fafc",
                    borderRadius: 8,
                    padding: isMobileScreen ? 8 : 16,
                  }}
                >
                  {imgError ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "24px 16px",
                        textAlign: "center",
                        gap: 12,
                      }}
                    >
                      <FileImageOutlined style={{ fontSize: 40, color: "#94a3b8" }} />
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        Gambar belum dapat dimuat secara langsung di sini.
                      </div>
                      <Button
                        icon={<ExportOutlined />}
                        href={previewItem.rawUrl || previewItem.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                      >
                        Buka Gambar di Tab Baru
                      </Button>
                    </div>
                  ) : (
                    <img
                      src={previewItem.url}
                      alt={previewItem.name}
                      onError={() => {
                        if (previewItem.rawUrl && previewItem.rawUrl !== previewItem.url) {
                          setPreviewItem((prev) => (prev ? { ...prev, url: prev.rawUrl! } : null));
                        } else {
                          setImgError(true);
                        }
                      }}
                      style={{
                        maxWidth: "100%",
                        maxHeight: isMobileScreen ? "48vh" : 550,
                        objectFit: "contain",
                        borderRadius: 8,
                        boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                      }}
                    />
                  )}
                </div>
              );
            }

            return (
              <div style={{ textAlign: "center", maxHeight: 550, overflow: "auto" }}>
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  style={{ maxWidth: "100%", height: "auto", borderRadius: 8 }}
                />
              </div>
            );
          })() : (
            <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>
              Tidak ada pratinjau yang tersedia
            </div>
          )}
        </Modal>
      </div>

      <Tour
        open={tourOpen}
        onClose={closeTour}
        onFinish={closeTour}
        steps={tourSteps}
        zIndex={1200}
      />
    </>
  );
}
