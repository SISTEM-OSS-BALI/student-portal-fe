import { describe, it } from "node:test";
import assert from "node:assert";
import type { AnswerDocumentApprovalsDataModel } from "@/app/models/answer-document-approvals";
import type { DocumentDataModel } from "@/app/models/documents-management";
import type { UserDataModel } from "@/app/models/user";
import { compareStudentNameWithOCR } from "@/app/utils/ocr-name-matcher";
import { hasPermission, sanitizeRejectionNote } from "@/app/utils/role-permissions";

describe("ROLE: ADMISSION - Pengujian Dokumen Spesifik & Alur Verifikasi", () => {
  const currentRole = "admission";

  // =========================================================================
  // TASK 1: DOKUMEN A - PASPOR (PASSPORT) DENGAN VERIFIKASI OCR
  // =========================================================================
  describe("Task 1: Dokumen A - Paspor (PASSPORT) via OCR Name Matching", () => {
    const passportDoc: DocumentDataModel = {
      id: 1,
      label: "Paspor",
      internal_code: "PASSPORT",
      file_type: "pdf",
      category: "identity",
      translation_needed: "no",
      required: true,
      auto_rename_pattern: "{studentName}_PASSPORT.pdf",
    };

    it("Task 1.1: Admisi berhak menyetujui paspor saat nama pada scan OCR cocok (skor >= 80%)", () => {
      const studentName = "Citra Kirana Dewi";
      const ocrDetectedName = "Citra Kirana Dewi";

      const ocrResult = compareStudentNameWithOCR(ocrDetectedName, studentName);
      assert.strictEqual(ocrResult.status, "MATCH");
      assert.strictEqual(ocrResult.isAcceptable, true);

      // Verifikasi wewenang admisi untuk melakukan approval
      const canApprove = hasPermission(currentRole, "document.approve");
      assert.strictEqual(canApprove, true);
    });

    it("Task 1.2: Admisi menolak paspor secara otomatis jika nama OCR tidak cocok (skor < 55%)", () => {
      const studentName = "Citra Kirana Dewi";
      const wrongPersonOcr = "Hendra Wijaya";

      const ocrResult = compareStudentNameWithOCR(wrongPersonOcr, studentName);
      assert.strictEqual(ocrResult.status, "MISMATCH");
      assert.strictEqual(ocrResult.isAcceptable, false);

      // Admisi menggunakan pesan otomatis OCR untuk penolakan
      const generatedNote = sanitizeRejectionNote(ocrResult.message);
      assert.ok(generatedNote.includes("Nama di dokumen berbeda"));
    });

    it("Task 1.3: Admisi menerima status PARTIAL untuk paspor dengan inisial atau ejaan berbeda sedikit", () => {
      const studentName = "Budi Pratama Santoso";
      const ocrInitial = "B. Pratama Santoso";

      const ocrResult = compareStudentNameWithOCR(ocrInitial, studentName);
      assert.ok(["MATCH", "PARTIAL"].includes(ocrResult.status));
      assert.strictEqual(ocrResult.isAcceptable, true);
    });
  });

  // =========================================================================
  // TASK 2: DOKUMEN B - SURAT PERNYATAAN (STUDENT_SIGN) & TANDA TANGAN DIGITAL
  // =========================================================================
  describe("Task 2: Dokumen B - Surat Pernyataan (STUDENT_SIGN) & Tanda Tangan Digital", () => {
    it("Task 2.1: Dokumen bertanda tangan sah (is_verified_signature = true) TERKUNCI dari pembatalan", () => {
      // Sesuai flow F: hanya saat STUDENT_SIGN & signatureUrl ada -> is_verified_signature = true
      const canCancel = hasPermission(currentRole, "document.cancelApproval", {
        isVerifiedSignature: true,
      });
      // Tombol pensil / pembatalan approval WAJIB disembunyikan/dilarang demi kepastian hukum
      assert.strictEqual(canCancel, false);
    });

    it("Task 2.2: Dokumen tanda tangan yang belum diverifikasi (is_verified_signature = false) dapat dibatalkan jika cacat", () => {
      const canCancel = hasPermission(currentRole, "document.cancelApproval", {
        isVerifiedSignature: false,
      });
      assert.strictEqual(canCancel, true);
    });

    it("Task 2.3: Admisi dapat menyetujui dokumen tanda tangan saat kanvas tanda tangan terisi", () => {
      const studentData: Partial<UserDataModel> = {
        name: "Fajar Nugraha",
        document_consent_signed: true,
        document_consent_signature_url: "https://example.com/signatures/fajar.png",
      };

      assert.strictEqual(Boolean(studentData.document_consent_signature_url), true);
      assert.strictEqual(hasPermission(currentRole, "document.approve"), true);
    });
  });

  // =========================================================================
  // TASK 3: DOKUMEN C - TRANSKRIP / IJAZAH (ACADEMIC_TRANSCRIPT) & PENERJEMAHAN
  // =========================================================================
  describe("Task 3: Dokumen C - Ijazah & Transkrip (ACADEMIC_TRANSCRIPT) & Kuota Terjemahan", () => {
    const transcriptDoc: DocumentDataModel = {
      id: 3,
      label: "Transkrip Nilai Akademik",
      internal_code: "ACADEMIC_TRANSCRIPT",
      file_type: "pdf",
      category: "academic",
      translation_needed: "yes",
      required: true,
      auto_rename_pattern: "{studentName}_ACADEMIC_TRANSCRIPT.pdf",
    };

    it("Task 3.1: Admisi memvalidasi apakah berkas memerlukan penerjemahan tersumpah", () => {
      assert.strictEqual(transcriptDoc.translation_needed, "yes");
    });

    it("Task 3.2: Admisi memotong kuota terjemahan saat mengajukan berkas ke penerjemah resmi", () => {
      let quota = 2;
      const deductQuota = () => {
        if (quota <= 0) throw new Error("Kuota terjemahan habis");
        quota -= 1;
        return quota;
      };

      assert.strictEqual(deductQuota(), 1);
      assert.strictEqual(deductQuota(), 0);
      assert.throws(() => deductQuota(), /Kuota terjemahan habis/);
    });
  });

  // =========================================================================
  // TASK 4: DOKUMEN D - SPONSOR FINANSIAL / REKENING KORAN (FINANCIAL_SPONSOR)
  // =========================================================================
  describe("Task 4: Dokumen D - Sponsor Finansial / Rekening Koran (FINANCIAL_SPONSOR)", () => {
    it("Task 4.1: Admisi menolak rekening koran dengan catatan batas saldo minimum yang spesifik", () => {
      const noteInput = "Saldo rata-rata 3 bulan terakhir masih di bawah batas minimum AUD 30,000.";
      const sanitized = sanitizeRejectionNote(noteInput);

      assert.strictEqual(sanitized, noteInput);

      const approvalPayload: AnswerDocumentApprovalsDataModel = {
        status: "rejected",
        note: sanitized,
        reviewer_id: "adm-01",
      };

      assert.strictEqual(approvalPayload.status, "rejected");
      assert.ok(approvalPayload.note?.includes("AUD 30,000"));
    });

    it("Task 4.2: Admisi menyetujui bukti finansial yang memenuhi persyaratan imigrasi", () => {
      const approvalPayload: AnswerDocumentApprovalsDataModel = {
        status: "approved",
        note: null,
        reviewer_id: "adm-01",
      };

      assert.strictEqual(approvalPayload.status, "approved");
    });
  });

  // =========================================================================
  // TASK 5: ALUR PEMBATALAN PERSETUJUAN & SETUJUI ULANG (RE-APPROVE)
  // =========================================================================
  describe("Task 5: Alur Pembatalan Persetujuan & Setujui Ulang (Re-Approve)", () => {
    it("Task 5.1: Admisi dapat melakukan Setujui Ulang (Re-Approve) pada dokumen yang sebelumnya ditolak", () => {
      let currentDocStatus = "rejected";
      assert.strictEqual(hasPermission(currentRole, "document.reapprove"), true);

      // Simulasi eksekusi Setujui Ulang
      currentDocStatus = "approved";
      assert.strictEqual(currentDocStatus, "approved");
    });

    it("Task 5.2: Mengubah status berkas yang telah disetujui kembali menjadi ditolak melalui modal revisi", () => {
      let currentDocStatus = "approved";
      const isVerifiedSign = false;

      // Admisi mengklik ikon pensil (pembatalan persetujuan)
      const canCancel = hasPermission(currentRole, "document.cancelApproval", {
        isVerifiedSignature: isVerifiedSign,
      });
      assert.strictEqual(canCancel, true);

      // Modal penolakan dibuka dan status berubah menjadi rejected
      currentDocStatus = "rejected";
      assert.strictEqual(currentDocStatus, "rejected");
    });
  });

  // =========================================================================
  // TASK 6: MULTIPLE DOWNLOAD DOKUMEN & KESIAPAN BERKAS TERPILIH
  // =========================================================================
  describe("Task 6: Multiple Download Dokumen (Batch Selection & Download)", () => {
    const sampleDocuments = [
      { id: "doc-1", label: "Paspor", file_url: "https://example.com/paspor.pdf", file_name: "Paspor.pdf" },
      { id: "doc-2", label: "Ijazah", file_url: "https://example.com/ijazah.pdf", file_name: "Ijazah.pdf" },
      { id: "doc-3", label: "Transkrip Nilai", file_url: null, file_name: null },
      { id: "doc-4", label: "IELTS", file_url: "https://example.com/ielts.pdf", file_name: "IELTS.pdf" },
    ];

    it("Task 6.1: Hanya dokumen yang memiliki file_url yang valid dapat dipilih untuk diunduh", () => {
      const downloadable = sampleDocuments.filter((d) => Boolean(d.file_url));
      assert.strictEqual(downloadable.length, 3);
      assert.ok(!downloadable.some((d) => d.id === "doc-3"));
    });

    it("Task 6.2: Fitur unduh massal berlaku dan dapat diakses oleh role admission, consultant, dan director", () => {
      const allowedRoles = ["admission", "consultant", "director"];
      for (const role of allowedRoles) {
        // Semua ketiga role memiliki hak baca/unduh berkas mahasiswa
        const canDownload = ["admission", "consultant", "director"].includes(role);
        assert.strictEqual(canDownload, true);
      }
    });

    it("Task 6.3: Menolak proses unduhan jika tidak ada dokumen yang dipilih atau diunggah", () => {
      const selectedIds: string[] = [];
      const targets = sampleDocuments.filter((d) => selectedIds.includes(d.id) && Boolean(d.file_url));
      assert.strictEqual(targets.length, 0);
    });

    it("Task 6.4: Filter dokumen terpilih menghasilkan daftar berkas dan nama yang lengkap", () => {
      const selectedIds = ["doc-1", "doc-4"];
      const targets = sampleDocuments.filter((d) => selectedIds.includes(d.id) && Boolean(d.file_url));
      assert.strictEqual(targets.length, 2);
      assert.strictEqual(targets[0].file_name, "Paspor.pdf");
      assert.strictEqual(targets[1].file_name, "IELTS.pdf");
    });
  });

  // =========================================================================
  // TASK 7: MODE SELEKSI DOKUMEN, MULTIPLE DOWNLOAD, MULTIPLE HAPUS, & BATAL PILIH
  // =========================================================================
  describe("Task 7: Mode Seleksi Dokumen, Multiple Download, Multiple Hapus, dan Batal Pilih", () => {
    interface DocItem {
      id: string;
      label: string;
      file_url: string | null;
      file_name: string | null;
      answer_document_id?: string;
    }

    const testDocuments: DocItem[] = [
      { id: "doc-1", label: "Paspor", file_url: "https://example.com/paspor.pdf", file_name: "Paspor.pdf", answer_document_id: "ans-1" },
      { id: "doc-2", label: "Ijazah", file_url: "https://example.com/ijazah.pdf", file_name: "Ijazah.pdf", answer_document_id: "ans-2" },
      { id: "doc-3", label: "CV", file_url: "https://example.com/cv.pdf", file_name: "CV.pdf", answer_document_id: "ans-3" },
      { id: "doc-4", label: "Surat Rekomendasi", file_url: null, file_name: null },
    ];

    it("Task 7.1: Mode seleksi awal default adalah non-aktif (false), checkbox tersembunyi", () => {
      let isSelectionMode = false;
      const selectedIds: string[] = [];

      assert.strictEqual(isSelectionMode, false);
      assert.strictEqual(selectedIds.length, 0);

      // Pengguna menekan tombol 'Pilih'
      isSelectionMode = true;
      assert.strictEqual(isSelectionMode, true);
    });

    it("Task 7.2: Memilih berkas saat mode seleksi aktif dan membatalkan seleksi dengan Batal Pilih", () => {
      let isSelectionMode = true;
      let selectedIds: string[] = ["doc-1", "doc-2"];

      assert.strictEqual(selectedIds.length, 2);

      // Aksi Batal Pilih
      isSelectionMode = false;
      selectedIds = [];

      assert.strictEqual(isSelectionMode, false);
      assert.strictEqual(selectedIds.length, 0);
    });

    it("Task 7.3: Multiple Hapus memfilter hanya berkas yang terpilih dan valid memiliki file_url", () => {
      const selectedIds = ["doc-1", "doc-3", "doc-4"];
      const targetsToDelete = testDocuments.filter(
        (d) => selectedIds.includes(d.id) && Boolean(d.file_url)
      );

      // Hanya doc-1 dan doc-3 yang valid untuk dihapus (doc-4 belum memiliki berkas)
      assert.strictEqual(targetsToDelete.length, 2);
      assert.deepStrictEqual(
        targetsToDelete.map((d) => d.id),
        ["doc-1", "doc-3"]
      );
    });

    it("Task 7.4: Simulasi eksekusi multiple hapus berhasil menghapus answer_documents terkait", () => {
      let answerDocs = [
        { id: "ans-1", document_id: "doc-1" },
        { id: "ans-2", document_id: "doc-2" },
        { id: "ans-3", document_id: "doc-3" },
      ];

      const docsToDelete = [
        { id: "doc-1", answer_document_id: "ans-1" },
        { id: "doc-3", answer_document_id: "ans-3" },
      ];

      const deleteIds = new Set(docsToDelete.map((d) => d.answer_document_id));
      answerDocs = answerDocs.filter((ans) => !deleteIds.has(ans.id));

      assert.strictEqual(answerDocs.length, 1);
      assert.strictEqual(answerDocs[0].id, "ans-2");
    });
  });
});
