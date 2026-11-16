"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Flex,
  Modal,
  Segmented,
  Space,
  Tag,
  Tooltip,
  Typography,
  message,
} from "antd";
import {
  DownloadOutlined,
  ExportOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FullscreenOutlined,
  PrinterOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
} from "@ant-design/icons";
import type { CvData, CvTemplateId } from "./types";
import Template1 from "./Template1";
import Template7 from "./Template7";
import TemplateFormalOffice from "./TemplateFormalOffice";

type CvPreviewProps = {
  cv: CvData;
  onChangeTemplate: (templateId: CvTemplateId) => void;
};

export default function CvPreview({ cv, onChangeTemplate }: CvPreviewProps) {
  const [zoom, setZoom] = useState<number>(0.85);
  const [modalZoom, setModalZoom] = useState<number>(0.9);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const printAreaRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [docHeight, setDocHeight] = useState<number>(2246);

  const calculateFitZoom = () => {
    if (typeof window !== "undefined") {
      const containerW =
        containerRef.current?.clientWidth || window.innerWidth - 32;
      // 794px merupakan lebar dokumen A4 standar dalam px (210mm pada 96dpi)
      const targetW = Math.max(280, containerW - 32);
      const computedZoom = Number(
        Math.max(0.35, Math.min(1.0, targetW / 794)).toFixed(2),
      );
      return computedZoom;
    }
    return 0.85;
  };

  const handleFitToScreen = () => {
    setZoom(calculateFitZoom());
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setZoom(calculateFitZoom());
    }
  }, []);

  useEffect(() => {
    if (!printAreaRef.current) return;
    const updateHeight = () => {
      if (printAreaRef.current) {
        setDocHeight(printAreaRef.current.offsetHeight || 2246);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(() => {
      updateHeight();
    });
    observer.observe(printAreaRef.current);
    return () => observer.disconnect();
  }, [cv, cv.template_id]);

  const getCleanPrintHtml = () => {
    if (!printAreaRef.current) return "";
    return printAreaRef.current.innerHTML;
  };

  const getDocumentTitle = () => {
    const studentName = `${cv.first_name || "Student"}_${cv.last_name || ""}`.trim().replace(/\s+/g, "_");
    return `CV_${studentName}_A4`;
  };

  // Eksekusi print terisolasi menggunakan invisible iframe (bebas dari sidebar, form builder, dan 7 halaman kosong)
  const executeIsolatedPrint = (titlePrefix: string) => {
    const rawHtml = getCleanPrintHtml();
    if (!rawHtml) return;

    const docTitle = `${titlePrefix}_${getDocumentTitle()}`;

    // Buat iframe tersembunyi
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
              margin: 12mm 15mm 12mm 15mm;
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
              font-size: 10.5px;
              line-height: 1.35;
            }
            .no-print {
              display: none !important;
            }
            .page-break-before {
              page-break-before: always !important;
              break-before: page !important;
            }
            .formal-cv-page {
              width: 100% !important;
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              box-sizing: border-box !important;
              page-break-after: always !important;
              break-after: page !important;
            }
            .formal-cv-page:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-bottom: 14px !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            th, td {
              border: 1px solid #1e293b !important;
            }
            h1 {
              margin: 0 0 16px 0 !important;
              font-size: 18px !important;
              text-align: center !important;
              font-weight: bold !important;
              letter-spacing: 1px !important;
            }
            .page-footer {
              display: flex !important;
              justify-content: space-between !important;
              padding-top: 8px !important;
              border-top: 1px solid #cbd5e1 !important;
              font-size: 9px !important;
              color: #64748b !important;
              margin-top: 12px !important;
            }
          </style>
        </head>
        <body>
          ${rawHtml}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  };

  // AKSI 1: Simpan sebagai PDF (Khusus file PDF)
  const handleSavePdf = () => {
    message.info("Pada kotak dialog, pilih 'Save as PDF' / 'Simpan sebagai PDF' untuk mengunduh file.");
    executeIsolatedPrint("PDF");
  };

  // AKSI 2: Cetak Fisik ke Printer
  const handlePrintToPrinter = () => {
    message.info("Membuka printer dialog untuk mencetak dokumen...");
    executeIsolatedPrint("Print");
  };

  // AKSI 3: Buka tampilan PDF di tab browser baru
  const handleOpenInNewTab = () => {
    const rawHtml = getCleanPrintHtml();
    if (!rawHtml) return;

    const docTitle = getDocumentTitle();
    const newTab = window.open("", "_blank");
    if (!newTab) return;

    newTab.document.open();
    newTab.document.write(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>${docTitle} (PDF View)</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 12mm 15mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              margin: 0;
              padding: 24px;
              background: #334155;
              color: #000000;
              font-family: Arial, Helvetica, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              min-height: 100vh;
            }
            .cv-container {
              width: 210mm;
              background: #ffffff;
              box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
              margin-bottom: 24px;
            }
            .no-print-bar {
              position: sticky;
              top: 0;
              background: #0f172a;
              color: #ffffff;
              width: 100%;
              padding: 12px 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              z-index: 999;
              box-shadow: 0 4px 12px rgba(0,0,0,0.25);
              margin-bottom: 24px;
            }
            .btn-action {
              background: #dc2626;
              color: white;
              border: none;
              padding: 8px 18px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
              margin-left: 10px;
            }
            .btn-action:hover {
              background: #b91c1c;
            }
            .btn-print {
              background: #2563eb;
              color: white;
              border: none;
              padding: 8px 18px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 600;
              cursor: pointer;
            }
            .btn-print:hover {
              background: #1d4ed8;
            }
            .page-break-before {
              page-break-before: always !important;
              break-before: page !important;
            }
            .formal-cv-page {
              width: 100% !important;
              min-height: auto !important;
              box-sizing: border-box !important;
            }
            table {
              width: 100% !important;
              border-collapse: collapse !important;
              margin-bottom: 14px !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            th, td {
              border: 1px solid #1e293b !important;
            }
            @media print {
              .no-print, .no-print-bar {
                display: none !important;
              }
              body {
                background: #ffffff !important;
                padding: 0 !important;
              }
              .cv-container {
                box-shadow: none !important;
                width: 100% !important;
                margin: 0 !important;
              }
              .formal-cv-page {
                page-break-after: always !important;
                break-after: page !important;
              }
              .formal-cv-page:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print-bar">
            <span style="font-size: 15px; font-weight: 600;">${docTitle}</span>
            <div>
              <button class="btn-print" onclick="window.print()">Cetak Dokumen</button>
              <button class="btn-action" onclick="window.print()">Simpan PDF</button>
            </div>
          </div>
          <div class="cv-container">
            ${rawHtml}
          </div>
        </body>
      </html>
    `);
    newTab.document.close();
  };

  return (
    <>
      <Card
        style={{
          borderRadius: 20,
          borderColor: "#e2e8f0",
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)",
          background: "#ffffff",
          overflow: "hidden",
        }}
        styles={{
          body: {
            padding: 0,
            display: "flex",
            flexDirection: "column",
            height: "100%",
          },
        }}
      >
        {/* PREVIEW TOOLBAR */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {/* Baris 1: Pilihan Format */}
          <Flex align="center" justify="space-between" wrap="wrap" gap={8} style={{ width: "100%" }}>
            <Typography.Text strong style={{ fontSize: 13, color: "#475569" }}>
              Format Dokumen
            </Typography.Text>
            <Segmented<CvTemplateId>
              value={cv.template_id}
              onChange={(val) => onChangeTemplate(val as CvTemplateId)}
              options={[
                {
                  value: "formal",
                  label: (
                    <span style={{ paddingInline: 6, fontWeight: 600, fontSize: 12 }}>
                      Format Resmi
                    </span>
                  ),
                },
                {
                  value: 1,
                  label: (
                    <span style={{ paddingInline: 6, fontWeight: 600, fontSize: 12 }}>
                      Format Klasik
                    </span>
                  ),
                },
                {
                  value: 7,
                  label: (
                    <span style={{ paddingInline: 6, fontWeight: 600, fontSize: 12 }}>
                      Format Modern
                    </span>
                  ),
                },
              ]}
            />
          </Flex>

          {/* Baris 2: Kontrol Zoom & Aksi Dokumen */}
          <Flex align="center" justify="space-between" wrap="wrap" gap={10} style={{ width: "100%" }}>
            {/* ZOOM CONTROLS */}
            <Space.Compact size="middle">
              <Tooltip title="Perkecil Tampilan">
                <Button
                  icon={<ZoomOutOutlined />}
                  disabled={zoom <= 0.35}
                  onClick={() =>
                    setZoom((z) => Math.max(0.35, Number((z - 0.05).toFixed(2))))
                  }
                />
              </Tooltip>
              <Button style={{ minWidth: 52, fontWeight: 600, fontSize: 12 }}>
                {Math.round(zoom * 100)}%
              </Button>
              <Tooltip title="Perbesar Tampilan">
                <Button
                  icon={<ZoomInOutlined />}
                  disabled={zoom >= 1.3}
                  onClick={() =>
                    setZoom((z) => Math.min(1.3, Number((z + 0.05).toFixed(2))))
                  }
                />
              </Tooltip>
              <Tooltip title="Sesuaikan Ukuran Layar">
                <Button
                  icon={<FullscreenOutlined />}
                  onClick={handleFitToScreen}
                />
              </Tooltip>
            </Space.Compact>

            {/* ACTION BUTTONS */}
            <Flex align="center" gap={8} wrap="wrap">
              <Tooltip title="Lihat pratinjau lembar A4 sebelum dicetak atau disimpan">
                <Button
                  icon={<EyeOutlined />}
                  size="middle"
                  onClick={() => setIsPdfModalOpen(true)}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    padding: "0 10px",
                  }}
                >
                  Lihat PDF
                </Button>
              </Tooltip>

              <Tooltip title="Cetak langsung ke mesin printer fisik">
                <Button
                  type="default"
                  icon={<PrinterOutlined />}
                  size="middle"
                  onClick={handlePrintToPrinter}
                  style={{
                    borderRadius: 8,
                    fontWeight: 600,
                    color: "#1e293b",
                    fontSize: 12,
                    padding: "0 10px",
                  }}
                >
                  Cetak Dokumen
                </Button>
              </Tooltip>

              <Tooltip title="Simpan langsung dokumen sebagai file PDF resmi">
                <Button
                  type="primary"
                  icon={<FilePdfOutlined />}
                  size="middle"
                  onClick={handleSavePdf}
                  style={{
                    backgroundColor: "#1b3d6d",
                    borderColor: "#1b3d6d",
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 12,
                    padding: "0 12px",
                  }}
                >
                  Simpan PDF
                </Button>
              </Tooltip>
            </Flex>
          </Flex>
        </div>

        {/* A4 CANVAS CONTAINER */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            minHeight: "560px",
            maxHeight: "820px",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            backgroundColor: "#e2e8f0",
            padding: "24px 12px",
          }}
        >
          <div
            style={{
              width: `${Math.round(794 * zoom)}px`,
              height: `${Math.round(docHeight * zoom)}px`,
              minHeight: `${Math.round(1123 * zoom)}px`,
              margin: "0 auto",
              position: "relative",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.18)",
              borderRadius: "2px",
              backgroundColor: "#ffffff",
              flexShrink: 0,
            }}
          >
            <div
              ref={printAreaRef}
              id="cv-printable-area"
              style={{
                width: "210mm",
                minHeight: "297mm",
                backgroundColor: "#ffffff",
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                transition: "transform 0.15s ease",
                boxSizing: "border-box",
                overflow: "hidden",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              {cv.template_id === "formal" ? (
                <TemplateFormalOffice cv={cv} />
              ) : cv.template_id === 1 ? (
                <Template1 cv={cv} />
              ) : (
                <Template7 cv={cv} />
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ================= MODAL PRATINJAU DOKUMEN PDF LENGKAP ================= */}
      <Modal
        open={isPdfModalOpen}
        onCancel={() => setIsPdfModalOpen(false)}
        width={1060}
        centered
        styles={{
          body: {
            padding: 0,
            maxHeight: "82vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
        footer={null}
        title={
          <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ paddingRight: 28 }}>
            <Flex align="center" gap={10}>
              <FilePdfOutlined style={{ fontSize: 22, color: "#dc2626" }} />
              <div>
                <Typography.Text strong style={{ fontSize: 16 }}>
                  Lihat Dokumen CV (PDF A4 Standar)
                </Typography.Text>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  {cv.first_name} {cv.last_name} • 2 Halaman Rapi
                </div>
              </div>
            </Flex>

            <Flex align="center" gap={8} wrap="wrap">
              <Tag color="blue" bordered={false} style={{ fontWeight: 600 }}>
                A4 (210 x 297 mm)
              </Tag>
              <Tag color="green" bordered={false} style={{ fontWeight: 600 }}>
                2 Halaman Pas
              </Tag>

              {/* MODAL ZOOM */}
              <Space.Compact size="small">
                <Button
                  icon={<ZoomOutOutlined />}
                  disabled={modalZoom <= 0.6}
                  onClick={() => setModalZoom((z) => Math.max(0.5, Number((z - 0.1).toFixed(2))))}
                />
                <Button style={{ minWidth: 50, fontWeight: 600 }}>
                  {Math.round(modalZoom * 100)}%
                </Button>
                <Button
                  icon={<ZoomInOutlined />}
                  disabled={modalZoom >= 1.2}
                  onClick={() => setModalZoom((z) => Math.min(1.3, Number((z + 0.1).toFixed(2))))}
                />
              </Space.Compact>

              <Button
                icon={<ExportOutlined />}
                onClick={handleOpenInNewTab}
                style={{ borderRadius: 6, fontWeight: 600 }}
              >
                Buka Tab Baru
              </Button>

              {/* TOMBOL SIMPAN PDF DI MODAL */}
              <Button
                type="primary"
                icon={<FilePdfOutlined />}
                onClick={handleSavePdf}
                style={{
                  backgroundColor: "#dc2626",
                  borderColor: "#dc2626",
                  borderRadius: 6,
                  fontWeight: 600,
                }}
              >
                Simpan PDF
              </Button>

              {/* TOMBOL CETAK DOKUMEN DI MODAL */}
              <Button
                type="default"
                icon={<PrinterOutlined />}
                onClick={handlePrintToPrinter}
                style={{
                  borderRadius: 6,
                  fontWeight: 600,
                  backgroundColor: "#ffffff",
                  borderColor: "#cbd5e1",
                }}
              >
                Cetak Dokumen
              </Button>
            </Flex>
          </Flex>
        }
      >
        <div
          style={{
            flex: 1,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            backgroundColor: "#334155",
            padding: "24px 12px",
          }}
        >
          <div
            style={{
              width: `${Math.round(794 * modalZoom)}px`,
              height: `${Math.round(docHeight * modalZoom)}px`,
              minHeight: `${Math.round(1123 * modalZoom)}px`,
              margin: "0 auto",
              position: "relative",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              borderRadius: 2,
              backgroundColor: "#ffffff",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "210mm",
                minHeight: "297mm",
                backgroundColor: "#ffffff",
                transform: `scale(${modalZoom})`,
                transformOrigin: "top left",
                transition: "transform 0.15s ease",
                boxSizing: "border-box",
                overflow: "hidden",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            >
              {cv.template_id === "formal" ? (
                <TemplateFormalOffice cv={cv} />
              ) : cv.template_id === 1 ? (
                <Template1 cv={cv} />
              ) : (
                <Template7 cv={cv} />
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
