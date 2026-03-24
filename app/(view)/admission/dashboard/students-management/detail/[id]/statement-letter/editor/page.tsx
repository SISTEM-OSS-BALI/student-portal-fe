"use client";

import OnlyOfficeEditor from "@/app/components/OnlyOfficeEditor";
import { useGeneratedStatementLetterAiDocuments } from "@/app/hooks/use-generated-statement-letter-ai-documents";
import { useUser } from "@/app/hooks/use-users";
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FileWordOutlined,
  GlobalOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, Row, Space, Spin, Tag, Typography } from "antd";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const ONLYOFFICE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_ONLYOFFICE_URL?.trim()) ||
  "";
const ONLYOFFICE_CALLBACK_BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_ONLYOFFICE_CALLBACK_BASE_URL?.trim()) ||
  "";

const appendCacheBust = (url: string, version?: string | null) => {
  if (!url || url.startsWith("blob:")) return url;

  const separator = url.includes("?") ? "&" : "?";
  const safeVersion = encodeURIComponent(String(version ?? Date.now()));
  return `${url}${separator}v=${safeVersion}`;
};

export default function StatementLetterEditorPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { data: studentData } = useUser({ id: studentId as string });
  const { data: generatedDocuments = [], fetchLoading } =
    useGeneratedStatementLetterAiDocuments({
      studentId: studentId as string,
      enabled: Boolean(studentId),
      refetchInterval: 5000,
    });
  const { onUpsert: onUpsertGeneratedStatementLetterAi, onUpsertLoading } =
    useGeneratedStatementLetterAiDocuments({
      studentId: studentId as string,
      enabled: false,
    });
  const [saveState, setSaveState] = useState<"saving" | "saved">("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [editorFilePath, setEditorFilePath] = useState<string | null>(null);
  const [editorDocumentUrl, setEditorDocumentUrl] = useState("");
  const [finalizingPdf, setFinalizingPdf] = useState(false);

  const generatedDocument = generatedDocuments[0] ?? null;
  const documentTitle =
    generatedDocument?.file_name ??
    `${studentData?.name ?? "Student"}_Statement_Letter.docx`;
  const callbackUrl = useMemo(() => {
    if (!generatedDocument?.file_path) return null;

    const callbackBase =
      ONLYOFFICE_CALLBACK_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    if (!callbackBase) return null;

    const base = callbackBase.replace(/\/+$/, "");
    const params = new URLSearchParams({
      path: generatedDocument.file_path,
      bucket: "student-portal",
    });
    return `${base}/api/generate-statement-letter-ai/onlyoffice/callback?${params.toString()}`;
  }, [generatedDocument?.file_path]);

  const studentCountry = studentData?.stage?.country?.name ?? "Destination not set";
  const studentCampus = studentData?.name_campus ?? "Campus not set";
  const studentDegree = studentData?.name_degree ?? studentData?.degree ?? "Degree not set";
  const isPdfActive =
    String(generatedDocument?.file_type ?? "").toLowerCase() === "application/pdf";
  const hasWordBackup = Boolean(generatedDocument?.word_file_url);
  const lastSavedLabel = useMemo(() => {
    if (!lastSavedAt) return "Belum ada penyimpanan";

    const parsed = new Date(lastSavedAt);
    if (Number.isNaN(parsed.getTime())) return lastSavedAt;
    return parsed.toLocaleString();
  }, [lastSavedAt]);

  useEffect(() => {
    if (!generatedDocument?.updated_at) return;
    setLastSavedAt(generatedDocument.updated_at);
    setSaveState("saved");
  }, [generatedDocument?.updated_at]);

  useEffect(() => {
    if (!generatedDocument?.file_path || !generatedDocument?.file_url) return;
    if (editorFilePath === generatedDocument.file_path) return;

    setEditorFilePath(generatedDocument.file_path);
    setEditorDocumentUrl(
      appendCacheBust(generatedDocument.file_url, generatedDocument.file_path),
    );
  }, [
    editorFilePath,
    generatedDocument?.file_path,
    generatedDocument?.file_url,
  ]);

  const handleFinalizePdf = async () => {
    if (!generatedDocument?.file_url || !generatedDocument?.file_path) return;

    setFinalizingPdf(true);
    try {
      const res = await axios.post("/api/generate-statement-letter-ai/finalize-pdf", {
        student_id: studentId,
        source_file_url: generatedDocument.file_url,
        source_file_path: generatedDocument.file_path,
        source_file_name: generatedDocument.file_name,
        source_file_type: generatedDocument.file_type,
        word_file_url: generatedDocument.word_file_url,
        word_file_path: generatedDocument.word_file_path,
        word_file_name: generatedDocument.word_file_name,
        word_file_type: generatedDocument.word_file_type,
      });

      await onUpsertGeneratedStatementLetterAi(res.data?.result);
    } finally {
      setFinalizingPdf(false);
    }
  };

  const handleRevertToWord = async () => {
    if (!generatedDocument?.word_file_url) return;

    await onUpsertGeneratedStatementLetterAi({
      student_id: studentId as string,
      file_url: generatedDocument.word_file_url,
      file_path: generatedDocument.word_file_path,
      file_name: generatedDocument.word_file_name,
      file_type: generatedDocument.word_file_type,
      word_file_url: generatedDocument.word_file_url,
      word_file_path: generatedDocument.word_file_path,
      word_file_name: generatedDocument.word_file_name,
      word_file_type: generatedDocument.word_file_type,
      status: "generated",
    });
  };

  return (
    <Space
      direction="vertical"
      size={20}
      style={{
        width: "100%",
        paddingBottom: 12,
      }}
    >
      <Card
        bodyStyle={{ padding: 24 }}
        style={{
          borderRadius: 24,
          borderColor: "#dbe6f3",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, rgba(239,246,255,0.95) 0%, rgba(255,255,255,0.98) 58%, rgba(236,253,245,0.95) 100%)",
          boxShadow: "0 22px 50px rgba(15, 23, 42, 0.08)",
        }}
      >
        <Row gutter={[20, 20]} align="middle">
          <Col xs={24} xl={16}>
            <Space direction="vertical" size={12} style={{ width: "100%" }}>

              <div>
                <Typography.Title
                  level={2}
                  style={{
                    margin: 0,
                    fontSize: 42,
                    lineHeight: 1.05,
                    letterSpacing: -1.4,
                  }}
                >
                  Statement Letter Editor
                </Typography.Title>
                <Typography.Text
                  type="secondary"
                  style={{ display: "block", marginTop: 8, fontSize: 17 }}
                >
                  Edit letter hasil generate AI untuk {studentData?.name ?? "student"}.
                </Typography.Text>
              </div>

              <Space wrap size={[10, 10]}>
                <Tag
                  bordered={false}
                  style={{
                    margin: 0,
                    padding: "8px 12px",
                    borderRadius: 14,
                    background: "#ffffff",
                  }}
                >
                  <GlobalOutlined /> {studentCountry}
                </Tag>
                <Tag
                  bordered={false}
                  style={{
                    margin: 0,
                    padding: "8px 12px",
                    borderRadius: 14,
                    background: "#ffffff",
                  }}
                >
                  <EnvironmentOutlined /> {studentCampus}
                </Tag>
                <Tag
                  bordered={false}
                  style={{
                    margin: 0,
                    padding: "8px 12px",
                    borderRadius: 14,
                    background: "#ffffff",
                  }}
                >
                  <ReadOutlined /> {studentDegree}
                </Tag>
              </Space>
            </Space>
          </Col>

          <Col xs={24} xl={8}>
            <Card
              bodyStyle={{ padding: 18 }}
              style={{
                borderRadius: 20,
                borderColor: "#d7e3f1",
                background: "rgba(255,255,255,0.88)",
              }}
            >
              <Space direction="vertical" size={14} style={{ width: "100%" }}>
                <div>
                  <Typography.Text type="secondary">Current File</Typography.Text>
                  <Typography.Title level={5} style={{ margin: "6px 0 0" }}>
                    {documentTitle}
                  </Typography.Title>
                </div>

                <Typography.Text type="secondary">
                  Hasil edit akan tersimpan kembali ke file statement letter student yang aktif.
                </Typography.Text>

                <div
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: saveState === "saving" ? "#fff7ed" : "#f0fdf4",
                    border:
                      saveState === "saving"
                        ? "1px solid #fdba74"
                        : "1px solid #86efac",
                  }}
                >
                  <Typography.Text
                    strong
                    style={{
                      display: "block",
                      color: saveState === "saving" ? "#c2410c" : "#15803d",
                    }}
                  >
                    {saveState === "saving" ? "Saving..." : "Saved"}
                  </Typography.Text>
                  <Typography.Text type="secondary">
                    Last saved at: {lastSavedLabel}
                  </Typography.Text>
                </div>

                <Space direction="vertical" size={10} style={{ width: "100%" }}>
                  {!isPdfActive ? (
                    <Button
                      type="primary"
                      size="large"
                      block
                      loading={finalizingPdf}
                      onClick={handleFinalizePdf}
                    >
                      Finalize to PDF
                    </Button>
                  ) : null}

                  {isPdfActive && hasWordBackup ? (
                    <Button
                      size="large"
                      block
                      loading={onUpsertLoading}
                      onClick={handleRevertToWord}
                    >
                      Revert to Word
                    </Button>
                  ) : null}

                  <Button
                    icon={<ArrowLeftOutlined />}
                    size="large"
                    block
                    onClick={() =>
                      router.push(
                        `/admission/dashboard/students-management/detail/${studentId}`,
                      )
                    }
                  >
                    Back to Student Detail
                  </Button>

                  {generatedDocument?.file_url ? (
                    <Button
                      type="primary"
                      icon={<FileWordOutlined />}
                      size="large"
                      block
                      href={generatedDocument.file_url}
                      target="_blank"
                    >
                      {isPdfActive ? "Download Current PDF" : "Download Current Word"}
                    </Button>
                  ) : null}
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {!ONLYOFFICE_URL ? (
        <Alert
          showIcon
          type="warning"
          message="OnlyOffice belum dikonfigurasi"
          description="Set NEXT_PUBLIC_ONLYOFFICE_URL agar editor dapat dibuka di halaman ini."
        />
      ) : null}

      {fetchLoading ? (
        <Card style={{ minHeight: "80vh", display: "grid", placeItems: "center" }}>
          <Spin size="large" />
        </Card>
      ) : null}

      {!fetchLoading && !generatedDocument ? (
        <Alert
          showIcon
          type="info"
          message="Statement letter belum tersedia"
          description="Generate statement letter terlebih dahulu sebelum membuka editor."
        />
      ) : null}

      {!fetchLoading &&
      generatedDocument &&
      !isPdfActive &&
      (!callbackUrl || !ONLYOFFICE_URL) ? (
        <Alert
          showIcon
          type="warning"
          message="Editor belum siap"
          description="Path file atau konfigurasi callback OnlyOffice belum lengkap."
        />
      ) : null}

      {!fetchLoading &&
      generatedDocument &&
      ((isPdfActive && generatedDocument.file_url) ||
        (!isPdfActive && callbackUrl && ONLYOFFICE_URL && editorDocumentUrl)) ? (
        <Card
          bodyStyle={{ padding: 0 }}
          style={{
            borderRadius: 24,
            overflow: "hidden",
            borderColor: "#dbe6f3",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #e5edf6",
              background:
                "linear-gradient(180deg, rgba(248,250,252,0.98) 0%, rgba(255,255,255,1) 100%)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <Space direction="vertical" size={2}>
                <Typography.Text strong style={{ fontSize: 15 }}>
                  Live Document Session
                </Typography.Text>
                <Typography.Text type="secondary">
                  {isPdfActive
                    ? "Dokumen sudah difinalisasi ke PDF. Gunakan revert jika ingin kembali mengedit versi Word."
                    : "Preview, edit, dan simpan statement letter langsung dari browser."}
                </Typography.Text>
              </Space>

              <Space wrap size={[8, 8]}>
                {!isPdfActive ? (
                  <>
                    <Tag
                      color="processing"
                      style={{ borderRadius: 999, margin: 0, paddingInline: 10 }}
                    >
                      <EyeOutlined /> Editable
                    </Tag>
                    <Tag
                      color="success"
                      style={{ borderRadius: 999, margin: 0, paddingInline: 10 }}
                    >
                      Auto-save Callback
                    </Tag>
                  </>
                ) : (
                  <Tag
                    color="gold"
                    style={{ borderRadius: 999, margin: 0, paddingInline: 10 }}
                  >
                    Final PDF
                  </Tag>
                )}
                <Tag
                  color={saveState === "saving" ? "orange" : "green"}
                  style={{ borderRadius: 999, margin: 0, paddingInline: 10 }}
                >
                  {saveState === "saving" ? "Saving..." : "Saved"}
                </Tag>
              </Space>
            </div>
          </div>

          <div style={{ height: "82vh", background: "#ffffff" }}>
            {isPdfActive ? (
              <iframe
                title={documentTitle}
                src={generatedDocument.file_url}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <OnlyOfficeEditor
                key={editorFilePath ?? generatedDocument.file_path}
                callbackUrl={callbackUrl ?? ""}
                documentTitle={documentTitle}
                documentUrl={editorDocumentUrl}
                editorUrl={ONLYOFFICE_URL}
                onDocumentStateChange={(isDirty) =>
                  setSaveState(isDirty ? "saving" : "saved")
                }
              />
            )}
          </div>
        </Card>
      ) : null}
    </Space>
  );
}
