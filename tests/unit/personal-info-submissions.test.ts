import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import type {
  AnswerQuestionDataModel,
  QuestionBaseDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import {
  getAnswerDisplayText,
  getStillWorkingOptions,
  groupSubmissionsForBase,
  harmonizeEmploymentDatesAndStatus,
  hasMeaningfulValues,
  isStillWorkingQuestion,
  isStillWorkingValue,
  isWorkEndDateQuestion,
  loadActiveTabFromStorage,
  resolveActiveTab,
  resolveDateConstraint,
  findPairedStartDateQuestion,
  saveActiveTabToStorage,
  toDayjsOrUndefined,
  type BaseDraft,
} from "@/app/utils/personal-info-submissions";

describe("UNIT TESTING - Alur Preview, Edit Langsung, & Konfirmasi Data Pendidikan", () => {
  // Mock Formal Education Questions
  const mockFormalEduQuestions: QuestionDataModel[] = [
    {
      id: "q_fe_01",
      base_id: "qb_formal_education",
      text: "Jenjang Pendidikan",
      input_type: "SELECT",
      required: true,
      order: 1,
      active: true,
      options: [
        {
          id: "opt_s1",
          question_id: "q_fe_01",
          label: "Sarjana (S1 / Bachelor Degree)",
          value: "s1",
          order: 1,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "opt_sma",
          question_id: "q_fe_01",
          label: "Sekolah Menengah Atas (SMA / High School)",
          value: "sma",
          order: 2,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ],
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_fe_02",
      base_id: "qb_formal_education",
      text: "Nama Sekolah / Institusi / Universitas",
      input_type: "TEXT",
      required: true,
      order: 2,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_fe_03",
      base_id: "qb_formal_education",
      text: "Bidang Studi / Jurusan",
      input_type: "TEXT",
      required: true,
      order: 3,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_fe_05",
      base_id: "qb_formal_education",
      text: "Tahun Mulai",
      input_type: "NUMBER",
      required: true,
      order: 5,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_fe_06",
      base_id: "qb_formal_education",
      text: "Tahun Selesai / Kelulusan",
      input_type: "NUMBER",
      required: true,
      order: 6,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    {
      id: "q_fe_07",
      base_id: "qb_formal_education",
      text: "Nilai Akhir / IPK",
      input_type: "TEXT",
      required: true,
      order: 7,
      active: true,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
  ];

  // =========================================================================
  // TASK 1: PEMETAAN & RESOLUSI TEKS JAWABAN (getAnswerDisplayText)
  // =========================================================================
  describe("Task 1: Resolusi Teks Jawaban Pilihan & Format Tanggal", () => {
    it("Task 1.1: Mengembalikan label deskriptif untuk pertanyaan bertipe SELECT / opsi", () => {
      const q = mockFormalEduQuestions[0]; // Jenjang Pendidikan
      const ans: AnswerQuestionDataModel = {
        id: "ans_1",
        question_id: "q_fe_01",
        selected_option_ids: ["opt_s1"],
        created_at: "2026-01-01T00:00:00Z",
      };

      const displayText = getAnswerDisplayText(q, ans);
      assert.strictEqual(displayText, "Sarjana (S1 / Bachelor Degree)");
    });

    it("Task 1.2: Mengembalikan teks mentah untuk input bertipe TEXT / NUMBER", () => {
      const q = mockFormalEduQuestions[1]; // Nama Sekolah
      const ans: AnswerQuestionDataModel = {
        id: "ans_2",
        question_id: "q_fe_02",
        answer_text: "Universitas Udayana",
        selected_option_ids: [],
        created_at: "2026-01-01T00:00:00Z",
      };

      const displayText = getAnswerDisplayText(q, ans);
      assert.strictEqual(displayText, "Universitas Udayana");
    });
  });

  // =========================================================================
  // TASK 2: GROUPING SUBMISSION & EKSTRAKSI PREVIEW CARDS
  // =========================================================================
  describe("Task 2: Pengelompokan Jawaban Berdasarkan Submission ID untuk Kartu Preview", () => {
    it("Task 2.1: Mengelompokkan riwayat pendidikan ganda (SMA & S1) secara terpisah", () => {
      const mockAnswers: AnswerQuestionDataModel[] = [
        // S1 Submission
        {
          id: "ans_s1_01",
          submission_id: "sub_fe_s1",
          question_id: "q_fe_01",
          selected_option_ids: ["opt_s1"],
          created_at: "2026-03-01T10:00:00Z",
        },
        {
          id: "ans_s1_02",
          submission_id: "sub_fe_s1",
          question_id: "q_fe_02",
          answer_text: "Universitas Udayana",
          selected_option_ids: [],
          created_at: "2026-03-01T10:00:00Z",
        },
        {
          id: "ans_s1_03",
          submission_id: "sub_fe_s1",
          question_id: "q_fe_03",
          answer_text: "Teknologi Informasi",
          selected_option_ids: [],
          created_at: "2026-03-01T10:00:00Z",
        },
        {
          id: "ans_s1_07",
          submission_id: "sub_fe_s1",
          question_id: "q_fe_07",
          answer_text: "3.82",
          selected_option_ids: [],
          created_at: "2026-03-01T10:00:00Z",
        },

        // SMA Submission
        {
          id: "ans_sma_01",
          submission_id: "sub_fe_sma",
          question_id: "q_fe_01",
          selected_option_ids: ["opt_sma"],
          created_at: "2026-02-01T10:00:00Z",
        },
        {
          id: "ans_sma_02",
          submission_id: "sub_fe_sma",
          question_id: "q_fe_02",
          answer_text: "SMA Negeri 1 Denpasar",
          selected_option_ids: [],
          created_at: "2026-02-01T10:00:00Z",
        },
        {
          id: "ans_sma_03",
          submission_id: "sub_fe_sma",
          question_id: "q_fe_03",
          answer_text: "MIPA",
          selected_option_ids: [],
          created_at: "2026-02-01T10:00:00Z",
        },
      ];

      const entries = groupSubmissionsForBase(
        mockFormalEduQuestions,
        mockAnswers,
      );

      assert.strictEqual(entries.length, 2);

      // Entry 1 (Terbaru - S1)
      const s1Entry = entries.find((e) => e.submissionId === "sub_fe_s1");
      assert.ok(s1Entry);
      assert.strictEqual(s1Entry.title, "Universitas Udayana");
      assert.strictEqual(s1Entry.badge, "Sarjana (S1 / Bachelor Degree)");
      assert.ok(s1Entry.subtitle.includes("Teknologi Informasi"));
      assert.ok(s1Entry.subtitle.includes("IPK: 3.82"));

      // Entry 2 (SMA)
      const smaEntry = entries.find((e) => e.submissionId === "sub_fe_sma");
      assert.ok(smaEntry);
      assert.strictEqual(smaEntry.title, "SMA Negeri 1 Denpasar");
      assert.strictEqual(
        smaEntry.badge,
        "Sekolah Menengah Atas (SMA / High School)",
      );
      assert.ok(smaEntry.subtitle.includes("MIPA"));
    });

    it("Task 2.2: Tangguh terhadap berkas legacy tanpa submission_id", () => {
      const mockLegacyAnswers: AnswerQuestionDataModel[] = [
        {
          id: "ans_leg_01",
          submission_id: null,
          question_id: "q_fe_02",
          answer_text: "Institut Teknologi Bandung",
          selected_option_ids: [],
          created_at: "2026-01-10T08:00:00Z",
        },
      ];

      const entries = groupSubmissionsForBase(
        mockFormalEduQuestions,
        mockLegacyAnswers,
      );
      assert.strictEqual(entries.length, 1);
      assert.strictEqual(entries[0].title, "Institut Teknologi Bandung");
      assert.ok(entries[0].submissionId.startsWith("sub_legacy_"));
    });

    it("Task 2.3: Mengembalikan array kosong jika tidak ada jawaban relevan", () => {
      const entries = groupSubmissionsForBase(mockFormalEduQuestions, []);
      assert.strictEqual(entries.length, 0);
    });
  });

  // =========================================================================
  // TASK 3: SIMULASI ALUR EDIT & KONFIRMASI DATA
  // =========================================================================
  describe("Task 3: Simulasi Alur Edit Langsung & Jendela Konfirmasi", () => {
    it("Task 3.1: Memulai mode edit menetapkan submission_id aktif dan mengisi form", () => {
      const entryToEdit = {
        submissionId: "sub_fe_s1",
        title: "Universitas Udayana",
      };

      let activeEditingSubmissionId: string | null = null;
      let activeEditingTitle: string | null = null;

      // Siswa menekan tombol Edit
      activeEditingSubmissionId = entryToEdit.submissionId;
      activeEditingTitle = entryToEdit.title;

      assert.strictEqual(activeEditingSubmissionId, "sub_fe_s1");
      assert.strictEqual(activeEditingTitle, "Universitas Udayana");
    });

    it("Task 3.2: Penekanan tombol simpan pada mode edit memicu modal konfirmasi", () => {
      const activeEditingSubmissionId = "sub_fe_s1";
      let isConfirmModalOpen = false;
      let pendingValues: Record<string, unknown> | null = null;

      const formValues = {
        q_fe_01: "opt_s1",
        q_fe_02: "Universitas Udayana (Kampus Jimbaran)",
        q_fe_07: "3.90",
      };

      // Intersepsi submit saat mode edit
      if (activeEditingSubmissionId) {
        pendingValues = formValues;
        isConfirmModalOpen = true;
      }

      assert.strictEqual(isConfirmModalOpen, true);
      assert.deepStrictEqual(pendingValues, formValues);
    });

    it("Task 3.3: Konfirmasi persetujuan modal memperbarui jawaban pada submission_id yang sama", () => {
      const existingAnswersMap = new Map<string, { id: string; val: string }>([
        ["q_fe_02", { id: "ans_s1_02", val: "Universitas Udayana" }],
      ]);

      const targetSubmissionId = "sub_fe_s1";
      const updatedValue = "Universitas Udayana (Kampus Jimbaran)";

      const updatedPayloads: Array<{ id: string; val: string; subId: string }> =
        [];

      // Eksekusi setelah konfirmasi dialog
      const existing = existingAnswersMap.get("q_fe_02");
      if (existing) {
        updatedPayloads.push({
          id: existing.id,
          val: updatedValue,
          subId: targetSubmissionId,
        });
      }

      assert.strictEqual(updatedPayloads.length, 1);
      assert.strictEqual(updatedPayloads[0].id, "ans_s1_02");
      assert.strictEqual(updatedPayloads[0].val, updatedValue);
      assert.strictEqual(updatedPayloads[0].subId, "sub_fe_s1");
    });
  });

  // =========================================================================
  // TASK 4: PRESERVASI DRAF KETIKAN PENGGUNA SAAT BERPINDAH TAB
  // =========================================================================
  describe("Task 4: Preservasi Draf Ketikan Pengguna Antar-Tab (Draft Persistence)", () => {
    it("Task 4.1: hasMeaningfulValues mengidentifikasi input bernilai dan mengabaikan objek kosong", () => {
      assert.strictEqual(hasMeaningfulValues({}), false);
      assert.strictEqual(
        hasMeaningfulValues({ q1: "", q2: null, q3: undefined }),
        false,
      );
      assert.strictEqual(hasMeaningfulValues({ q1: [] }), false);
      assert.strictEqual(
        hasMeaningfulValues({ q1: "Institut Teknologi Bandung" }),
        true,
      );
      assert.strictEqual(hasMeaningfulValues({ q1: ["opt_1"] }), true);
      assert.strictEqual(hasMeaningfulValues({ q1: 0 }), true);
    });

    it("Task 4.2: Ketikan yang belum disubmit tersimpan aman saat berpindah ke section lain", () => {
      const drafts: Record<string, BaseDraft> = {};

      // Pengguna sedang mengetik di tab pendidikan formal
      const currentTab = "qb_formal_education";
      const unsubmittedTyping = {
        q_fe_01: "opt_s1",
        q_fe_02: "Institut Teknologi Bandung",
        q_fe_03: "Teknik Informatika",
      };

      // Sistem menyimpan draf saat berpindah tab atau saat onValuesChange
      if (hasMeaningfulValues(unsubmittedTyping)) {
        drafts[currentTab] = {
          values: unsubmittedTyping,
          editingSubmissionId: null,
          editingTitle: null,
          updatedAt: Date.now(),
        };
      }

      // Pengguna beralih ke tab riwayat pekerjaan
      const nextTab = "qb_employment_history";
      assert.strictEqual(Boolean(drafts[nextTab]), false);

      // Pengguna kembali lagi ke tab pendidikan formal
      const restoredDraft = drafts[currentTab];
      assert.ok(restoredDraft);
      assert.strictEqual(
        restoredDraft.values.q_fe_02,
        "Institut Teknologi Bandung",
      );
      assert.strictEqual(restoredDraft.values.q_fe_03, "Teknik Informatika");
    });

    it("Task 4.3: Menghapus draf dari penyimpanan saat formulir berhasil disubmit", () => {
      const drafts: Record<string, BaseDraft> = {
        qb_formal_education: {
          values: { q_fe_02: "Universitas Indonesia" },
          updatedAt: Date.now(),
        },
      };

      assert.ok(drafts.qb_formal_education);

      // Simulasi pembersihan draf setelah submit berhasil
      delete drafts.qb_formal_education;

      assert.strictEqual(drafts.qb_formal_education, undefined);
    });
  });

  describe("Task 5: Sinkronisasi Otomatis Masih Bekerja vs Tanggal Selesai Bekerja", () => {
    const mockEmploymentQuestions = [
      {
        id: "q_eh_01",
        base_id: "qb_employment_history",
        text: "Nama Perusahaan",
        input_type: "TEXT",
        required: true,
        order: 1,
        active: true,
      },
      {
        id: "q_eh_04",
        base_id: "qb_employment_history",
        text: "Tanggal Mulai Bekerja",
        input_type: "DATE",
        required: true,
        order: 4,
        active: true,
      },
      {
        id: "q_eh_05",
        base_id: "qb_employment_history",
        text: "Tanggal Selesai Bekerja",
        input_type: "DATE",
        required: false,
        help_text: "Kosongkan bila saat ini masih bekerja di posisi ini.",
        order: 5,
        active: true,
      },
      {
        id: "q_eh_06",
        base_id: "qb_employment_history",
        text: "Apakah Masih Bekerja di Sini?",
        input_type: "RADIO",
        required: true,
        order: 6,
        active: true,
        options: [
          {
            id: "opt_eh_06_1",
            question_id: "q_eh_06",
            label: "Ya (Still working here)",
            value: "YES",
            order: 1,
            active: true,
          },
          {
            id: "opt_eh_06_2",
            question_id: "q_eh_06",
            label: "Tidak (No)",
            value: "NO",
            order: 2,
            active: true,
          },
        ],
      },
    ] as unknown as QuestionDataModel[];

    it("Task 5.1: Deteksi akurat field pertanyaan tanggal selesai dan status masih bekerja", () => {
      const qEndDate = mockEmploymentQuestions.find((q) =>
        isWorkEndDateQuestion(q, "qb_employment_history"),
      );
      const qStillWorking = mockEmploymentQuestions.find(isStillWorkingQuestion);

      assert.ok(qEndDate);
      assert.strictEqual(qEndDate.id, "q_eh_05");
      assert.ok(qStillWorking);
      assert.strictEqual(qStillWorking.id, "q_eh_06");

      const options = getStillWorkingOptions(qStillWorking);
      assert.strictEqual(options.yesOptionId, "opt_eh_06_1");
      assert.strictEqual(options.noOptionId, "opt_eh_06_2");

      assert.strictEqual(isStillWorkingValue("opt_eh_06_1", options.yesOptionId), true);
      assert.strictEqual(isStillWorkingValue("YES", options.yesOptionId), true);
      assert.strictEqual(isStillWorkingValue("Ya (Still working here)", options.yesOptionId), true);
      assert.strictEqual(isStillWorkingValue("opt_eh_06_2", options.yesOptionId), false);
      assert.strictEqual(isStillWorkingValue("NO", options.yesOptionId), false);
      assert.strictEqual(isStillWorkingValue("Tidak (No)", options.yesOptionId), false);
    });

    it("Task 5.2: Memilih 'Masih Bekerja' otomatis meniadakan tanggal selesai dan menandai harus dikosongkan", () => {
      const initialValues = {
        q_eh_01: "PT Bali Teknologi",
        q_eh_04: "2023-01-01",
        q_eh_05: "2024-05-30",
        q_eh_06: "opt_eh_06_1", // User baru saja memilih 'Ya'
      };

      const result = harmonizeEmploymentDatesAndStatus(
        initialValues,
        mockEmploymentQuestions,
        "q_eh_06",
        "qb_employment_history",
      );

      assert.strictEqual(result.shouldClearEndDate, true);
      assert.strictEqual(result.nextValues.q_eh_05, undefined);
      assert.strictEqual(result.nextValues.q_eh_06, "opt_eh_06_1");
    });

    it("Task 5.3: Memilih tanggal selesai dari tahun sebelumnya otomatis memilih radio 'Tidak (No)'", () => {
      const currentValues = {
        q_eh_01: "PT Bali Teknologi",
        q_eh_04: "2020-01-01",
        q_eh_05: "2022-12-31", // User memilih tanggal selesai dari tahun sebelumnya
        q_eh_06: undefined,
      };

      const result = harmonizeEmploymentDatesAndStatus(
        currentValues,
        mockEmploymentQuestions,
        "q_eh_05",
        "qb_employment_history",
      );

      assert.strictEqual(result.forcedStillWorkingValue, "opt_eh_06_2");
      assert.strictEqual(result.nextValues.q_eh_06, "opt_eh_06_2");
      assert.strictEqual(result.nextValues.q_eh_05, "2022-12-31");
      assert.strictEqual(result.shouldClearEndDate, false);
    });

    it("Task 5.4: Mengganti pilihan dari 'Ya' ke 'Tidak (No)' tidak menghapus data jika tanggal sudah ada", () => {
      const currentValues = {
        q_eh_01: "PT Bali Teknologi",
        q_eh_04: "2021-01-01",
        q_eh_05: "2023-08-15",
        q_eh_06: "opt_eh_06_2", // User memilih 'Tidak (No)'
      };

      const result = harmonizeEmploymentDatesAndStatus(
        currentValues,
        mockEmploymentQuestions,
        "q_eh_06",
        "qb_employment_history",
      );

      assert.strictEqual(result.shouldClearEndDate, false);
      assert.strictEqual(result.nextValues.q_eh_05, "2023-08-15");
      assert.strictEqual(result.nextValues.q_eh_06, "opt_eh_06_2");
    });

    it("Task 5.5: Harmonisasi pada restorasi draf atau inisialisasi awal membersihkan tanggal jika masih bekerja aktif", () => {
      const draftWithConflict = {
        q_eh_01: "PT Bali Teknologi",
        q_eh_05: "2024-01-01",
        q_eh_06: "opt_eh_06_1",
      };

      const result = harmonizeEmploymentDatesAndStatus(
        draftWithConflict,
        mockEmploymentQuestions,
        undefined,
        "qb_employment_history",
      );

      assert.strictEqual(result.shouldClearEndDate, true);
      assert.strictEqual(result.nextValues.q_eh_05, undefined);
    });

    it("Task 5.6: toDayjsOrUndefined mengonversi berbagai format tanggal secara aman dan mencegah runtime TypeError", () => {
      // Nilai kosong atau falsy harus mengembalikan undefined
      assert.strictEqual(toDayjsOrUndefined(undefined), undefined);
      assert.strictEqual(toDayjsOrUndefined(null), undefined);
      assert.strictEqual(toDayjsOrUndefined(""), undefined);

      // String tanggal valid (format YYYY-MM-DD atau ISO) harus diubah menjadi Dayjs dengan isValid()
      const d1 = toDayjsOrUndefined("2024-08-31");
      assert.ok(d1);
      assert.strictEqual(typeof d1.isValid, "function");
      assert.strictEqual(d1.isValid(), true);
      assert.strictEqual(d1.format("YYYY-MM-DD"), "2024-08-31");

      const d2 = toDayjsOrUndefined("2024-08-31T00:00:00.000Z");
      assert.ok(d2);
      assert.strictEqual(d2.isValid(), true);

      // Objek tanggal JavaScript Date
      const d3 = toDayjsOrUndefined(new Date("2023-09-01"));
      assert.ok(d3);
      assert.strictEqual(d3.isValid(), true);

      // Objek hasil de-serialisasi sessionStorage dengan properti $d
      const d4 = toDayjsOrUndefined({ $d: "2024-05-15" });
      assert.ok(d4);
      assert.strictEqual(d4.isValid(), true);

      // String tidak valid harus menghasilkan undefined bukan melempar galat
      assert.strictEqual(toDayjsOrUndefined("bukan-tanggal"), undefined);
    });

    it("Task 6.1: isStillWorkingQuestion dan isWorkEndDateQuestion mengenali pertanyaan kursus nonformal", () => {
      const qNfeEndDate: QuestionDataModel = {
        id: "q_nfe_04",
        base_id: "qb_nonformal_education",
        text: "Tanggal Selesai",
        input_type: "DATE",
        required: false,
        order: 4,
        active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };

      const qNfeOngoing: QuestionDataModel = {
        id: "q_nfe_07",
        base_id: "qb_nonformal_education",
        text: "Apakah Masih Mengikuti Pelatihan Ini?",
        input_type: "RADIO",
        required: true,
        order: 5,
        active: true,
        options: [
          {
            id: "opt_nfe_07_1",
            question_id: "q_nfe_07",
            label: "Ya (Masih berlangsung)",
            value: "YES",
            order: 1,
            active: true,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
          {
            id: "opt_nfe_07_2",
            question_id: "q_nfe_07",
            label: "Tidak (Sudah selesai)",
            value: "NO",
            order: 2,
            active: true,
            created_at: "2026-01-01T00:00:00Z",
            updated_at: "2026-01-01T00:00:00Z",
          },
        ],
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };

      assert.strictEqual(isWorkEndDateQuestion(qNfeEndDate, "qb_nonformal_education"), true);
      assert.strictEqual(isStillWorkingQuestion(qNfeOngoing), true);

      const opts = getStillWorkingOptions(qNfeOngoing);
      assert.strictEqual(opts.yesOptionId, "opt_nfe_07_1");
      assert.strictEqual(opts.noOptionId, "opt_nfe_07_2");

      assert.strictEqual(isStillWorkingValue("YES", opts.yesOptionId), true);
      assert.strictEqual(isStillWorkingValue("opt_nfe_07_1", opts.yesOptionId), true);
      assert.strictEqual(isStillWorkingValue("NO", opts.yesOptionId), false);
    });

    it("Task 6.2: harmonizeEmploymentDatesAndStatus pada Nonformal Education membersihkan tanggal jika memilih Present", () => {
      const mockNfeQuestions: QuestionDataModel[] = [
        {
          id: "q_nfe_01",
          base_id: "qb_nonformal_education",
          text: "Nama Pelatihan",
          input_type: "TEXT",
          required: true,
          order: 1,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "q_nfe_03",
          base_id: "qb_nonformal_education",
          text: "Tanggal Mulai",
          input_type: "DATE",
          required: true,
          order: 3,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "q_nfe_04",
          base_id: "qb_nonformal_education",
          text: "Tanggal Selesai",
          input_type: "DATE",
          required: false,
          order: 4,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "q_nfe_07",
          base_id: "qb_nonformal_education",
          text: "Apakah Masih Mengikuti Pelatihan Ini?",
          input_type: "RADIO",
          required: true,
          order: 5,
          active: true,
          options: [
            {
              id: "opt_nfe_07_1",
              question_id: "q_nfe_07",
              label: "Ya (Masih berlangsung)",
              value: "YES",
              order: 1,
              active: true,
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
            {
              id: "opt_nfe_07_2",
              question_id: "q_nfe_07",
              label: "Tidak (Sudah selesai)",
              value: "NO",
              order: 2,
              active: true,
              created_at: "2026-01-01T00:00:00Z",
              updated_at: "2026-01-01T00:00:00Z",
            },
          ],
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];

      const valuesWithYes = {
        q_nfe_01: "English Course",
        q_nfe_03: "2024-01-10",
        q_nfe_04: "2024-12-31",
        q_nfe_07: "opt_nfe_07_1", // Memilih Masih berlangsung
      };

      const resultYes = harmonizeEmploymentDatesAndStatus(
        valuesWithYes,
        mockNfeQuestions,
        "q_nfe_07",
        "qb_nonformal_education",
      );

      assert.strictEqual(resultYes.shouldClearEndDate, true);
      assert.strictEqual(resultYes.nextValues.q_nfe_04, undefined);

      const valuesWithDate = {
        q_nfe_01: "English Course",
        q_nfe_03: "2024-01-10",
        q_nfe_04: "2024-06-30",
        q_nfe_07: "opt_nfe_07_1",
      };

      const resultDate = harmonizeEmploymentDatesAndStatus(
        valuesWithDate,
        mockNfeQuestions,
        "q_nfe_04",
        "qb_nonformal_education",
      );

      assert.strictEqual(resultDate.forcedStillWorkingValue, "opt_nfe_07_2");
      assert.strictEqual(resultDate.nextValues.q_nfe_07, "opt_nfe_07_2");
    });
  });

  describe("Persistensi & Pemulihan Tab Section Kuesioner saat Refresh Halaman", () => {
    const mockBases: QuestionBaseDataModel[] = [
      { id: "1", name: "Travel History", type_country: "COMMON", allow_multiple_submissions: true, active: true, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      { id: "2", name: "Personal Details", type_country: "COMMON", allow_multiple_submissions: false, active: true, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      { id: "3", name: "Nonformal Education", type_country: "COMMON", allow_multiple_submissions: true, active: true, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      { id: "4", name: "Next of Kin", type_country: "COMMON", allow_multiple_submissions: true, active: true, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      { id: "5", name: "Formal Education", type_country: "COMMON", allow_multiple_submissions: true, active: true, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
      { id: "6", name: "Employment History", type_country: "COMMON", allow_multiple_submissions: true, active: true, version: 1, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    ];

    // Mock sessionStorage
    const storageMap = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => storageMap.get(key) ?? null,
      setItem: (key: string, val: string) => storageMap.set(key, String(val)),
      removeItem: (key: string) => storageMap.delete(key),
      clear: () => storageMap.clear(),
    };

    beforeEach(() => {
      storageMap.clear();
      (globalThis as any).window = {};
      (globalThis as any).sessionStorage = mockStorage;
    });

    it("Harus memprioritaskan tab dari parameter URL query jika valid", () => {
      const active = resolveActiveTab(mockBases, 101, undefined, "2");
      assert.strictEqual(active, "2");
    });

    it("Harus memulihkan tab dari sessionStorage saat siswa telah memilih section Personal Details", () => {
      saveActiveTabToStorage(101, "2");
      assert.strictEqual(loadActiveTabFromStorage(101), "2");

      const resolved = resolveActiveTab(mockBases, 101, undefined, undefined);
      assert.strictEqual(resolved, "2");
    });

    it("Harus otomatis mengarahkan ke section yang memiliki draf isian terbaru saat user mulai mengetik lalu refresh", () => {
      const mockDrafts: Record<string, BaseDraft> = {
        "1": {
          values: {},
          updatedAt: 100,
        },
        "2": {
          values: { q_pd_01: "John Doe", q_pd_02: "12345678" },
          updatedAt: 500,
        },
        "3": {
          values: { q_nfe_01: "Kursus Bahasa" },
          updatedAt: 300,
        },
      };

      // Tanpa preferredTab dan tanpa sessionStorage
      const resolved = resolveActiveTab(mockBases, 101, mockDrafts, undefined);
      assert.strictEqual(resolved, "2");
    });

    it("Harus fallback ke base pertama (Travel History) jika belum ada aktivitas atau data tersimpan", () => {
      const resolved = resolveActiveTab(mockBases, 101, {}, undefined);
      assert.strictEqual(resolved, "1");
    });

    it("Harus mengabaikan tab yang tidak ada dalam daftar bases", () => {
      saveActiveTabToStorage(101, "999");
      const resolved = resolveActiveTab(mockBases, 101, undefined, "999");
      assert.strictEqual(resolved, "1");
    });
  });

  describe("Aturan Validasi Tanggal Dinamis (Date Constraints) & Paspor", () => {
    it("Harus menetapkan tanggal kadaluwarsa paspor sebagai AFTER_START_DATE jika terdapat pertanyaan tanggal penerbitan", () => {
      const mockPersonalQuestions: QuestionDataModel[] = [
        {
          id: "q_pd_08_issue",
          base_id: "qb_personal_details",
          text: "Tanggal Dikeluarkan Paspor",
          input_type: "DATE",
          required: true,
          order: 8,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "q_pd_09",
          base_id: "qb_personal_details",
          text: "Passport Expiry Date",
          input_type: "DATE",
          required: true,
          order: 9,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];

      const constraint = resolveDateConstraint(
        mockPersonalQuestions[1],
        mockPersonalQuestions,
      );

      assert.strictEqual(constraint.type, "AFTER_START_DATE");
      assert.strictEqual(constraint.pairedStartQuestionId, "q_pd_08_issue");
      assert.strictEqual(
        constraint.errorMessage,
        "Tanggal habis berlaku tidak boleh lebih awal dari tanggal penerbitan",
      );
    });

    it("Harus mengizinkan tanggal kadaluwarsa paspor bebas (NONE) jika tidak ada tanggal penerbitan dan tidak memaksa FUTURE_ONLY", () => {
      const singleQuestion: QuestionDataModel = {
        id: "q_pd_09",
        base_id: "qb_personal_details",
        text: "Passport Expiry Date",
        input_type: "DATE",
        required: true,
        order: 9,
        active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      };

      const constraint = resolveDateConstraint(singleQuestion, [singleQuestion]);
      assert.strictEqual(constraint.type, "NONE");
    });

    it("Harus menetapkan tanggal selesai pendidikan atau riwayat kerja sebagai AFTER_START_DATE", () => {
      const mockWorkQuestions: QuestionDataModel[] = [
        {
          id: "q_eh_04",
          base_id: "qb_employment_history",
          text: "Start Date",
          input_type: "DATE",
          required: true,
          order: 4,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: "q_eh_05",
          base_id: "qb_employment_history",
          text: "End Date",
          input_type: "DATE",
          required: true,
          order: 5,
          active: true,
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ];

      const constraint = resolveDateConstraint(
        mockWorkQuestions[1],
        mockWorkQuestions,
      );
      assert.strictEqual(constraint.type, "AFTER_START_DATE");
      assert.strictEqual(constraint.pairedStartQuestionId, "q_eh_04");
    });
  });
});
