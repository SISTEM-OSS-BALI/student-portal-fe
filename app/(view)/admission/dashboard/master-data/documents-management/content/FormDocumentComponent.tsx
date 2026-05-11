import {
  DocumentDataModel,
  DocumentPayloadCreateModel,
} from "@/app/models/documents-management";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import {
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

type FormDocumentComponentProps = {
  onSubmit?: (data: DocumentPayloadCreateModel) => void;
  onDelete?: () => void;
  onCancel?: () => void;
  loading?: boolean;
  deleteLoading?: boolean;
  selectedDocument?: DocumentDataModel | null;
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
}: FormDocumentComponentProps) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [form] = Form.useForm<DocumentFormValues>();

  const autoRenameMode = Form.useWatch("autoRenameMode", form);
  const labelValue = Form.useWatch("label", form);
  const autoRenamePattern = Form.useWatch("auto_rename_pattern", form);
  const exampleUrl = Form.useWatch("example_url", form);
  const internalCodeValue = Form.useWatch("internal_code", form);

  const { uploadDocument, uploading } = useDocumentUpload();

  const [lastUploadedExampleFileName, setLastUploadedExampleFileName] =
    useState("");

  const labelToken = useMemo(
    () => normalizeLabelToken(labelValue),
    [labelValue],
  );

  const computedPattern = useMemo(
    () => buildAutoRenamePattern(autoRenameMode ?? "label_prefix", labelToken),
    [autoRenameMode, labelToken],
  );

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
      notes: selectedDocument.notes ?? "",
      autoRenameMode: deriveAutoRenameMode(
        selectedDocument.auto_rename_pattern,
      ),
    };

    form.setFieldsValue(nextValues);
  }, [form, selectedDocument]);

  const exampleFileName = useMemo(() => {
    return (
      lastUploadedExampleFileName ||
      extractFileNameFromUrl(publicExampleUrl) ||
      "example-file"
    );
  }, [publicExampleUrl, lastUploadedExampleFileName]);

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
        <Form.Item
          label="Label dokumen untuk siswa"
          name="label"
          rules={[{ required: true, message: "Silakan isi label dokumen" }]}
        >
          <Input placeholder="Paspor" />
        </Form.Item>

        <Row gutter={[16, 4]}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Kode Internal"
              name="internal_code"
              rules={[{ required: true, message: "Silakan isi kode internal" }]}
            >
              <Input placeholder="PASPOR" />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Tipe Berkas"
              name="file_type"
              rules={[{ required: true, message: "Silakan pilih tipe berkas" }]}
            >
              <Select
                options={[
                  { value: "pdf", label: "PDF saja" },
                  { value: "image", label: "Gambar (JPG/PNG)" },
                  { value: "pdf-image", label: "PDF atau gambar" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Kategori"
              name="category"
              rules={[{ required: true, message: "Silakan pilih kategori" }]}
            >
              <Select
                options={[
                  { value: "identity", label: "Identitas" },
                  { value: "academic", label: "Akademik" },
                  { value: "finance", label: "Keuangan" },
                  { value: "other", label: "Lainnya" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              label="Perlu Terjemahan"
              name="translation_needed"
              rules={[{ required: true, message: "Silakan pilih opsi" }]}
            >
              <Select
                options={[
                  { value: "no", label: "Tidak" },
                  { value: "yes", label: "Ya" },
                ]}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Wajib" style={{ marginBottom: 6 }}>
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <div>
              <Text strong>Siswa wajib mengunggah dokumen ini</Text>
            </div>

            <Form.Item name="required" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item label="Pola nama otomatis">
          <Space direction="vertical" size={8} style={{ width: "100%" }}>
            <Form.Item name="autoRenameMode" noStyle>
              <Select
                options={[
                  { value: "label_prefix", label: "Nama siswa + Label" },
                  { value: "label_suffix", label: "Label + Nama siswa" },
                ]}
              />
            </Form.Item>

            <Form.Item name="auto_rename_pattern" noStyle>
              <Input readOnly placeholder="{studentName}_PASPOR.pdf" />
            </Form.Item>
          </Space>
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <Text
            type="secondary"
            style={{ display: "block", marginBottom: 8, fontWeight: 600 }}
          >
            NAMA BERKAS OTOMATIS SISTEM
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
              color: "#fff",
            }}
          >
            <Text style={{ color: "#fff" }}>{previewPattern}</Text>
          </div>
        </div>

        <Form.Item label="Catatan untuk admisi" name="notes">
          <Input.TextArea
            rows={4}
            placeholder="Pastikan paspor masih berlaku minimal 6 bulan dari tanggal keberangkatan."
          />
        </Form.Item>

        <Text type="secondary">Hanya terlihat oleh tim internal</Text>

        <Divider style={{ margin: "16px 0" }} />

        <Form.Item label="Contoh Dokumen (opsional)" name="example_url">
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
                  options.onSuccess?.(result, file);
                } catch (err) {
                  options.onError?.(
                    err instanceof Error ? err : new Error("Upload gagal"),
                  );
                }
              }}
            >
              <Button loading={uploading} block={isMobile}>
                Upload Contoh
              </Button>
            </Upload>

            {publicExampleUrl ? (
              <Card size="small" title="Preview Dokumen">
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
                      Preview tidak tersedia untuk tipe file ini.
                    </Text>
                  ) : null}

                  <Button
                    onClick={() =>
                      window.open(publicExampleUrl, "_blank", "noreferrer")
                    }
                  >
                    Buka di Tab Baru
                  </Button>
                </Space>
              </Card>
            ) : null}
          </Space>
        </Form.Item>

        <Divider style={{ margin: "16px 0" }} />

        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} md={12}>
            <Space
              wrap
              style={{
                width: "100%",
                justifyContent: "flex-start",
              }}
            >
              <Button disabled={!selectedDocument} block={isMobile}>
                Duplikasi
              </Button>

              <Button onClick={onCancel} block={isMobile}>
                Batalkan Perubahan
              </Button>
            </Space>
          </Col>

          <Col xs={24} md={12}>
            <Space
              wrap
              style={{
                width: "100%",
                justifyContent: isMobile ? "flex-start" : "flex-end",
              }}
            >
              <Button
                danger
                onClick={onDelete}
                disabled={!selectedDocument}
                loading={deleteLoading}
                block={isMobile}
              >
                Arsipkan
              </Button>

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block={isMobile}
              >
                {selectedDocument ? "Simpan Perubahan" : "Simpan Tipe Dokumen"}
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
