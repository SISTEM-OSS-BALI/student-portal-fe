import {
  DocumentDataModel,
  DocumentPayloadCreateModel,
} from "@/app/models/documents-management";
import {
  getStandardDocumentInstructions,
  getStandardDocumentKeywords,
} from "@/app/utils/document-standards";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useOCRClassifier } from "@/app/hooks/use-ocr-classifier";
import { BulbOutlined, CheckCircleOutlined, LoadingOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Switch,
  Typography,
  Upload,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import type { UploadFile } from "antd";
import type { UploadRequestOption } from "rc-upload/lib/interface";

const { Text } = Typography;
const { useBreakpoint } = Grid;

type AutoRenameMode =
  | "none"
  | "date"
  | "document_id"
  | "label_prefix"
  | "label_suffix";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const STORAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ?? "student-portal";

const normalizeLabelToken = (label?: string) => {
  const normalized = String(label ?? "")
    .trim()
    .toUpperCase();

  if (!normalized) return "";

  let out = "";

  for (let i = 0; i < normalized.length; i += 1) {
    const ch = normalized[i];
    const code = ch.charCodeAt(0);
    const isLetter = code >= 65 && code <= 90;
    const isNumber = code >= 48 && code <= 57;

    if (isLetter || isNumber) out += ch;
  }

  return out;
};

const buildAutoRenamePattern = (mode: AutoRenameMode, labelToken: string) => {
  switch (mode) {
    case "none":
      return "NONE";
    case "date":
      return "DATE";
    case "document_id":
      return "DOCUMENT_ID";
    case "label_prefix":
      return labelToken ? `{studentName}_${labelToken}.pdf` : "";
    case "label_suffix":
      return labelToken ? `${labelToken}_{studentName}.pdf` : "";
    default:
      return "NONE";
  }
};

const candidatePhrases = [
  "bukti transfer", "bukti pembayaran", "kwitansi", "receipt", "invoice",
  "tuition fee", "biaya kuliah", "rekening koran", "bank statement",
  "saldo akhir", "mutasi rekening", "surat sponsor", "sponsorship letter",
  "surat rekomendasi", "recommendation letter", "surat pernyataan",
  "statement of purpose", "kartu tanda penduduk", "kartu keluarga",
  "akta kelahiran", "birth certificate", "ijazah", "graduation certificate",
  "transkrip nilai", "academic transcript", "laporan hasil belajar",
  "rapor", "surat keterangan lulus", "surat izin", "surat tugas",
  "surat keterangan kerja", "work reference", "medical checkup",
  "pemeriksaan kesehatan", "catatan kepolisian", "skck", "police clearance",
  "sertifikat", "certificate of completion", "test report form",
  "band score", "overall score", "nomor pokok wajib pajak", "npwp",
  "siup", "nib", "nomor induk berusaha", "sertifikat hak milik",
  "asuransi", "insurance", "data polis", "nomor polis", "policy number",
  "pertanggungan", "masa pertanggungan", "manfaat pertanggungan", "tertanggung",
  "premi", "ahli waris", "life assurance", "mnc life", "allianz", "bupa",
  "medibank", "oshc", "overseas student health cover", "health cover",
  "beasiswa", "scholarship", "financial guarantee", "letter of guarantee",
  "chest x-ray", "rontgen", "thorax", "tuberculosis", "tb clearance",
  "cuti belajar", "study leave"
];

const genericStopWords = new Set([
  "nama", "tempat tanggal lahir", "tgl lahir", "tempat lahir", "tanggal lahir",
  "alamat", "nomor", "no", "nik", "pekerjaan", "agama", "jenis kelamin",
  "rt rw", "kelurahan", "kecamatan", "kabupaten", "provinsi", "tanda tangan",
  "materai", "meterai", "demikian", "dibuat", "yang bertanda tangan",
  "di bawah ini", "dengan ini", "surat ini", "menyatakan bahwa", "atas nama",
  "bantu", "sistem", "siswa", "salah", "mengunggah", "berkas", "contoh", "upload",
  "preview", "screenshot", "pemeriksaan", "dokumen", "otomatis", "opsional"
]);

const domainSynonymClusters: Array<{
  triggers: string[];
  canonicalKeywords: string[];
}> = [
  {
    triggers: ["izin", "orang tua", "orangtua", "wali", "parent", "consent"],
    canonicalKeywords: [
      "surat izin orang tua",
      "izin orang tua",
      "persetujuan orang tua",
      "memberikan izin",
      "selaku orang tua",
    ],
  },
  {
    triggers: ["asuransi", "polis", "tertanggung", "pertanggungan", "premi", "oshc", "insurance"],
    canonicalKeywords: [
      "asuransi",
      "data polis",
      "nomor polis",
      "pertanggungan",
      "masa pertanggungan",
    ],
  },
  {
    triggers: ["rekening", "koran", "bank", "tabungan", "statement", "mutasi"],
    canonicalKeywords: [
      "rekening koran",
      "bank statement",
      "saldo akhir",
      "mutasi rekening",
    ],
  },
  {
    triggers: ["sponsor", "penjamin", "sponsorship", "biaya hidup"],
    canonicalKeywords: [
      "surat sponsor",
      "sponsorship letter",
      "surat pernyataan sponsor",
      "penjamin biaya",
    ],
  },
  {
    triggers: ["beasiswa", "scholarship", "guarantee", "awardee", "lpdp"],
    canonicalKeywords: [
      "financial guarantee",
      "letter of sponsorship",
      "surat jaminan beasiswa",
      "scholarship award",
    ],
  },
  {
    triggers: ["rontgen", "thorax", "x-ray", "paru", "tbc", "tuberculosis"],
    canonicalKeywords: [
      "chest x-ray",
      "rontgen paru",
      "tuberculosis screening",
      "pemeriksaan kesehatan",
    ],
  },
  {
    triggers: ["cuti", "tugas belajar", "pelepasan kerja", "study leave"],
    canonicalKeywords: [
      "surat cuti belajar",
      "surat tugas belajar",
      "izin belajar",
      "keterangan kerja",
    ],
  },
  {
    triggers: ["skck", "kepolisian", "police clearance", "catatan kepolisian"],
    canonicalKeywords: [
      "skck",
      "surat keterangan catatan kepolisian",
      "police clearance",
    ],
  },
  {
    triggers: ["ijazah", "kelulusan", "lulus", "graduation", "degree"],
    canonicalKeywords: [
      "ijazah",
      "surat keterangan lulus",
      "graduation certificate",
    ],
  },
  {
    triggers: ["transkrip", "daftar nilai", "rapor", "transcript"],
    canonicalKeywords: [
      "transkrip nilai",
      "academic transcript",
      "daftar nilai",
    ],
  },
];

const extractKeywordsFromText = (rawText: string, docLabel?: string): string[] => {
  const result = new Set<string>();

  // 1. Prioritas Utama: Ekstrak kata kunci bersih langsung dari nama dokumen yang diinputkan admisi
  if (docLabel) {
    const cleanLabel = docLabel
      .toLowerCase()
      .trim()
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ");

    if (cleanLabel.length >= 4) {
      result.add(cleanLabel);
      const corePhrase = cleanLabel.replace(
        /^(surat|berkas|dokumen|bukti|sertifikat|kartu|form|formulir)\s+/,
        "",
      );
      if (corePhrase && corePhrase !== cleanLabel && corePhrase.length >= 4) {
        result.add(corePhrase);
      }
    }
  }

  const lower = (rawText || "").toLowerCase();

  // 2. Cocokkan kluster domain cerdas (tahan terhadap typo OCR)
  for (const cluster of domainSynonymClusters) {
    const matchedTriggers = cluster.triggers.filter((tr) => lower.includes(tr));
    const isTriggeredByLabel = docLabel
      ? cluster.triggers.some((tr) => docLabel.toLowerCase().includes(tr))
      : false;

    if (matchedTriggers.length >= 1 || isTriggeredByLabel) {
      cluster.canonicalKeywords.forEach((k) => result.add(k));
    }
  }

  // 3. Cocokkan frasa kandidat baku yang secara tepat tertulis di teks dokumen
  for (const phrase of candidatePhrases) {
    if (lower.includes(phrase)) {
      result.add(phrase);
    }
  }

  // 4. Jika masih kurang dari 3 kata kunci, lakukan pemindaian baris bersih (bebas typo & stop words)
  if (result.size < 3) {
    const lines = rawText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length >= 4 && l.length <= 40 && !/[0-9]{4,}/.test(l));

    for (const line of lines) {
      const clean = line.replace(/[^a-zA-Z\s]/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
      const words = clean.split(/\s+/).filter(Boolean);

      const hasAbnormalWord = words.some((w) => w.length > 16 || /[^aeiou]{5,}/i.test(w));
      const isGeneric = genericStopWords.has(clean) || words.every((w) => genericStopWords.has(w));

      if (!hasAbnormalWord && !isGeneric && clean.length >= 4 && words.length >= 2 && words.length <= 4) {
        result.add(clean);
        if (result.size >= 4) break;
      }
    }
  }

  return Array.from(result).slice(0, 5);
};

type FormDocumentComponentProps = {
  onSubmit?: (data: DocumentPayloadCreateModel) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  deleteLoading?: boolean;
  selectedDocument?: DocumentDataModel | null;
  existingCodes?: string[];
};

type DocumentFormValues = DocumentPayloadCreateModel & {
  autoRenameMode: AutoRenameMode;
};

const sanitizeFileName = (name: string) => {
  return String(name || "file").replace(/[^a-zA-Z0-9.\-_]/g, "_");
};

const isFullUrl = (value?: string | null) => {
  return /^https?:\/\//i.test(String(value ?? "").trim());
};

const stripLeadingSlash = (value: string) => {
  return value.replace(/^\/+/, "");
};

const normalizeSupabaseBaseUrl = (url: string) => {
  return String(url || "").replace(/\/+$/, "");
};

const toPublicStorageUrl = (value?: string | null) => {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  if (isFullUrl(raw)) return raw;

  if (!SUPABASE_URL) return raw;

  const cleanPath = stripLeadingSlash(raw);

  if (cleanPath.startsWith("storage/v1/object/public/")) {
    return `${normalizeSupabaseBaseUrl(SUPABASE_URL)}/${cleanPath}`;
  }

  if (cleanPath.startsWith(`${STORAGE_BUCKET}/`)) {
    return `${normalizeSupabaseBaseUrl(
      SUPABASE_URL,
    )}/storage/v1/object/public/${cleanPath}`;
  }

  return `${normalizeSupabaseBaseUrl(
    SUPABASE_URL,
  )}/storage/v1/object/public/${STORAGE_BUCKET}/${cleanPath}`;
};

const isPdfFile = (url?: string | null) => {
  return String(url ?? "")
    .toLowerCase()
    .includes(".pdf");
};

const isImageFile = (url?: string | null) => {
  const normalized = String(url ?? "").toLowerCase();

  return (
    normalized.includes(".png") ||
    normalized.includes(".jpg") ||
    normalized.includes(".jpeg") ||
    normalized.includes(".webp")
  );
};

const extractFileNameFromUrl = (url?: string | null) => {
  const raw = String(url ?? "").trim();

  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const fileName = decodeURIComponent(parsed.pathname.split("/").pop() || "");

    return fileName || "example-file";
  } catch {
    const fileName = raw.split("/").pop() || "";

    return fileName || "example-file";
  }
};

const defaultValues: DocumentFormValues = {
  label: "",
  internal_code: "",
  file_type: "pdf",
  category: "identity",
  example_url: "",
  translation_needed: "no",
  required: true,
  auto_rename_pattern: "NONE",
  notes: "",
  ocr_keywords: "",
  ocr_pattern: "",
  autoRenameMode: "label_prefix",
};

const deriveAutoRenameMode = (pattern?: string): AutoRenameMode => {
  const raw = String(pattern ?? "").trim();
  const upper = raw.toUpperCase();

  if (!raw || upper === "NONE") return "none";
  if (upper === "DATE") return "date";
  if (upper === "DOCUMENT_ID") return "document_id";

  const lower = raw.toLowerCase();

  if (lower.startsWith("{studentname}_") && lower.endsWith(".pdf")) {
    return "label_prefix";
  }

  if (lower.endsWith("_{studentname}.pdf")) {
    return "label_suffix";
  }

  return "none";
};

export default function FormDocumentComponent({
  onSubmit,
  onDelete,
  onCancel,
  loading,
  deleteLoading,
  selectedDocument,
  existingCodes,
}: FormDocumentComponentProps) {
  const { notification } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [form] = Form.useForm<DocumentFormValues>();

  const autoRenameMode = Form.useWatch("autoRenameMode", form);
  const labelValue = Form.useWatch("label", form);
  const autoRenamePattern = Form.useWatch("auto_rename_pattern", form);
  const exampleUrl = Form.useWatch("example_url", form);
  const internalCodeValue = Form.useWatch("internal_code", form);

  const { uploadDocument, uploading } = useDocumentUpload();
  const { classifyFile, classifyDocument, generateKeywords, isLoading: isClassifyingOcr } = useOCRClassifier();

  const [lastUploadedExampleFileName, setLastUploadedExampleFileName] =
    useState("");
  const [extractingKeywords, setExtractingKeywords] = useState(false);
  const [extractedKeywordNotice, setExtractedKeywordNotice] = useState<string | null>(null);
  const [uploadedExampleFile, setUploadedExampleFile] = useState<File | null>(null);

  const labelToken = useMemo(
    () => normalizeLabelToken(labelValue),
    [labelValue],
  );

  const computedPattern = useMemo(
    () => buildAutoRenamePattern(autoRenameMode ?? "label_prefix", labelToken),
    [autoRenameMode, labelToken],
  );

  const suggestedKeywords = useMemo(() => {
    return getStandardDocumentKeywords({
      label: labelValue,
      internal_code: internalCodeValue,
    });
  }, [labelValue, internalCodeValue]);

  const publicExampleUrl = useMemo(() => {
    return toPublicStorageUrl(exampleUrl);
  }, [exampleUrl]);

  useEffect(() => {
    const nextPattern = computedPattern || "NONE";

    if (form.getFieldValue("auto_rename_pattern") !== nextPattern) {
      form.setFieldValue("auto_rename_pattern", nextPattern);
    }
  }, [computedPattern, form]);

  useEffect(() => {
    if (!selectedDocument) {
      form.setFieldsValue(defaultValues);
      return;
    }

    const publicUrl = toPublicStorageUrl(selectedDocument.example_url);

    const nextValues: DocumentFormValues = {
      ...defaultValues,
      label: selectedDocument.label ?? "",
      internal_code: selectedDocument.internal_code ?? "",
      file_type: selectedDocument.file_type ?? "pdf",
      category: selectedDocument.category ?? "identity",
      example_url: publicUrl,
      translation_needed: selectedDocument.translation_needed ?? "no",
      required: Boolean(selectedDocument.required),
      auto_rename_pattern: selectedDocument.auto_rename_pattern ?? "NONE",
      notes:
        selectedDocument.notes ||
        getStandardDocumentInstructions(selectedDocument) ||
        "",
      ocr_keywords:
        selectedDocument.ocr_keywords ||
        getStandardDocumentKeywords(selectedDocument) ||
        "",
      ocr_pattern: selectedDocument.ocr_pattern ?? "",
      autoRenameMode: deriveAutoRenameMode(
        selectedDocument.auto_rename_pattern,
      ),
    };

    form.setFieldsValue(nextValues);
  }, [form, selectedDocument]);

  useEffect(() => {
    if (labelValue) {
      if (!selectedDocument && !form.getFieldValue("notes")) {
        const standardNote = getStandardDocumentInstructions({
          label: labelValue,
          internal_code: internalCodeValue,
        });
        if (standardNote) {
          form.setFieldValue("notes", standardNote);
        }
      }
      if (!form.getFieldValue("ocr_keywords")) {
        const standardKws = getStandardDocumentKeywords({
          label: labelValue,
          internal_code: internalCodeValue,
        });
        if (standardKws) {
          form.setFieldValue("ocr_keywords", standardKws);
        }
      }
    }
  }, [form, labelValue, internalCodeValue, selectedDocument]);

  const exampleFileName = useMemo(() => {
    return (
      lastUploadedExampleFileName ||
      extractFileNameFromUrl(publicExampleUrl) ||
      "example-file"
    );
  }, [publicExampleUrl, lastUploadedExampleFileName]);

  const detectKeywords = async (fileObj?: File | null, url?: string | null) => {
    const keywordNotifyKey = "ocr-keywords";
    try {
      setExtractingKeywords(true);
      setExtractedKeywordNotice(null);

      const targetFile = fileObj || uploadedExampleFile;
      const targetUrl = url || publicExampleUrl;

      if (!targetFile && !targetUrl && !labelValue) {
        return;
      }

      notification.open({
        key: keywordNotifyKey,
        icon: <LoadingOutlined spin style={{ color: "#2563eb" }} />,
        message: "Memproses kata kunci OCR dengan AI...",
        duration: 0,
      });

      // 1. Panggil AI Generator di backend
      let result;
      try {
        result = await generateKeywords({
          file: targetFile ?? undefined,
          url: targetUrl ?? undefined,
          label: labelValue ?? undefined,
        });
      } catch {
        // Fallback jika API generateKeywords jaringan bermasalah
      }

      if (result?.keywords && result.keywords.length > 0) {
        const joined = result.keywords.join(", ");
        form.setFieldValue("ocr_keywords", joined);
        setExtractedKeywordNotice(
          `Kata kunci otomatis berhasil dirumuskan oleh AI: "${joined}". Anda dapat memeriksa atau menambahkannya.`
        );
        notification.success({
          key: keywordNotifyKey,
          message: "Kata kunci OCR berhasil dirumuskan",
        });
        return;
      }

      // 2. Fallback jika OCR atau AI belum menghasilkan kata kunci spesifik
      const standardFallback = getStandardDocumentKeywords({
        label: labelValue,
        internal_code: internalCodeValue,
      });
      const fallbackKws = extractKeywordsFromText("", labelValue);
      const combined = standardFallback || fallbackKws.join(", ");
      if (combined) {
        form.setFieldValue("ocr_keywords", combined);
        setExtractedKeywordNotice(
          `Kata kunci otomatis diselaraskan: "${combined}".`
        );
        notification.info({
          key: keywordNotifyKey,
          message: "Kata kunci diselaraskan dengan standar dokumen",
        });
      } else {
        setExtractedKeywordNotice(
          "Teks pada contoh dokumen terbaca, namun belum ditemukan kata kunci penanda yang spesifik. Anda dapat mengetiknya secara manual."
        );
        notification.warning({
          key: keywordNotifyKey,
          message: "Kata kunci spesifik belum ditemukan",
        });
      }
    } catch {
      setExtractedKeywordNotice(
        "Tidak dapat membaca contoh dokumen saat ini. Anda dapat mengetik kata kunci secara manual."
      );
      notification.error({
        key: keywordNotifyKey,
        message: "Gagal merumuskan kata kunci OCR",
      });
    } finally {
      setExtractingKeywords(false);
    }
  };

  const handleFinish = (values: DocumentFormValues) => {
    const payload: Omit<DocumentFormValues, "autoRenameMode"> = {
      ...values,
    };
    delete (payload as Partial<DocumentFormValues>).autoRenameMode;

    const publicUrl = toPublicStorageUrl(payload.example_url);

    onSubmit?.({
      ...payload,
      example_url: publicUrl || null,
      notes: payload.notes?.trim() || "",
    });
  };

  const previewPattern =
    autoRenamePattern && autoRenamePattern.includes("{studentName}")
      ? autoRenamePattern.replace("{studentName}", "Ngurah Manik Mahardika")
      : autoRenamePattern || "-";

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={defaultValues}
      >
        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Document Code"
              name="internal_code"
              rules={[
                { required: true, message: "Please enter document system code (e.g. PASSPORT)" },
                {
                  validator: (_, value) => {
                    const valStr = String(value ?? "").trim().toUpperCase();
                    if (!selectedDocument && valStr && existingCodes?.includes(valStr)) {
                      return Promise.reject(new Error("This document code is already in use. Please use a unique code or edit the existing document."));
                    }
                    return Promise.resolve();
                  },
                },
              ]}
              tooltip="Unique system code for automated integration and file validation."
            >
              <Input placeholder="Example: PASSPORT, ID_CARD" style={{ borderRadius: 10, height: 40 }} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Document Name"
              name="label"
              rules={[{ required: true, message: "Please enter the requirement document name" }]}
              tooltip="Official name of the requirement document displayed to students."
            >
              <Input placeholder="Example: Passport, National ID" style={{ borderRadius: 10, height: 40 }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={[16, 12]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Document Category"
              name="category"
              rules={[{ required: true, message: "Please select document category" }]}
              tooltip="Document category classification."
            >
              <Select
                style={{ height: 40 }}
                options={[
                  { value: "identity", label: "Identity" },
                  { value: "academic", label: "Academic" },
                  { value: "finance", label: "Finance" },
                  { value: "other", label: "Supporting" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Allowed File Formats"
              name="file_type"
              rules={[{ required: true, message: "Please select allowed file formats" }]}
              tooltip="Allowed file format extensions for upload."
            >
              <Select
                style={{ height: 40 }}
                options={[
                  { value: "pdf", label: "PDF" },
                  { value: "image", label: "JPG, PNG" },
                  { value: "pdf-image", label: "PDF, JPG" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: 12,
            padding: "14px 18px",
            marginBottom: 20,
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Form.Item name="required" valuePropName="checked" noStyle>
              <Switch checkedChildren="REQUIRED" unCheckedChildren="OPTIONAL" />
            </Form.Item>
            <span
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: "#1e293b",
                userSelect: "none",
              }}
            >
              Mandatory Document
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Form.Item
              name="translation_needed"
              valuePropName="checked"
              getValueProps={(value) => ({ checked: value === "yes" })}
              normalize={(checked) => (checked ? "yes" : "no")}
              noStyle
            >
              <Switch checkedChildren="YES" unCheckedChildren="NO" />
            </Form.Item>
            <span
              style={{
                fontWeight: 600,
                fontSize: 13.5,
                color: "#1e293b",
                userSelect: "none",
              }}
            >
              Requires Sworn Translation
            </span>
          </div>
        </div>

        <Form.Item
          label="Automatic File Renaming"
          tooltip="Standardized file naming pattern when students upload this document."
        >
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Form.Item name="autoRenameMode" noStyle>
              <Select
                style={{ height: 38 }}
                options={[
                  { value: "label_prefix", label: "Standard Format: [Student Name]_[CODE].pdf" },
                  { value: "label_suffix", label: "Alternative Format: [CODE]_[Student Name].pdf" },
                  { value: "none", label: "Keep Original Student File Name" },
                ]}
              />
            </Form.Item>

            <Form.Item name="auto_rename_pattern" noStyle>
              <Input readOnly placeholder="{studentName}_PASSPORT.pdf" style={{ borderRadius: 8, background: "#f8fafc" }} />
            </Form.Item>
          </Space>
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 6, fontWeight: 600, fontSize: 12 }}
          >
            FILE RENAMING SIMULATION
          </Text>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 14,
              background: "linear-gradient(90deg, #0f172a, #111827)",
              color: "#38bdf8",
              fontFamily: "monospace",
              fontSize: 13,
            }}
          >
            <span>{previewPattern}</span>
          </div>
        </div>

        <Form.Item
          label="Document Instructions"
          name="notes"
          tooltip="Special instructions or guidelines for students when preparing and uploading this document."
        >
          <Input.TextArea
            rows={4}
            placeholder="Petunjuk khusus bagi siswa saat menyiapkan berkas..."
            style={{ borderRadius: 8 }}
          />
        </Form.Item>

        <Divider style={{ margin: "16px 0" }} />

        {/* Pemeriksaan Dokumen Otomatis */}
        <Card
          size="small"
          style={{
            borderRadius: 12,
            border: "1px solid #bfdbfe",
            background: "#f0f7ff",
            marginBottom: 20,
          }}
          styles={{ body: { padding: 16 } }}
        >
          <Form.Item name="ocr_pattern" hidden noStyle>
            <Input />
          </Form.Item>

          <Space direction="vertical" size={10} style={{ width: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <Typography.Text strong style={{ fontSize: 14, color: "#1e3a8a" }}>
                  Automatic Document Verification (Optional)
                </Typography.Text>
                <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 2 }}>
                  Pencocokan kata kunci pada berkas untuk memastikan kebenaran dokumen yang diunggah siswa.
                </Typography.Text>
              </div>

              <Button
                size="small"
                icon={<BulbOutlined />}
                loading={extractingKeywords || isClassifyingOcr}
                disabled={!publicExampleUrl && !uploadedExampleFile && !labelValue}
                onClick={() => void detectKeywords(null, null)}
                style={{
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#1e40af",
                  borderColor: "#93c5fd",
                  background: "#ffffff",
                  height: 32,
                  fontWeight: 500,
                }}
              >
                {extractingKeywords || isClassifyingOcr
                  ? "Sedang Memindai..."
                  : publicExampleUrl || uploadedExampleFile
                    ? "Deteksi Otomatis dari Berkas Contoh"
                    : "Rekomendasikan Kata Kunci"}
              </Button>
            </div>

            <Form.Item
              name="ocr_keywords"
              label="Document Keywords"
              tooltip="Kata kunci spesifik yang terdapat di dalam dokumen, dipisahkan dengan tanda koma."
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="Contoh: bukti transfer, kwitansi pembayaran, biaya kuliah"
                style={{ borderRadius: 8, height: 40 }}
              />
            </Form.Item>

            {suggestedKeywords && (
              <div
                style={{
                  fontSize: 11.5,
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 6,
                  padding: "4px 8px",
                  background: "#f8fafc",
                  borderRadius: 6,
                  border: "1px dashed #cbd5e1",
                }}
              >
                <span>
                  Standar sistem:{" "}
                  <strong style={{ color: "#1e3a8a" }}>{suggestedKeywords}</strong>
                </span>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: "auto", fontSize: 11.5, color: "#2563eb" }}
                  onClick={() => {
                    form.setFieldValue("ocr_keywords", suggestedKeywords);
                    setExtractedKeywordNotice(
                      `Kata kunci diselaraskan dengan standar dokumen: "${suggestedKeywords}".`
                    );
                  }}
                >
                  Terapkan Rekomendasi
                </Button>
              </div>
            )}

            {extractingKeywords || isClassifyingOcr ? (
              <div
                style={{
                  marginTop: 4,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  fontSize: 12,
                  color: "#1e40af",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <LoadingOutlined style={{ color: "#2563eb", flexShrink: 0 }} />
                <span>
                  Sistem sedang membaca teks dari berkas contoh Anda. Mohon tunggu beberapa saat...
                </span>
              </div>
            ) : null}

            {extractedKeywordNotice && !extractingKeywords && !isClassifyingOcr ? (
              <div
                style={{
                  marginTop: 4,
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#ffffff",
                  border: "1px solid #bfdbfe",
                  fontSize: 12,
                  color: "#1e3a8a",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircleOutlined style={{ color: "#2563eb", flexShrink: 0 }} />
                <span>{extractedKeywordNotice}</span>
              </div>
            ) : null}
          </Space>
        </Card>

        <Divider style={{ margin: "16px 0" }} />

        <Form.Item
          label="Reference Document Sample"
          tooltip="Berkas contoh sebagai acuan standar dokumen yang valid bagi siswa."
        >
          <Form.Item name="example_url" hidden noStyle>
            <Input />
          </Form.Item>
          <Space direction="vertical" size={12} style={{ width: "100%" }}>
            <Upload
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              maxCount={1}
              showUploadList
              fileList={
                publicExampleUrl
                  ? ([
                      {
                        uid: "example",
                        name: exampleFileName || "example-file",
                        status: "done",
                        url: publicExampleUrl,
                      } satisfies UploadFile,
                    ] as UploadFile[])
                  : []
              }
              onRemove={() => {
                form.setFieldValue("example_url", "");
                setLastUploadedExampleFileName("");
                setUploadedExampleFile(null);
                setExtractedKeywordNotice(null);
                return true;
              }}
              onPreview={(file) => {
                const url = String(file.url ?? publicExampleUrl ?? "");
                if (!url) return;
                window.open(url, "_blank", "noreferrer");
              }}
              customRequest={async (options: UploadRequestOption) => {
                try {
                  const file = options.file as File;
                  const safeName = sanitizeFileName(file.name || "example");
                  const internalCode = sanitizeFileName(
                    String(internalCodeValue || "document"),
                  );

                  const unique = `${Date.now()}-${Math.random()
                    .toString(16)
                    .slice(2)}`;

                  const path = `examples/documents-management/${internalCode}/${unique}-${safeName}`;

                  const result = await uploadDocument({
                    file,
                    path,
                    content_type: file.type,
                  });

                  const uploadedUrl = toPublicStorageUrl(result.url || path);

                  form.setFieldValue("example_url", uploadedUrl);
                  setLastUploadedExampleFileName(file.name || "example-file");
                  setUploadedExampleFile(file);
                  options.onSuccess?.(result, file);

                  notification.success({
                    message: "Contoh dokumen berhasil diunggah",
                  });

                  const currentKeywords = form.getFieldValue("ocr_keywords");
                  if (!currentKeywords || String(currentKeywords).trim() === "") {
                    void detectKeywords(file, uploadedUrl);
                  }
                } catch (err) {
                  notification.error({
                    message: "Gagal mengunggah contoh dokumen",
                  });
                  options.onError?.(
                    err instanceof Error ? err : new Error("Upload gagal"),
                  );
                }
              }}
            >
              <Button loading={uploading} block={isMobile}>
                Upload
              </Button>
            </Upload>

            {publicExampleUrl ? (
              <Card size="small" title="Document Preview">
                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {isImageFile(publicExampleUrl) ? (
                    <Image
                      src={publicExampleUrl}
                      alt={exampleFileName}
                      width={1280}
                      height={720}
                      unoptimized
                      style={{
                        width: "100%",
                        height: "auto",
                        maxHeight: 360,
                        objectFit: "contain",
                        borderRadius: 8,
                        border: "1px solid #f0f0f0",
                      }}
                    />
                  ) : null}

                  {isPdfFile(publicExampleUrl) ? (
                    <iframe
                      src={publicExampleUrl}
                      title={exampleFileName}
                      style={{
                        width: "100%",
                        height: 420,
                        border: "1px solid #f0f0f0",
                        borderRadius: 8,
                      }}
                    />
                  ) : null}

                  {!isPdfFile(publicExampleUrl) &&
                  !isImageFile(publicExampleUrl) ? (
                    <Text type="secondary">
                      Preview not available for this file type.
                    </Text>
                  ) : null}

                  <Button
                    onClick={() =>
                      window.open(publicExampleUrl, "_blank", "noreferrer")
                    }
                  >
                    Open in New Tab
                  </Button>
                </Space>
              </Card>
            ) : null}
          </Space>
        </Form.Item>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 12,
            marginTop: 24,
            paddingTop: 16,
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Button
            onClick={onCancel}
            style={{ borderRadius: 10, height: 40, padding: "0 20px" }}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{
              borderRadius: 10,
              height: 40,
              padding: "0 24px",
              background: "#1b3d6d",
              fontWeight: 600,
            }}
          >
            {selectedDocument ? "Save Changes" : "Save Document"}
          </Button>
        </div>
      </Form>
    </div>
  );
}
