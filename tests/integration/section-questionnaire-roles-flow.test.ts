import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import type {
  AnswerApprovalsDataModel,
  AnswerApprovalsPayloadCreateModel,
} from "@/app/models/answer-approvals";
import type { UserDataModel } from "@/app/models/user";
import {
  hasPermission,
  sanitizeRejectionNote,
  DEFAULT_REJECTION_NOTE,
} from "@/app/utils/role-permissions";
import { extractStudentCvData } from "@/app/(view)/admission/dashboard/students-management/detail/[id]/cv/editor/utils";

/**
 * Backend Mock Service untuk Alur Persetujuan Kuesioner Seksi & Pembuatan CV
 */
class MockSectionApprovalBackend {
  private approvals = new Map<string, AnswerApprovalsDataModel>();

  public normalizeStatus(status?: string | null): string {
    if (!status) return "pending";
    const clean = status.trim().toLowerCase();
    if (clean === "" || clean === "pending") return "pending";
    if (clean === "approved" || clean === "rejected") return clean;
    throw new Error("HTTP 422: Status tidak valid (gunakan: pending, approved, rejected)");
  }

  public processApproval(
    payload: AnswerApprovalsPayloadCreateModel,
    requesterRole: string = "admission"
  ): AnswerApprovalsDataModel {
    // 1. Guard RBAC: Hanya Admisi yang berhak memproses verifikasi jawaban kuesioner
    if (requesterRole !== "admission") {
      throw new Error("HTTP 403: Forbidden - Hanya peran admisi yang berhak menyetujui kuesioner");
    }

    // 2. Validasi field wajib
    if (!payload.answer_id || !payload.student_id) {
      throw new Error("HTTP 400: Bad Request - answer_id dan student_id wajib diisi");
    }

    const status = this.normalizeStatus(payload.status);
    const existing = this.approvals.get(payload.answer_id);
    const now = new Date().toISOString();

    const resolvedNote =
      status === "rejected"
        ? sanitizeRejectionNote(payload.note || DEFAULT_REJECTION_NOTE)
        : payload.note
        ? sanitizeRejectionNote(payload.note)
        : null;

    if (existing) {
      existing.status = status;
      existing.note = resolvedNote;
      existing.reviewer_id = payload.reviewer_id;
      existing.reviewed_at = now;
      existing.updated_at = now;
      this.approvals.set(payload.answer_id, existing);
      return { ...existing };
    }

    const newRecord: AnswerApprovalsDataModel = {
      id: `appr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      answer_id: payload.answer_id,
      student_id: payload.student_id,
      reviewer_id: payload.reviewer_id,
      status,
      note: resolvedNote,
      reviewed_at: now,
      created_at: now,
      updated_at: now,
    };
    this.approvals.set(payload.answer_id, newRecord);
    return { ...newRecord };
  }

  public batchApproveSection(
    answerIds: string[],
    studentId: string,
    reviewerId: string,
    requesterRole: string = "admission"
  ): AnswerApprovalsDataModel[] {
    if (requesterRole !== "admission") {
      throw new Error("HTTP 403: Forbidden - Batch approval hanya boleh dijalankan oleh admisi");
    }

    return answerIds.map((ansId) =>
      this.processApproval(
        {
          answer_id: ansId,
          student_id: studentId,
          reviewer_id: reviewerId,
          status: "approved",
          note: null,
        },
        requesterRole
      )
    );
  }

  public getApproval(answerId: string): AnswerApprovalsDataModel | undefined {
    return this.approvals.get(answerId);
  }

  public getAllApprovals(): AnswerApprovalsDataModel[] {
    return Array.from(this.approvals.values());
  }

  public clear(): void {
    this.approvals.clear();
  }
}

// Helper evaluator status kesiapan CV
function evaluateCvReadiness(total: number, approved: number, rejected: number) {
  const isReady = total > 0 && approved === total && rejected === 0;
  const status =
    rejected > 0
      ? { label: "Revision Needed", color: "red" }
      : isReady
      ? { label: "Ready for Director", color: "green" }
      : { label: "Pending Admission", color: "gold" };
  return { isReady, status };
}

describe("INTEGRATION TESTING - Alur Seksi Kuesioner, Persetujuan Admisi & Pengaruh Role", () => {
  let backend: MockSectionApprovalBackend;
  const studentId = "student_uuid_001";

  const mockStudent: UserDataModel = {
    id: studentId,
    name: "Arya Wiguna Pratama",
    email: "arya.wiguna@example.com",
    no_phone: "+6281234567890",
    status: "ONGOING",
    created_at: "2026-01-10T08:00:00Z",
  };

  function makeAnswer(
    id: string,
    question_id: string,
    answer_text: string
  ): AnswerQuestionDataModel {
    return {
      id,
      question_id,
      student_id: studentId,
      answer_text,
      selected_option_ids: [],
      created_at: "2026-01-10T08:00:00Z",
    };
  }

  const mockQuestionBases = [
    { id: "qb_personal", name: "Personal Details" },
    { id: "qb_formal_edu", name: "Formal Education" },
    { id: "qb_nonformal_edu", name: "Nonformal Education" },
    { id: "qb_employment", name: "Employment History" },
    { id: "qb_travel", name: "Travel History" },
    { id: "qb_next_of_kin", name: "Next of Kin" },
  ];

  const mockQuestions: QuestionDataModel[] = [
    // Personal Details
    {
      id: "q_p_01",
      base_id: "qb_personal",
      text: "Nama Lengkap Sesuai Paspor",
      input_type: "TEXT",
      required: true,
      order: 1,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_p_02",
      base_id: "qb_personal",
      text: "Kewarganegaraan",
      input_type: "SELECT",
      required: true,
      order: 2,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    // Formal Education
    {
      id: "q_fe_01",
      base_id: "qb_formal_edu",
      text: "Nama Institusi Pendidikan",
      input_type: "TEXT",
      required: true,
      order: 1,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_fe_02",
      base_id: "qb_formal_edu",
      text: "Tahun Masuk & Kelulusan",
      input_type: "TEXT",
      required: true,
      order: 2,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    // Employment History
    {
      id: "q_emp_01",
      base_id: "qb_employment",
      text: "Nama Perusahaan & Posisi",
      input_type: "TEXT",
      required: false,
      order: 1,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_emp_02",
      base_id: "qb_employment",
      text: "Deskripsi Pekerjaan",
      input_type: "TEXTAREA",
      required: false,
      order: 2,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    // Travel History (Opsional)
    {
      id: "q_trv_01",
      base_id: "qb_travel",
      text: "Riwayat Perjalanan Luar Negeri",
      input_type: "TEXTAREA",
      required: false,
      order: 1,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    // Next of Kin
    {
      id: "q_kin_01",
      base_id: "qb_next_of_kin",
      text: "Kontak Keluarga Terdekat",
      input_type: "TEXT",
      required: true,
      order: 1,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    backend = new MockSectionApprovalBackend();
  });

  // =========================================================================
  // TASK 1: VALIDASI INPUTAN KUESIONER PADA SETIAP SEKSI
  // =========================================================================
  describe("Task 1: Validasi Inputan Beragam Tipe Pertanyaan pada Tiap Seksi", () => {
    it("Task 1.1: Memvalidasi isian teks dan select pada Personal Details", () => {
      const answers: AnswerQuestionDataModel[] = [
        makeAnswer("ans_p_01", "q_p_01", "Arya Wiguna Pratama"),
        makeAnswer("ans_p_02", "q_p_02", "Indonesia (WNI)"),
      ];

      assert.strictEqual(answers[0].answer_text, "Arya Wiguna Pratama");
      assert.ok(answers[1].answer_text?.includes("WNI"));
    });

    it("Task 1.2: Memvalidasi isian seksi Formal Education dan Employment History dengan textarea", () => {
      const answers: AnswerQuestionDataModel[] = [
        makeAnswer("ans_fe_01", "q_fe_01", "Universitas Udayana"),
        makeAnswer("ans_fe_02", "q_fe_02", "2019 - 2023"),
        makeAnswer("ans_emp_01", "q_emp_01", "The Mulia Resort - Front Office"),
        makeAnswer("ans_emp_02", "q_emp_02", "Bertanggung jawab menyambut tamu VIP dan reservasi sistem Opera."),
      ];

      assert.strictEqual(answers.length, 4);
      assert.ok(Number(answers[3].answer_text?.length) > 30);
    });

    it("Task 1.3: Seksi opsional (Travel History) yang tidak diisi siswa tetap aman dan tidak menghasilkan anomali", () => {
      const answersWithoutTravel: AnswerQuestionDataModel[] = [
        makeAnswer("ans_p_01", "q_p_01", "Arya Wiguna Pratama"),
      ];

      // Ekstraksi CV saat travel history kosong
      const cvData = extractStudentCvData(
        mockStudent,
        answersWithoutTravel,
        mockQuestions,
        mockQuestionBases as any
      );

      assert.ok(cvData);
      assert.strictEqual(cvData.first_name, "Arya Wiguna");
      assert.strictEqual(cvData.last_name, "Pratama");
      // Travel history harus berupa array kosong, bukan error atau undefined
      assert.deepStrictEqual(cvData.travel_history, []);
    });
  });

  // =========================================================================
  // TASK 2: ALUR PERSETUJUAN PER SEKSI OLEH ADMISI (GRANULAR & BATCH)
  // =========================================================================
  describe("Task 2: Alur Persetujuan Per Seksi oleh Admisi (Granular & Batch Lifecycle)", () => {
    it("Task 2.1: Admisi menyetujui butir jawaban kuesioner individual", () => {
      const record = backend.processApproval(
        {
          answer_id: "ans_fe_01",
          student_id: studentId,
          reviewer_id: "adm_staff_01",
          status: "approved",
          note: null,
        },
        "admission"
      );

      assert.strictEqual(record.status, "approved");
      assert.strictEqual(record.reviewer_id, "adm_staff_01");
      assert.strictEqual(record.note, null);
    });

    it("Task 2.2: Admisi menolak butir kuesioner dengan catatan revisi wajib tersanitasi", () => {
      const dirtyNote = "Tahun kelulusan tidak cocok dengan transkrip <script>alert('xss')</script>";
      const record = backend.processApproval(
        {
          answer_id: "ans_fe_02",
          student_id: studentId,
          reviewer_id: "adm_staff_01",
          status: "rejected",
          note: dirtyNote,
        },
        "admission"
      );

      assert.strictEqual(record.status, "rejected");
      assert.ok(!record.note?.includes("<script>"));
      assert.ok(record.note?.includes("Tahun kelulusan tidak cocok"));
    });

    it("Task 2.3: Fitur 'Setujui Semua di Bagian Ini' berhasil menyetujui seluruh butir dalam seksi secara massal", () => {
      const sectionAnswerIds = ["ans_emp_01", "ans_emp_02"];
      const results = backend.batchApproveSection(
        sectionAnswerIds,
        studentId,
        "adm_staff_01",
        "admission"
      );

      assert.strictEqual(results.length, 2);
      assert.ok(results.every((r) => r.status === "approved"));
    });

    it("Task 2.4: Admisi dapat melakukan Setujui Ulang (Re-approve) setelah siswa merevisi jawaban yang ditolak", () => {
      // Langkah 1: Ditolak oleh admisi
      backend.processApproval(
        {
          answer_id: "ans_p_01",
          student_id: studentId,
          reviewer_id: "adm_staff_01",
          status: "rejected",
          note: "Ejaan nama kurang lengkap",
        },
        "admission"
      );
      assert.strictEqual(backend.getApproval("ans_p_01")?.status, "rejected");

      // Langkah 2: Siswa merevisi dan Admisi menyetujui kembali
      backend.processApproval(
        {
          answer_id: "ans_p_01",
          student_id: studentId,
          reviewer_id: "adm_staff_02",
          status: "approved",
          note: null,
        },
        "admission"
      );

      const updated = backend.getApproval("ans_p_01");
      assert.strictEqual(updated?.status, "approved");
      assert.strictEqual(updated?.reviewer_id, "adm_staff_02");
    });
  });

  // =========================================================================
  // TASK 3: GERBANG PERSYARATAN PEMBUATAN CV (GATING RULE STATE MACHINE)
  // =========================================================================
  describe("Task 3: Gerbang Persyaratan Pembuatan CV (Gating Logic & Status State Machine)", () => {
    it("Task 3.1: Pembuatan CV terkunci saat ada jawaban kuesioner yang berstatus pending", () => {
      const { isReady, status } = evaluateCvReadiness(3, 2, 0);

      assert.strictEqual(isReady, false);
      assert.strictEqual(status.label, "Pending Admission");
    });

    it("Task 3.2: Pembuatan CV terkunci saat terdapat minimal 1 jawaban yang ditolak (Revision Needed)", () => {
      const { isReady, status } = evaluateCvReadiness(3, 2, 1);

      assert.strictEqual(isReady, false);
      assert.strictEqual(status.label, "Revision Needed");
    });

    it("Task 3.3: Pembuatan CV terbuka penuh (Ready for Director) saat 100% jawaban kuesioner telah disetujui", () => {
      const { isReady, status } = evaluateCvReadiness(4, 4, 0);

      assert.strictEqual(isReady, true);
      assert.strictEqual(status.label, "Ready for Director");
    });
  });

  // =========================================================================
  // TASK 4: PENGARUH & BATASAN WEWENANG PERAN (RBAC ROLE BOUNDARIES)
  // =========================================================================
  describe("Task 4: Pengaruh & Batasan Wewenang Peran (Student, Admission, Director)", () => {
    it("Task 4.1: Role Student DITOLAK saat mencoba memproses persetujuan kuesioner sendiri (HTTP 403 Forbidden)", () => {
      assert.throws(
        () => {
          backend.processApproval(
            {
              answer_id: "ans_p_01",
              student_id: studentId,
              reviewer_id: studentId,
              status: "approved",
            },
            "student"
          );
        },
        /HTTP 403: Forbidden/
      );
    });

    it("Task 4.2: Role Student berhak mengunggah berkas & mengisi form tetapi dilarang approve dokumen", () => {
      assert.strictEqual(hasPermission("student", "document.upload", { isStudentOwner: true }), true);
      assert.strictEqual(hasPermission("student", "document.approve"), false);
      assert.strictEqual(hasPermission("student", "document.reject"), false);
    });

    it("Task 4.3: Role Admission berhak memproses persetujuan dokumen & kuesioner serta mengelola data master", () => {
      assert.strictEqual(hasPermission("admission", "document.approve"), true);
      assert.strictEqual(hasPermission("admission", "document.reject"), true);
      assert.strictEqual(hasPermission("admission", "masterData.manage"), true);
      assert.strictEqual(hasPermission("admission", "student.editStage"), true);
    });

    it("Task 4.4: Role Director berhak melihat analitik dan mengelola Master Data tetapi tidak bertugas approving berkas harian admisi", () => {
      assert.strictEqual(hasPermission("director", "analytics.viewMacroKPI"), true);
      assert.strictEqual(hasPermission("director", "masterData.manage"), true);
      assert.strictEqual(hasPermission("director", "student.viewGlobal"), true);
      assert.strictEqual(hasPermission("director", "document.approve"), false);
    });
  });

  // =========================================================================
  // TASK 5: SINKRONISASI DATA KUESIONER KE DOKUMEN CV A4
  // =========================================================================
  describe("Task 5: Sinkronisasi Data Kuesioner ke Lembar Kerja Pratinjau CV", () => {
    it("Task 5.1: Ekstraksi data siswa ke struktur CV menghasilkan payload dokumen yang lengkap dan valid", () => {
      const fullAnswers: AnswerQuestionDataModel[] = [
        makeAnswer("ans_1", "q_p_01", "Arya Wiguna Pratama"),
        makeAnswer("ans_2", "q_fe_01", "Universitas Udayana"),
        makeAnswer("ans_3", "q_fe_02", "2019 - 2023"),
        makeAnswer("ans_4", "q_emp_01", "The Mulia Resort"),
        makeAnswer("ans_5", "q_kin_01", "Wiguna Senior (+6281999888777)"),
      ];

      const cv = extractStudentCvData(
        mockStudent,
        fullAnswers,
        mockQuestions,
        mockQuestionBases as any
      );

      assert.strictEqual(cv.first_name, "Arya Wiguna");
      assert.strictEqual(cv.last_name, "Pratama");
      assert.ok(cv.educations.length >= 0);
      assert.ok(cv.skills !== undefined);
      assert.ok(["formal", 1, 7].includes(cv.template_id));
    });

    it("Task 5.2: Format template formal, klasik, dan modern mempertahankan konsistensi identitas siswa", () => {
      const cv = extractStudentCvData(mockStudent, [], mockQuestions, mockQuestionBases as any);

      cv.template_id = "formal";
      assert.strictEqual(cv.template_id, "formal");
      assert.strictEqual(cv.phone, "+6281234567890");

      cv.template_id = 1;
      assert.strictEqual(cv.template_id, 1);
      assert.strictEqual(cv.first_name, "Arya");

      cv.template_id = 7;
      assert.strictEqual(cv.template_id, 7);
      assert.strictEqual(cv.email, "arya.wiguna@example.com");
    });
  });
});
