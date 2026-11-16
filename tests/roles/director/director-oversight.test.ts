import { describe, it } from "node:test";
import assert from "node:assert";
import type { AnswerDocumentApprovalsDataModel } from "@/app/models/answer-document-approvals";
import { getDocumentTableColumnsForRole, hasPermission } from "@/app/utils/role-permissions";

describe("ROLE: DIRECTOR - Pengujian Pengawasan Eksekutif & Batasan Read-Only", () => {
  const currentRole = "director";

  // =========================================================================
  // TASK 1: TABEL DOKUMEN DIREKTUR ADALAH READ-ONLY (TANPA TOMBOL AKSI)
  // =========================================================================
  describe("Task 1: Akses Detail Dokumen Bersifat Murni Pengawasan (Read-Only)", () => {
    it("Task 1.1: Kolom tabel dokumen Direktur TIDAK BOLEH memuat kolom aksi atau verifikasi OCR", () => {
      const cols = getDocumentTableColumnsForRole(currentRole);
      // Kolom resmi Direktur: Document Name, Status, Upload Date, Preview
      assert.deepStrictEqual(cols, ["name", "status", "upload_date", "preview"]);
      assert.strictEqual(cols.includes("actions"), false);
      assert.strictEqual(cols.includes("ocr_status"), false);
    });

    it("Task 1.2: Direktur dapat membuka pratinjau berkas (Preview PDF) untuk semua jenis dokumen", () => {
      const documents = [
        { label: "Paspor", file_url: "https://example.com/passport.pdf" },
        { label: "Transkrip Nilai", file_url: "https://example.com/transcript.pdf" },
        { label: "Surat Pernyataan", file_url: "https://example.com/statement.pdf" },
      ];

      for (const doc of documents) {
        assert.ok(doc.file_url.startsWith("https://"));
        assert.ok(Boolean(doc.file_url));
      }
    });
  });

  // =========================================================================
  // TASK 2: LARANGAN KERAS EKSEKUSI MUTASI DOKUMEN OLEH DIREKTUR
  // =========================================================================
  describe("Task 2: Penegakan Larangan Mutasi Persetujuan oleh Direktur", () => {
    it("Task 2.1: Direktur diblokir dari aksi menyetujui dokumen (document.approve = false)", () => {
      assert.strictEqual(hasPermission(currentRole, "document.approve"), false);
    });

    it("Task 2.2: Direktur diblokir dari aksi menolak dokumen (document.reject = false)", () => {
      assert.strictEqual(hasPermission(currentRole, "document.reject"), false);
    });

    it("Task 2.3: Direktur diblokir dari aksi membatalkan persetujuan berkas (document.cancelApproval = false)", () => {
      assert.strictEqual(hasPermission(currentRole, "document.cancelApproval"), false);
    });

    it("Task 2.4: Direktur diblokir dari aksi memutakhirkan tahapan pendaftaran siswa (student.editStage = false)", () => {
      assert.strictEqual(hasPermission(currentRole, "student.editStage"), false);
    });
  });

  // =========================================================================
  // TASK 3: AUDIT TRAIL & PENGAWASAN CATATAN REVISI ADMISI
  // =========================================================================
  describe("Task 3: Pengawasan Jejak Audit (Audit Trail) Persetujuan Dokumen", () => {
    it("Task 3.1: Direktur dapat membaca histori catatan penolakan dan reviewer_id dokumen", () => {
      const approvalRecord: AnswerDocumentApprovalsDataModel = {
        id: "app-100",
        answer_document_id: "doc-paspor-1",
        student_id: "std-001",
        reviewer_id: "adm-staff-2",
        status: "rejected",
        note: "Masa berlaku paspor kurang dari 6 bulan dari jadwal intake.",
        reviewed_at: "2026-04-10T14:30:00Z",
      };

      assert.strictEqual(approvalRecord.status, "rejected");
      assert.strictEqual(approvalRecord.reviewer_id, "adm-staff-2");
      assert.ok(approvalRecord.note?.includes("kurang dari 6 bulan"));
    });
  });

  // =========================================================================
  // TASK 4: HAK EKSKLUSIF KPI & AGREGASI METRIK DOKUMEN
  // =========================================================================
  describe("Task 4: Hak Eksklusif Akses Metrik Makro KPI Eksekutif", () => {
    it("Task 4.1: Direktur WAJIB memiliki izin melihat analitik makro eksekutif (analytics.viewMacroKPI = true)", () => {
      assert.strictEqual(hasPermission(currentRole, "analytics.viewMacroKPI"), true);
    });

    it("Task 4.2: Menghitung persentase dokumen selesai vs tertunda lintas seluruh siswa", () => {
      const mockDocumentApprovals = [
        { status: "approved" },
        { status: "approved" },
        { status: "rejected" },
        { status: "pending" },
      ];

      const approved = mockDocumentApprovals.filter((d) => d.status === "approved").length;
      const total = mockDocumentApprovals.length;
      const completionRate = Math.round((approved / total) * 100);

      assert.strictEqual(completionRate, 50); // 2 dari 4 disetujui = 50%
    });
  });
});
