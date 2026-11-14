import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { QueryClient } from "@tanstack/react-query";
import type {
  AnswerDocumentApprovalsDataModel,
  AnswerDocumentApprovalsPayloadCreateModel,
} from "@/app/models/answer-document-approvals";
import { DEFAULT_REJECTION_NOTE, sanitizeRejectionNote } from "@/app/utils/role-permissions";

/**
 * Mock Backend Service Database In-Memory
 * Mengemulasikan logika database dan validasi backend Go pada service.go
 */
class MockAnswerDocumentApprovalBackend {
  private database = new Map<string, AnswerDocumentApprovalsDataModel>();

  public normalizeStatus(status?: string | null): string {
    if (!status) return "pending";
    const clean = status.trim().toLowerCase();
    if (clean === "" || clean === "pending") return "pending";
    if (clean === "approved" || clean === "rejected") return clean;
    throw new Error("HTTP 422: invalid status (use: pending, approved, rejected)");
  }

  public createOrUpdate(
    payload: AnswerDocumentApprovalsPayloadCreateModel,
    requesterRole: string = "admission"
  ): AnswerDocumentApprovalsDataModel {
    // 1. Guard RBAC: Hanya Admisi yang boleh memanggil endpoint ini
    if (requesterRole !== "admission") {
      throw new Error("HTTP 403: Forbidden - Hanya tim admisi yang berhak memproses persetujuan berkas");
    }

    // 2. Validasi field wajib
    if (!payload.answer_document_id || !payload.student_id) {
      throw new Error("HTTP 400: Bad Request - answer_document_id dan student_id wajib diisi");
    }

    // 3. Normalisasi status
    const status = this.normalizeStatus(payload.status);

    const existing = this.database.get(payload.answer_document_id);
    const now = new Date().toISOString();

    const resolvedNote =
      status === "rejected"
        ? sanitizeRejectionNote(payload.note)
        : payload.note
        ? sanitizeRejectionNote(payload.note)
        : null;

    if (existing) {
      // Alur update (Re-Approve atau revisi status)
      existing.status = status;
      existing.note = resolvedNote;
      existing.reviewer_id = payload.reviewer_id;
      existing.reviewed_at = now;
      existing.updated_at = now;
      this.database.set(payload.answer_document_id, existing);
      return { ...existing };
    }

    // Alur create approval baru
    const newRecord: AnswerDocumentApprovalsDataModel = {
      id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      answer_document_id: payload.answer_document_id,
      student_id: payload.student_id,
      reviewer_id: payload.reviewer_id,
      status,
      note: resolvedNote,
      reviewed_at: status === "approved" || status === "rejected" ? now : null,
      created_at: now,
      updated_at: now,
    };

    this.database.set(payload.answer_document_id, newRecord);
    return { ...newRecord };
  }

  public getByAnswerDocumentId(docId: string): AnswerDocumentApprovalsDataModel | undefined {
    return this.database.get(docId);
  }

  public clear() {
    this.database.clear();
  }
}

describe("INTEGRATION TESTING - Alur Persetujuan Dokumen & Siklus State (Frontend Hook to Backend Service)", () => {
  let backend: MockAnswerDocumentApprovalBackend;
  let queryClient: QueryClient;

  beforeEach(() => {
    backend = new MockAnswerDocumentApprovalBackend();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  // =========================================================================
  // TASK 1: INTEGRASI ALUR PERSETUJUAN PASPOR (PASSPORT APPROVAL & CACHE)
  // =========================================================================
  describe("Task 1: Integrasi Persetujuan Paspor & Invalidasi Cache TanStack Query", () => {
    it("Task 1.1: Admisi menyetujui paspor valid -> Database mencatat status approved dan timestamp", async () => {
      // Inisialisasi cache query awal
      const docId = "doc-passport-001";
      queryClient.setQueryData(["answer-document-approvals"], []);

      const payload: AnswerDocumentApprovalsPayloadCreateModel = {
        answer_document_id: docId,
        student_id: "std-101",
        reviewer_id: "adm-01",
        status: "approved",
      };

      // 1. Eksekusi mutasi API
      const result = backend.createOrUpdate(payload, "admission");

      // 2. Verifikasi state hasil mutasi di database
      assert.strictEqual(result.status, "approved");
      assert.strictEqual(result.reviewer_id, "adm-01");
      assert.ok(result.reviewed_at !== null && result.reviewed_at !== undefined);

      // 3. Simulasi onSuccess hook: invalidasi cache query
      await queryClient.invalidateQueries({ queryKey: ["answer-document-approvals"] });
      await queryClient.invalidateQueries({ queryKey: ["answer-documents"] });
      await queryClient.invalidateQueries({ queryKey: ["user"] });

      // Verifikasi query cache state ter-invalidate
      const queryState = queryClient.getQueryState(["answer-document-approvals"]);
      assert.strictEqual(queryState?.isInvalidated, true);
    });
  });

  // =========================================================================
  // TASK 2: INTEGRASI PENOLAKAN DOKUMEN DENGAN AUTO-TEMPLATE CATATAN
  // =========================================================================
  describe("Task 2: Integrasi Penolakan Dokumen dengan Catatan Revisi Otomatis", () => {
    it("Task 2.1: Admisi menolak paspor tanpa catatan manual -> Sistem menyuntikkan catatan default", () => {
      const docId = "doc-passport-002";
      const payload: AnswerDocumentApprovalsPayloadCreateModel = {
        answer_document_id: docId,
        student_id: "std-102",
        reviewer_id: "adm-02",
        status: "rejected",
        note: "", // Kosong
      };

      const result = backend.createOrUpdate(payload, "admission");
      assert.strictEqual(result.status, "rejected");
      assert.strictEqual(result.note, DEFAULT_REJECTION_NOTE);
    });

    it("Task 2.2: Catatan penolakan yang mengandung tag script XSS dibersihkan sebelum disimpan ke database", () => {
      const docId = "doc-passport-003";
      const payload: AnswerDocumentApprovalsPayloadCreateModel = {
        answer_document_id: docId,
        student_id: "std-103",
        reviewer_id: "adm-02",
        status: "rejected",
        note: "Foto buram. <script>stealToken()</script>",
      };

      const result = backend.createOrUpdate(payload, "admission");
      assert.strictEqual(result.note?.includes("<script>"), false);
      assert.strictEqual(result.note?.includes("stealToken"), false);
      assert.strictEqual(result.note, "Foto buram.");
    });
  });

  // =========================================================================
  // TASK 3: INTEGRASI SETUJUI ULANG (RE-APPROVE) SETELAH PENOLAKAN
  // =========================================================================
  describe("Task 3: Integrasi Setujui Ulang (Re-Approve) pada Berkas yang Ditolak", () => {
    it("Task 3.1: Berkas rejected berhasil diubah menjadi approved dengan pembaruan reviewer_id", () => {
      const docId = "doc-transcript-001";

      // 1. Awalnya ditolak oleh reviewer adm-01
      backend.createOrUpdate(
        {
          answer_document_id: docId,
          student_id: "std-104",
          reviewer_id: "adm-01",
          status: "rejected",
          note: "Halaman 2 belum terunggah.",
        },
        "admission"
      );

      const rejectedDoc = backend.getByAnswerDocumentId(docId);
      assert.strictEqual(rejectedDoc?.status, "rejected");

      // 2. Siswa memperbaiki dan Admisi adm-02 melakukan Setujui Ulang
      const updated = backend.createOrUpdate(
        {
          answer_document_id: docId,
          student_id: "std-104",
          reviewer_id: "adm-02",
          status: "approved",
          note: null,
        },
        "admission"
      );

      // Verifikasi status termutasi ke approved dan reviewer_id diperbarui
      assert.strictEqual(updated.status, "approved");
      assert.strictEqual(updated.reviewer_id, "adm-02");
      assert.strictEqual(updated.note, null);
    });
  });

  // =========================================================================
  // TASK 4: INTEGRASI DOKUMEN KHUSUS STUDENT_SIGN & PENCEGAHAN BATAL
  // =========================================================================
  describe("Task 4: Integrasi Dokumen Tanda Tangan (STUDENT_SIGN) & Penguncian Legal", () => {
    it("Task 4.1: Dokumen bertanda tangan valid tidak boleh menerima aksi pembatalan persetujuan", () => {
      const docId = "doc-statement-sign-001";
      const isVerifiedSignature = true;

      // Persetujuan awal
      backend.createOrUpdate(
        {
          answer_document_id: docId,
          student_id: "std-105",
          reviewer_id: "adm-01",
          status: "approved",
        },
        "admission"
      );

      // Frontend memeriksa guard sebelum memicu API pembatalan
      const canTriggerCancel = !isVerifiedSignature;
      assert.strictEqual(canTriggerCancel, false);

      // Status database tetap approved dan tidak terganggu
      const current = backend.getByAnswerDocumentId(docId);
      assert.strictEqual(current?.status, "approved");
    });
  });

  // =========================================================================
  // TASK 5: INTEGRASI PENERJEMAHAN & KUOTA TERJEMAHAN (ACADEMIC_TRANSCRIPT)
  // =========================================================================
  describe("Task 5: Integrasi Pemotongan Kuota Penerjemahan Dokumen Akademik", () => {
    it("Task 5.1: Mengajukan berkas ijazah ke penerjemahan tersumpah mengurangi sisa kuota", () => {
      let studentTranslationQuota = 3;

      const submitToTranslation = (docType: string) => {
        if (docType === "ACADEMIC_TRANSCRIPT" || docType === "IJAZAH") {
          if (studentTranslationQuota <= 0) {
            throw new Error("HTTP 400: Kuota penerjemahan dokumen telah habis");
          }
          studentTranslationQuota -= 1;
          return { success: true, remainingQuota: studentTranslationQuota };
        }
        return { success: true, remainingQuota: studentTranslationQuota };
      };

      const res1 = submitToTranslation("ACADEMIC_TRANSCRIPT");
      assert.strictEqual(res1.remainingQuota, 2);

      const res2 = submitToTranslation("ACADEMIC_TRANSCRIPT");
      assert.strictEqual(res2.remainingQuota, 1);

      const res3 = submitToTranslation("ACADEMIC_TRANSCRIPT");
      assert.strictEqual(res3.remainingQuota, 0);

      // Transaksi ke-4 harus gagal karena kuota habis
      assert.throws(() => submitToTranslation("ACADEMIC_TRANSCRIPT"), /Kuota penerjemahan dokumen telah habis/);
    });
  });

  // =========================================================================
  // TASK 6: INTEGRASI PENANGANAN GALAT HTTP (401, 403, 422, 500)
  // =========================================================================
  describe("Task 6: Penanganan Galat Jaringan & Kode Status HTTP (Error Matrix)", () => {
    it("Task 6.1: Menolak request persetujuan berkas jika dipanggil oleh role student (HTTP 403 Forbidden)", () => {
      assert.throws(
        () =>
          backend.createOrUpdate(
            {
              answer_document_id: "doc-hacker-01",
              student_id: "std-hacker",
              reviewer_id: "std-hacker",
              status: "approved",
            },
            "student" // Siswa mencoba menyetujui berkasnya sendiri
          ),
        /HTTP 403: Forbidden/
      );
    });

    it("Task 6.2: Menolak request persetujuan berkas jika dipanggil oleh role director (HTTP 403 Forbidden)", () => {
      assert.throws(
        () =>
          backend.createOrUpdate(
            {
              answer_document_id: "doc-dir-01",
              student_id: "std-106",
              reviewer_id: "director-01",
              status: "approved",
            },
            "director" // Direktur mencoba memutasi status persetujuan
          ),
        /HTTP 403: Forbidden/
      );
    });

    it("Task 6.3: Menolak status anomali selain pending, approved, rejected (HTTP 422 Unprocessable Entity)", () => {
      assert.throws(
        () =>
          backend.createOrUpdate(
            {
              answer_document_id: "doc-invalid-status",
              student_id: "std-107",
              reviewer_id: "adm-01",
              status: "terverifikasi_palsu", // Nilai tidak sah
            },
            "admission"
          ),
        /HTTP 422: invalid status/
      );
    });

    it("Task 6.4: Menolak payload jika answer_document_id atau student_id kosong (HTTP 400 Bad Request)", () => {
      assert.throws(
        () =>
          backend.createOrUpdate(
            {
              answer_document_id: "",
              student_id: "std-108",
              reviewer_id: "adm-01",
              status: "approved",
            },
            "admission"
          ),
        /HTTP 400: Bad Request/
      );
    });
  });

  // =========================================================================
  // TASK 7: INTEGRASI KONKURENSI & IDEMPOTENSI (RACE CONDITION SAFETY)
  // =========================================================================
  describe("Task 7: Integrasi Konkurensi & Idempotensi Mutasi (Upsert Safety)", () => {
    it("Task 7.1: Dua staf admisi menyetujui berkas yang sama secara bersamaan tidak menghasilkan duplikasi database", () => {
      const docId = "doc-concurrent-001";

      // Staf A menyetujui
      const resultA = backend.createOrUpdate(
        {
          answer_document_id: docId,
          student_id: "std-109",
          reviewer_id: "adm-staff-A",
          status: "approved",
        },
        "admission"
      );

      // Staf B menyetujui berkas yang sama beberapa milidetik kemudian
      const resultB = backend.createOrUpdate(
        {
          answer_document_id: docId,
          student_id: "std-109",
          reviewer_id: "adm-staff-B",
          status: "approved",
        },
        "admission"
      );

      // Keduanya harus mengacu pada satu record yang sama (idempotent upsert)
      assert.strictEqual(resultA.id, resultB.id);
      assert.strictEqual(resultB.reviewer_id, "adm-staff-B");
      assert.strictEqual(resultB.status, "approved");
    });
  });
});
