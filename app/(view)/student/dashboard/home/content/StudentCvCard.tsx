"use client";

import React, { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  Card,
  Col,
  Flex,
  Modal,
  Row,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import {
  ArrowRightOutlined,
  CheckCircleFilled,
  ExclamationCircleOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileTextOutlined,
  FormOutlined,
  InfoCircleOutlined,
  LinkOutlined,
  PrinterOutlined,
  SendOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import { useQuestions } from "@/app/hooks/use-questions";
import { useDocumentUpload } from "@/app/hooks/use-document-uploads";
import { useAnswerDocuments } from "@/app/hooks/use-answer-documents";
import type { UserDataModel } from "@/app/models/user";
import type {
  AnswerDocumentDataModel,
  AnswerQuestionDataModel,
} from "@/app/models/question";
import { extractStudentCvData } from "@/app/(view)/admission/dashboard/students-management/detail/[id]/cv/editor/utils";
import Template1 from "@/app/(view)/admission/dashboard/students-management/detail/[id]/cv/editor/Template1";
import Template7 from "@/app/(view)/admission/dashboard/students-management/detail/[id]/cv/editor/Template7";
import type { CvData, CvTemplateId } from "@/app/(view)/admission/dashboard/students-management/detail/[id]/cv/editor/types";
import styles from "./home.module.css";

const { Text, Title, Paragraph } = Typography;

interface StudentCvCardProps {
  user?: UserDataModel | null;
  answerQuestions?: AnswerQuestionDataModel[];
  answerDocuments?: AnswerDocumentDataModel[];
}

export default function StudentCvCard({
  user,
  answerQuestions = [],
  answerDocuments = [],
}: StudentCvCardProps) {
  const { notification } = App.useApp();
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<CvTemplateId>(1);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewZoom, setPreviewZoom] = useState<number>(0.85);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isIncompleteModalOpen, setIsIncompleteModalOpen] = useState(false);

  const printAreaRef = useRef<HTMLDivElement>(null);
  const modalPrintAreaRef = useRef<HTMLDivElement>(null);

  const { data: questionBases = [] } = useQuestionBases({});
  const { data: questions = [] } = useQuestions({});
  const { uploadDocument, uploading } = useDocumentUpload();
  const {
    onCreate: submitDocuments,
    onUpdate: updateDocument,
  } = useAnswerDocuments({
    queryString: user?.id ? `student_id=${user.id}` : undefined,
    enabled: Boolean(user?.id),
  });

  // Cek apakah dokumen CV sudah pernah di-submit
  const existingCvDoc = useMemo(() => {
    return (answerDocuments ?? []).find(
      (doc) => String(doc.document_id) === "doc_cv" && Boolean(doc.file_url),
    );
  }, [answerDocuments]);

  // Siapkan data CV dari jawaban formulir mahasiswa
  const cvData: CvData = useMemo(() => {
    const extracted = extractStudentCvData(
      user,
      answerQuestions,
      questions,
      questionBases,
    );
    return {
      ...extracted,
      template_id: selectedTemplate,
    };
  }, [user, answerQuestions, questions, questionBases, selectedTemplate]);

  // Periksa apakah siswa sudah memiliki data wajib untuk menyusun CV
  const hasSufficientCvData = useMemo(() => {
    // 1. Jawaban kuesioner pada Personal Info
    const hasAnswers = (answerQuestions ?? []).some(
      (ans) =>
        Boolean(ans.answer_text?.trim()) ||
        Boolean(ans.selected_option_ids && ans.selected_option_ids.length > 0),
    );

    // 2. Data pendidikan kampus / jurusan dari profil
    const cleanCampus = String(user?.name_campus ?? "").trim();
    const hasValidCampus = Boolean(
      cleanCampus && cleanCampus !== "-" && cleanCampus !== "null",
    );
    const cleanDegree = String(user?.degree ?? user?.name_degree ?? "").trim();
    const hasValidDegree = Boolean(
      cleanDegree && cleanDegree !== "-" && cleanDegree !== "null",
    );

    // 3. Riwayat pendidikan, pengalaman, dan keahlian di objek CV
    const hasEducation = Boolean(
      (cvData.educations && cvData.educations.length > 0) ||
        (cvData.formal_educations && cvData.formal_educations.length > 0) ||
        hasValidCampus ||
        hasValidDegree,
    );
    const hasExperience = Boolean(
      (cvData.experiences && cvData.experiences.length > 0) ||
        (cvData.employment_history && cvData.employment_history.length > 0),
    );
    const hasBasicProfile = Boolean(
      (cvData.skills && cvData.skills.length > 0) ||
        Boolean(cvData.profile_description?.trim()) ||
        Boolean(cvData.date_of_birth?.trim()) ||
        Boolean(cvData.passport_number?.trim()) ||
        Boolean(cvData.id_number?.trim()),
    );

    return hasAnswers || hasEducation || hasExperience || hasBasicProfile;
  }, [answerQuestions, cvData, user]);

  const showIncompleteDataNotice = () => {
    setIsIncompleteModalOpen(true);
    notification.warning({
      message: "Data Diri Belum Lengkap",
      description:
        "Mohon isi kelengkapan data wajib di menu Personal Info terlebih dahulu sebelum membuat CV.",
    });
  };

  const handleOpenPreview = () => {
    if (!hasSufficientCvData) {
      showIncompleteDataNotice();
      return;
    }
    setIsPreviewOpen(true);
  };

  // Eksekusi cetak / simpan PDF terisolasi
  const handlePrint = (titlePrefix: string) => {
    const targetElement = modalPrintAreaRef.current || printAreaRef.current;
    if (!targetElement) return;

    const rawHtml = targetElement.innerHTML;
    if (!rawHtml) return;

    const docTitle = `${titlePrefix}_${cvData.first_name || "Student"}_CV`;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${docTitle}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm 10mm 12mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          ${rawHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        iframe.remove();
      }, 2000);
    }, 350);
  };

  // Submit CV langsung ke Kebutuhan Dokumen (doc_cv)
  const handleSubmitToDocuments = async () => {
    if (!hasSufficientCvData) {
      showIncompleteDataNotice();
      return;
    }

    const targetElement = modalPrintAreaRef.current || printAreaRef.current;
    if (!targetElement || !user?.id) {
      notification.error({
        message: "Data tidak lengkap",
        description: "Tidak dapat menghasilkan CV. Pastikan profil telah dimuat.",
      });
      return;
    }

    const rawHtml = targetElement.innerHTML;
    if (!rawHtml) return;

    setIsSubmitting(true);
    try {
      const studentName = (user.name || "Student")
        .trim()
        .replace(/[^a-zA-Z0-9]/g, "_");
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${studentName}_Curriculum_Vitae</title>
  <style>
    @page { size: A4 portrait; margin: 10mm 12mm 10mm 12mm; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    body {
      margin: 0;
      padding: 30px 15px;
      background: #f8fafc;
      color: #0f172a;
      font-family: Arial, Helvetica, sans-serif;
      display: flex;
      justify-content: center;
    }
    .cv-container {
      width: 210mm;
      min-height: 297mm;
      background: #ffffff;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .cv-container { width: 100%; box-shadow: none; margin: 0; }
    }
  </style>
</head>
<body>
  <div class="cv-container">
    ${rawHtml}
  </div>
</body>
</html>`;

      const fileName = `${studentName}_CV.html`;
      const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
      const file = new File([blob], fileName, { type: "text/html" });

      const uploaded = await uploadDocument({
        file,
        path: `documents/doc_cv/${Date.now()}-${fileName}`,
        content_type: "text/html",
        student_folder_key: `${studentName}-${user.id}`,
      });

      if (existingCvDoc?.id) {
        await updateDocument({
          id: existingCvDoc.id,
          payload: {
            file_url: uploaded.url,
            file_path: uploaded.path,
            file_name: fileName,
            file_type: "text/html",
            status: "SUBMITTED",
          },
        });
      } else {
        await submitDocuments([
          {
            student_id: String(user.id),
            document_id: "doc_cv",
            file_name: fileName,
            file_url: uploaded.url,
            file_path: uploaded.path,
            file_type: "text/html",
            status: "SUBMITTED",
          },
        ]);
      }

      notification.success({
        message: "Curriculum Vitae Berhasil Disimpan",
        description:
          "Dokumen Curriculum Vitae Anda telah tersimpan dan status persyaratan dokumen telah terpenuhi.",
      });

      setIsPreviewOpen(false);
    } catch (err) {
      console.error(err);
      notification.error({
        message: "Gagal Menyimpan Curriculum Vitae",
        description:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengunggah CV.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActiveTemplate = () => {
    if (selectedTemplate === 7) {
      return <Template7 cv={cvData} />;
    }
    return <Template1 cv={cvData} />;
  };

  return (
    <>
      {/* Hidden container for extracting rendered HTML if preview modal hasn't opened yet */}
      <div
        ref={printAreaRef}
        style={{
          position: "absolute",
          top: -99999,
          left: -99999,
          width: "210mm",
          visibility: "hidden",
        }}
      >
        {renderActiveTemplate()}
      </div>

      {/* COMPACT DASHBOARD CARD */}
      <Card
        className={styles.dashboardCard}
        style={{
          overflow: "hidden",
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          {/* Sisi Kiri: Deskripsi & Status Dokumen */}
          <Col xs={24} md={13} lg={14}>
            <Flex gap={12} align="start">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  fontSize: 18,
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.2)",
                  flexShrink: 0,
                }}
              >
                <FileTextOutlined />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <Flex align="center" gap={8} wrap="wrap">
                  <Text strong style={{ fontSize: 14.5, color: "#0f172a" }}>
                    Pembuat Curriculum Vitae
                  </Text>
                  {!hasSufficientCvData ? (
                    <Tag
                      color="warning"
                      icon={<ExclamationCircleOutlined />}
                      style={{
                        borderRadius: 6,
                        paddingInline: 8,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Data Belum Lengkap
                    </Tag>
                  ) : existingCvDoc ? (
                    <Tag
                      color="success"
                      icon={<CheckCircleFilled />}
                      style={{
                        borderRadius: 6,
                        paddingInline: 8,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Telah Disimpan
                    </Tag>
                  ) : (
                    <Tag
                      color="gold"
                      style={{
                        borderRadius: 6,
                        paddingInline: 8,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      Wajib Diajukan
                    </Tag>
                  )}
                </Flex>

                <Paragraph
                  type="secondary"
                  style={{
                    fontSize: 12.5,
                    margin: "4px 0 0 0",
                    lineHeight: 1.45,
                  }}
                >
                  {!hasSufficientCvData
                    ? "Formulir data diri Anda masih belum lengkap. Lengkapi data pribadi dan riwayat pendidikan pada menu Informasi Pribadi agar Curriculum Vitae dapat disusun secara otomatis."
                    : "Susun berkas Curriculum Vitae secara otomatis dari formulir data diri. Buka pratinjau untuk memeriksa data, lalu simpan ke berkas persyaratan aplikasi."}
                </Paragraph>

                {!hasSufficientCvData ? (
                  <div style={{ marginTop: 8 }}>
                    <a
                      onClick={() =>
                        router.push(
                          "/student/dashboard/upload-personal-information",
                        )
                      }
                      style={{
                        fontSize: 12.5,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#2563eb",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <FormOutlined /> Lengkapi data di menu Informasi Pribadi
                      <ArrowRightOutlined style={{ fontSize: 11 }} />
                    </a>
                  </div>
                ) : existingCvDoc?.file_url ? (
                  <div style={{ marginTop: 8 }}>
                    <a
                      href={existingCvDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 12.5,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: "#2563eb",
                        fontWeight: 500,
                      }}
                    >
                      <LinkOutlined /> Lihat Berkas
                    </a>
                  </div>
                ) : null}
              </div>
            </Flex>
          </Col>

          {/* Sisi Kanan: Tombol Aksi */}
          <Col xs={24} md={11} lg={10}>
            <Flex
              gap={10}
              wrap="wrap"
              justify="flex-end"
              align="center"
              style={{ width: "100%", height: "100%" }}
            >
              <Button
                icon={<EyeOutlined />}
                onClick={handleOpenPreview}
                style={{
                  height: 32,
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  paddingInline: 12,
                }}
              >
                Lihat
              </Button>

              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={isSubmitting || uploading}
                onClick={handleSubmitToDocuments}
                style={{
                  height: 32,
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  paddingInline: 14,
                  background: hasSufficientCvData
                    ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
                    : undefined,
                  border: "none",
                  boxShadow: hasSufficientCvData
                    ? "0 2px 8px rgba(37, 99, 235, 0.25)"
                    : undefined,
                }}
              >
                Submit
              </Button>
            </Flex>
          </Col>
        </Row>
      </Card>

      {/* MODAL PRATINJAU CV */}
      <Modal
        title={
          <Flex align="center" justify="space-between" style={{ paddingRight: 32 }}>
            <Flex align="center" gap={10}>
              <FileTextOutlined style={{ color: "#2563eb", fontSize: 18 }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>
                Lihat Curriculum Vitae
              </span>
            </Flex>

            {/* Template switcher in modal */}
            <Segmented<CvTemplateId>
              value={selectedTemplate}
              onChange={(val) => setSelectedTemplate(val as CvTemplateId)}
              options={[
                {
                  value: 1,
                  label: <span style={{ fontWeight: 600 }}>Format Klasik</span>,
                },
                {
                  value: 7,
                  label: <span style={{ fontWeight: 600 }}>Format Modern</span>,
                },
              ]}
            />
          </Flex>
        }
        open={isPreviewOpen}
        onCancel={() => setIsPreviewOpen(false)}
        width={920}
        style={{ top: 20 }}
        footer={
          <Flex align="center" justify="space-between" wrap="wrap" gap={10}>
            {/* Zoom Controls */}
            <Space.Compact size="small">
              <Tooltip title="Perkecil">
                <Button
                  icon={<ZoomOutOutlined />}
                  disabled={previewZoom <= 0.55}
                  onClick={() =>
                    setPreviewZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))
                  }
                />
              </Tooltip>
              <Button style={{ pointerEvents: "none", fontSize: 12 }}>
                {Math.round(previewZoom * 100)}%
              </Button>
              <Tooltip title="Perbesar">
                <Button
                  icon={<ZoomInOutlined />}
                  disabled={previewZoom >= 1.25}
                  onClick={() =>
                    setPreviewZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))
                  }
                />
              </Tooltip>
            </Space.Compact>

            {/* Action buttons */}
            <Flex align="center" gap={10}>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => handlePrint("Cetak")}
              >
                Cetak Dokumen
              </Button>

              <Button
                icon={<FilePdfOutlined />}
                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
                onClick={() => handlePrint("PDF")}
              >
                Simpan PDF
              </Button>

              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={isSubmitting || uploading}
                onClick={handleSubmitToDocuments}
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                  fontWeight: 600,
                  border: "none",
                }}
              >
                Submit
              </Button>
            </Flex>
          </Flex>
        }
      >
        <div
          style={{
            backgroundColor: "#475569",
            padding: "24px 12px",
            borderRadius: 12,
            minHeight: "550px",
            maxHeight: "75vh",
            overflowY: "auto",
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              transform: `scale(${previewZoom})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
            }}
          >
            <div
              ref={modalPrintAreaRef}
              style={{
                width: "210mm",
                minHeight: "297mm",
                backgroundColor: "#ffffff",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.3)",
                boxSizing: "border-box",
              }}
            >
              {renderActiveTemplate()}
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL PERINGATAN KELENGKAPAN DATA WAJIB (HUMANIS) */}
      <Modal
        open={isIncompleteModalOpen}
        onCancel={() => setIsIncompleteModalOpen(false)}
        footer={null}
        centered
        width={480}
        styles={{
          body: {
            padding: "32px 28px 28px",
            textAlign: "center",
          },
        }}
      >
        <div
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            background: "#eff6ff",
            color: "#2563eb",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 16,
          }}
        >
          <InfoCircleOutlined />
        </div>

        <Title level={4} style={{ marginBottom: 8, color: "#0f172a" }}>
          Kelengkapan Data Diperlukan
        </Title>

        <Paragraph
          style={{
            color: "#64748b",
            fontSize: 14,
            lineHeight: 1.6,
            marginBottom: 24,
          }}
        >
          Halo {user?.name || "Siswa"}! Sistem mendeteksi data riwayat pendidikan, kontak, dan pengalaman Anda masih kosong.
          <br /><br />
          Curriculum Vitae (CV) dirancang untuk dibuat secara otomatis dari data diri Anda. Harap lengkapi formulir data diri pada menu <strong>Personal Info</strong> terlebih dahulu agar CV dapat dihasilkan dengan lengkap dan profesional.
        </Paragraph>

        <Space direction="vertical" size={10} style={{ width: "100%" }}>
          <Button
            type="primary"
            size="large"
            block
            icon={<FormOutlined />}
            onClick={() => {
              setIsIncompleteModalOpen(false);
              router.push("/student/dashboard/upload-personal-information");
            }}
            style={{
              borderRadius: 10,
              fontWeight: 600,
              height: 44,
              background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
              border: "none",
            }}
          >
            Lengkapi Data di Personal Info
          </Button>

          <Button
            size="large"
            block
            onClick={() => setIsIncompleteModalOpen(false)}
            style={{ borderRadius: 10, height: 44 }}
          >
            Nanti Saja
          </Button>
        </Space>
      </Modal>
    </>
  );
}
