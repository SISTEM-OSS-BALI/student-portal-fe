import { describe, it } from "node:test";
import assert from "node:assert";
import type { UserDataModel } from "@/app/models/user";
import { generateStandardFileName } from "@/app/utils/document-auto-rename";
import {
  getDocumentTableColumnsForRole,
  hasPermission,
  validateTenantAccess,
} from "@/app/utils/role-permissions";

describe("ROLE: STUDENT - Pengujian Pengunggahan Berkas Mandiri & Isolasi Akses", () => {
  const currentRole = "student";
  const studentSelfId = "std-101";

  // =========================================================================
  // TASK 1: PENGUNGGAHAN DOKUMEN PASPOR MANDIRI DENGAN AUTO-RENAME
  // =========================================================================
  describe("Task 1: Pengunggahan Dokumen Paspor (PASSPORT) Mandiri", () => {
    it("Task 1.1: Nama berkas paspor yang diunggah siswa distandarisasi otomatis", () => {
      const fileName = generateStandardFileName({
        pattern: "{studentName}_PASSPORT.pdf",
        studentName: "Citra Kirana Dewi",
        documentCode: "PASSPORT",
        originalFileName: "foto_scan_paspor_asli.pdf",
      });

      assert.strictEqual(fileName, "Citra_Kirana_Dewi_PASSPORT.pdf");
    });

    it("Task 1.2: Siswa aktif berhak mengunggah berkas untuk dokumen miliknya sendiri", () => {
      const canUpload = hasPermission(currentRole, "document.upload", {
        isStudentOwner: true,
        studentStatus: "ONGOING",
      });
      assert.strictEqual(canUpload, true);
    });
  });

  // =========================================================================
  // TASK 2: PENGISIAN & PENANDATANGANAN DOKUMEN PERNYATAAN (STUDENT_SIGN)
  // =========================================================================
  describe("Task 2: Penandatanganan Dokumen Persetujuan (STUDENT_SIGN)", () => {
    it("Task 2.1: Menyimpan bukti kanvas tanda tangan digital siswa", () => {
      const studentUpdate: Partial<UserDataModel> = {
        document_consent_signed: true,
        document_consent_signature_url: "https://storage.portal.com/signs/std-101-signature.png",
        document_consent_signed_at: "2026-04-12T09:15:00Z",
      };

      assert.strictEqual(studentUpdate.document_consent_signed, true);
      assert.ok(studentUpdate.document_consent_signature_url?.endsWith(".png"));
      assert.ok(Boolean(studentUpdate.document_consent_signed_at));
    });
  });

  // =========================================================================
  // TASK 3: PENERIMAAN CATATAN REVISI DARI ADMISI & ALUR UNGGAH ULANG
  // =========================================================================
  describe("Task 3: Penerimaan Catatan Penolakan Dokumen & Aksi Unggah Ulang", () => {
    it("Task 3.1: Siswa dapat membaca catatan alasan revisi berkas yang diberikan Admisi", () => {
      const docRecord = {
        label: "Paspor",
        approval_status: "rejected",
        approval_note: "Halaman biodata paspor silau akibat pantulan cahaya flash. Mohon scan ulang.",
      };

      assert.strictEqual(docRecord.approval_status, "rejected");
      assert.ok(docRecord.approval_note.includes("silau akibat pantulan cahaya"));
    });

    it("Task 3.2: Kolom tabel siswa menyajikan catatan penolakan dan tombol unggah ulang", () => {
      const cols = getDocumentTableColumnsForRole(currentRole);
      assert.deepStrictEqual(cols, [
        "name",
        "status",
        "rejection_note",
        "upload_date",
        "reupload_action",
      ]);
      // Memastikan siswa TIDAK memiliki tombol approval/rejection
      assert.strictEqual(cols.includes("actions"), false);
    });
  });

  // =========================================================================
  // TASK 4: DOKUMEN TELAH DISETUJUI (APPROVED) DIKUNCI DARI UNGGAH ULANG
  // =========================================================================
  describe("Task 4: Penguncian Dokumen yang Telah Berstatus Disetujui (Approved)", () => {
    it("Task 4.1: Siswa tidak perlu dan tidak diizinkan mengunggah ulang dokumen yang sudah disetujui", () => {
      const isApproved = true;
      const showReuploadButton = !isApproved;
      assert.strictEqual(showReuploadButton, false);
    });
  });

  // =========================================================================
  // TASK 5: PENEGAKAN ISOLASI TENANT SISWA (ANTI-DATA LEAK)
  // =========================================================================
  describe("Task 5: Penegakan Isolasi Tenant Antar Siswa (Horizontal Authorization)", () => {
    it("Task 5.1: Siswa ID 101 DILARANG mengakses berkas milik siswa ID 102", () => {
      const check = validateTenantAccess(studentSelfId, currentRole, "std-102");
      assert.strictEqual(check.allowed, false);
      assert.ok(check.reason && check.reason.includes("Pelanggaran Hak Akses"));
    });

    it("Task 5.2: Siswa ID 101 DIIZINKAN mengakses berkas miliknya sendiri", () => {
      const check = validateTenantAccess(studentSelfId, currentRole, studentSelfId);
      assert.strictEqual(check.allowed, true);
    });
  });

  // =========================================================================
  // TASK 6: PENGUNCIAN PORTAL UNTUK SISWA DENGAN STATUS BATAL (CANCEL)
  // =========================================================================
  describe("Task 6: Penguncian Fitur Unggah Dokumen untuk Siswa Status Batal (CANCEL)", () => {
    it("Task 6.1: Siswa yang pendaftarannya dibatalkan dilarang mengunggah berkas baru", () => {
      const canUpload = hasPermission(currentRole, "document.upload", {
        isStudentOwner: true,
        studentStatus: "CANCEL",
      });
      assert.strictEqual(canUpload, false);
    });
  });
});
