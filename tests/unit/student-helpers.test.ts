import { describe, it } from "node:test";
import assert from "node:assert";
import type { UserDataModel } from "@/app/models/user";
import {
  COUNTRY_CODE_MAP,
  DEMO_STUDENT_DESTINATIONS,
  formatChatDateGroup,
  formatChatMessageTime,
  formatChatTimeOnly,
  formatShortDate,
  isChatMessageEditable,
  isSameDay,
  getCountryBadgeMeta,
  getCountryName,
  getCurrentStepLabel,
  getStepTone,
  getStudentAvatarUrl,
  getStudentCampus,
  getStudentInitials,
  getStudentPipelineStatus,
  getStudentVisaName,
  compareStudentsByNewest,
  computeWorkflowChecklistProgression,
  isWorkflowVisaGrantChecked,
  isMatchingConsultant,
  filterInternalNotesMentionableUsers,
  getVisaStatusBadgeMeta,
  normalizePipelineStatusOption,
  PIPELINE_STATUS_OPTIONS,
} from "@/app/utils/student-helpers";

describe("Unit Testing Modul student-helpers.ts (Multi-Task Comprehensive Suite)", () => {
  // =========================================================================
  // TASK 1: Validasi Resolusi Avatar Siswa (getStudentAvatarUrl)
  // =========================================================================
  describe("Task 1: Validasi Resolusi Avatar Siswa (getStudentAvatarUrl)", () => {
    it("Task 1.1: Harus memprioritaskan profile_picture_url langsung jika ada", () => {
      const student = {
        name: "Citra Kirana",
        profile_picture_url: "https://example.com/custom-profile.jpg",
        document_consent_proof_photo_url: "https://example.com/consent.jpg",
      } as UserDataModel;
      assert.strictEqual(getStudentAvatarUrl(student), "https://example.com/custom-profile.jpg");
    });

    it("Task 1.2: Harus fallback ke document_consent_proof_photo_url jika foto profil kosong", () => {
      const student = {
        name: "Citra Kirana",
        profile_picture_url: "   ",
        document_consent_proof_photo_url: "https://example.com/consent-only.jpg",
      } as UserDataModel;
      assert.strictEqual(getStudentAvatarUrl(student), "https://example.com/consent-only.jpg");
    });

    it("Task 1.3: Harus menggunakan foto ter-seed untuk siswa demo yang terdaftar", () => {
      const student = {
        name: "Bagas Pratama Santoso",
      } as UserDataModel;
      const avatar = getStudentAvatarUrl(student);
      assert.ok(avatar && avatar.includes("unsplash.com"));
    });

    it("Task 1.4: Harus mengembalikan undefined untuk siswa non-demo tanpa foto profil agar menampilkan inisial nama", () => {
      const student = { id: 101, name: "Ida Bagus Kadek Dananjaya" } as unknown as UserDataModel;
      assert.strictEqual(getStudentAvatarUrl(student), undefined);
    });

    it("Task 1.5: Harus mengembalikan undefined jika objek student bernilai null atau undefined", () => {
      assert.strictEqual(getStudentAvatarUrl(null), undefined);
      assert.strictEqual(getStudentAvatarUrl(undefined), undefined);
    });
  });

  // =========================================================================
  // TASK 2: Ekstraksi Inisial Siswa (getStudentInitials)
  // =========================================================================
  describe("Task 2: Ekstraksi Inisial Siswa (getStudentInitials)", () => {
    it("Task 2.1: Harus mengambil 2 inisial huruf dari nama dengan 2 kata atau lebih", () => {
      assert.strictEqual(getStudentInitials({ name: "Budi Santoso" } as UserDataModel), "BS");
      assert.strictEqual(getStudentInitials({ name: "Citra Kirana Dewi" } as UserDataModel), "CK");
    });

    it("Task 2.2: Harus mengambil 2 huruf pertama dari nama yang hanya terdiri dari 1 kata", () => {
      assert.strictEqual(getStudentInitials({ name: "Fajar" } as UserDataModel), "FA");
      assert.strictEqual(getStudentInitials({ name: "A" } as UserDataModel), "A");
    });

    it("Task 2.3: Harus mengabaikan spasi ganda atau tab di antara kata", () => {
      assert.strictEqual(getStudentInitials({ name: "  Hendra    Wijaya  " } as UserDataModel), "HW");
    });

    it("Task 2.4: Harus mengembalikan fallback ST jika nama null, kosong, atau hanya whitespace", () => {
      assert.strictEqual(getStudentInitials({ name: "" } as UserDataModel), "ST");
      assert.strictEqual(getStudentInitials({ name: "    " } as UserDataModel), "ST");
      assert.strictEqual(getStudentInitials({ name: null } as unknown as UserDataModel), "ST");
      assert.strictEqual(getStudentInitials(null), "ST");
      assert.strictEqual(getStudentInitials(undefined), "ST");
    });

    it("Task 2.5: Harus mengekstrak karakter pertama meskipun diawali angka atau simbol", () => {
      assert.strictEqual(getStudentInitials({ name: "99 Nama" } as UserDataModel), "9N");
      assert.strictEqual(getStudentInitials({ name: "#1 Player" } as UserDataModel), "#P");
    });
  });

  // =========================================================================
  // TASK 3: Mesin Penentu Negara Tujuan (getCountryName)
  // =========================================================================
  describe("Task 3: Mesin Penentu Negara Tujuan (getCountryName)", () => {
    it("Task 3.1: Harus membaca negara dari relasi stage.country jika ada", () => {
      const student = {
        name: "Zulkifli Mansur",
        stage: { country: { id: 3, name: "Germany" } },
      } as unknown as UserDataModel;
      assert.strictEqual(getCountryName(student), "Germany");
    });

    it("Task 3.2: Harus memprioritaskan pemetaan demo untuk siswa seeded tertentu", () => {
      const student = { name: "Citra Kirana Dewi" } as UserDataModel;
      assert.strictEqual(getCountryName(student), "Canada");
    });

    it("Task 3.3: Harus mampu menyimpulkan negara dari kode atau nama visa (visa inference)", () => {
      const studentCan = { name: "Non Demo Student", visa_type: "CAN_STUDY_PERMIT" } as UserDataModel;
      assert.strictEqual(getCountryName(studentCan), "Canada");

      const studentUk = { name: "Non Demo Student", visa_type_name: "UK Student Route Tier 4" } as UserDataModel;
      assert.strictEqual(getCountryName(studentUk), "United Kingdom");

      const studentNz = { name: "Non Demo Student", visa_type: "NZ_FEE_PAYING" } as UserDataModel;
      assert.strictEqual(getCountryName(studentNz), "New Zealand");

      const studentUsa = { name: "Non Demo Student", visa_type_name: "USA F-1 Academic" } as UserDataModel;
      assert.strictEqual(getCountryName(studentUsa), "United States");

      const studentAus = { name: "Non Demo Student", visa_type: "AUS_500" } as UserDataModel;
      assert.strictEqual(getCountryName(studentAus), "Australia");
    });

    it("Task 3.4: Harus mampu menyimpulkan negara dari nama kampus (campus inference)", () => {
      const studentToronto = { name: "Non Demo Student", name_campus: "University of Toronto" } as UserDataModel;
      assert.strictEqual(getCountryName(studentToronto), "Canada");

      const studentManchester = { name: "Non Demo Student", name_campus: "University of Manchester" } as UserDataModel;
      assert.strictEqual(getCountryName(studentManchester), "United Kingdom");

      const studentMelbourne = { name: "Non Demo Student", name_campus: "University of Melbourne" } as UserDataModel;
      assert.strictEqual(getCountryName(studentMelbourne), "Australia");
    });

    it("Task 3.5: Harus mengembalikan fallback - jika seluruh data negara, visa, dan kampus kosong", () => {
      const emptyStudent = { name: "Non Demo Student" } as UserDataModel;
      assert.strictEqual(getCountryName(emptyStudent), "-");
      assert.strictEqual(getCountryName(null), "-");
      assert.strictEqual(getCountryName(undefined), "-");
    });
  });

  // =========================================================================
  // TASK 4: Pemetaan Badge ISO Alpha-3 & Palet UI (getCountryBadgeMeta)
  // =========================================================================
  describe("Task 4: Pemetaan Badge ISO Alpha-3 & Palet UI (getCountryBadgeMeta)", () => {
    it("Task 4.1: Harus memetakan daftar negara standar ke ISO Alpha-3 dan palet warna yang valid", () => {
      const mapping = [
        { name: "Australia", code: "AUS", color: "#0369a1" },
        { name: "Canada", code: "CAN", color: "#b91c1c" },
        { name: "Germany", code: "GER", color: "#b45309" },
        { name: "United Kingdom", code: "UK", color: "#1d4ed8" },
        { name: "United States", code: "USA", color: "#1e40af" },
        { name: "New Zealand", code: "NZL", color: "#0f766e" },
        { name: "Singapore", code: "SGP", color: "#dc2626" },
        { name: "Ireland", code: "IRL", color: "#15803d" },
      ];

      for (const item of mapping) {
        const meta = getCountryBadgeMeta(item.name);
        assert.strictEqual(meta.code, item.code);
        assert.strictEqual(meta.color, item.color);
        assert.ok(meta.bg && meta.bg.startsWith("#"));
        assert.ok(meta.border && meta.border.startsWith("#"));
      }
    });

    it("Task 4.2: Harus tahan terhadap variasi spasi dan huruf besar/kecil", () => {
      const meta = getCountryBadgeMeta("   AUSTRALIA   ");
      assert.strictEqual(meta.code, "AUS");
      assert.strictEqual(meta.color, "#0369a1");
    });

    it("Task 4.3: Harus memotong 3 huruf awal secara kapital untuk negara di luar daftar", () => {
      const metaJapan = getCountryBadgeMeta("Japan");
      assert.strictEqual(metaJapan.code, "JAP");
      assert.strictEqual(metaJapan.color, "#475569");

      const metaFrance = getCountryBadgeMeta("France");
      assert.strictEqual(metaFrance.code, "FRA");
    });

    it("Task 4.4: Harus memberikan kode fallback INT saat input kosong, null, atau hanya spasi", () => {
      assert.strictEqual(getCountryBadgeMeta(null).code, "INT");
      assert.strictEqual(getCountryBadgeMeta(undefined).code, "INT");
      assert.strictEqual(getCountryBadgeMeta("").code, "INT");
      assert.strictEqual(getCountryBadgeMeta("    ").code, "INT");
    });
  });

  // =========================================================================
  // TASK 5: Normalisasi & Pemetaan Jenis Visa (getStudentVisaName)
  // =========================================================================
  describe("Task 5: Normalisasi & Pemetaan Jenis Visa (getStudentVisaName)", () => {
    it("Task 5.1: Harus membaca visa dari kamus demo siswa seeded", () => {
      const student = { name: "Citra Kirana Dewi" } as UserDataModel;
      assert.strictEqual(getStudentVisaName(student), "Study Permit");
    });

    it("Task 5.2: Harus memprioritaskan visa_type_name jika tersedia pada data siswa", () => {
      const student = {
        name: "Non Seeded Student",
        visa_type_name: "Post-Study Work Visa (Subclass 485)",
      } as UserDataModel;
      assert.strictEqual(getStudentVisaName(student), "Post-Study Work Visa (Subclass 485)");
    });

    it("Task 5.3: Harus memetakan kode mentah Subclass visa Australia ke label resmi", () => {
      assert.strictEqual(getStudentVisaName({ name: "X", visa_type: "aus_500" } as UserDataModel), "Subclass 500");
      assert.strictEqual(getStudentVisaName({ name: "X", visa_type: "aus_600" } as UserDataModel), "Subclass 600");
      assert.strictEqual(getStudentVisaName({ name: "X", visa_type: "aus_407" } as UserDataModel), "Subclass 407");
      assert.strictEqual(getStudentVisaName({ name: "X", visa_type: "aus_462" } as UserDataModel), "Subclass 462");
    });

    it("Task 5.4: Harus mengembalikan fallback - jika data visa tidak terisi", () => {
      assert.strictEqual(getStudentVisaName({ name: "X" } as UserDataModel), "-");
      assert.strictEqual(getStudentVisaName(null), "-");
      assert.strictEqual(getStudentVisaName(undefined), "-");
    });
  });

  // =========================================================================
  // TASK 6: Resolusi Kampus Tujuan (getStudentCampus)
  // =========================================================================
  describe("Task 6: Resolusi Kampus Tujuan (getStudentCampus)", () => {
    it("Task 6.1: Harus membaca kampus dari profil demo ter-seed", () => {
      const student = { name: "Citra Kirana Dewi" } as UserDataModel;
      assert.strictEqual(getStudentCampus(student), "University of Toronto");
    });

    it("Task 6.2: Harus membaca properti name_campus langsung jika bukan profil demo", () => {
      const student = {
        name: "Siswa Mandiri",
        name_campus: "Monash University",
      } as UserDataModel;
      assert.strictEqual(getStudentCampus(student), "Monash University");
    });

    it("Task 6.3: Harus mengembalikan fallback - jika nama kampus kosong atau null", () => {
      assert.strictEqual(getStudentCampus({ name: "Siswa Mandiri" } as UserDataModel), "-");
      assert.strictEqual(getStudentCampus(null), "-");
      assert.strictEqual(getStudentCampus(undefined), "-");
    });
  });

  // =========================================================================
  // TASK 7: Mesin Klasifikasi Status Pipeline (getStudentPipelineStatus)
  // =========================================================================
  describe("Task 7: Mesin Klasifikasi Status Pipeline (getStudentPipelineStatus)", () => {
    it("Task 7.1: Harus mengklasifikasikan variasi status Batal (CANCEL)", () => {
      const variants = ["cancel", "canceled", "Batal Pendaftaran", "Application Rejected", "Student Dropped"];
      for (const st of variants) {
        const res = getStudentPipelineStatus({ student_status: st } as UserDataModel);
        assert.strictEqual(res.key, "CANCEL");
        assert.strictEqual(res.label, "Cancel");
        assert.strictEqual(res.tone.color, "#e11d48");
      }
    });

    it("Task 7.2: Harus mengklasifikasikan variasi status Penundaan (HOLD)", () => {
      const variants = ["hold", "On Hold", "postpone intake", "tunda keberangkatan", "pending documents", "pause processing"];
      for (const st of variants) {
        const res = getStudentPipelineStatus({ student_status: st } as UserDataModel);
        assert.strictEqual(res.key, "HOLD");
        assert.strictEqual(res.label, "On Hold");
        assert.strictEqual(res.tone.color, "#d97706");
      }
    });

    it("Task 7.3: Harus mengklasifikasikan variasi status Menunggu Visa (WAITING_VISA)", () => {
      const variants = ["waiting visa", "visa waiting", "proses visa", "visa lodgement", "application lodged"];
      for (const st of variants) {
        const res = getStudentPipelineStatus({ student_status: st } as UserDataModel);
        assert.strictEqual(res.key, "WAITING_VISA");
        assert.strictEqual(res.label, "Waiting Visa");
        assert.strictEqual(res.tone.color, "#0284c7");
      }
    });

    it("Task 7.4: Harus mengklasifikasikan variasi status Selesai (COMPLETED)", () => {
      const variants = ["complete", "completed", "selesai orientasi", "done", "visa granted", "grant"];
      for (const st of variants) {
        const res = getStudentPipelineStatus({ student_status: st } as UserDataModel);
        assert.strictEqual(res.key, "COMPLETED");
        assert.strictEqual(res.label, "Completed");
        assert.strictEqual(res.tone.color, "#2563eb");
      }
    });

    it("Task 7.5: Harus mengembalikan fallback ONGOING untuk status aktif biasa", () => {
      const variants = ["in progress", "document review", "offered", "acceptance fee paid", "enrolled", ""];
      for (const st of variants) {
        const res = getStudentPipelineStatus({ student_status: st } as UserDataModel);
        assert.strictEqual(res.key, "ONGOING");
        assert.strictEqual(res.label, "On Progress");
      }
    });

    it("Task 7.6: Harus mematuhi hierarki evaluasi saat terdapat kalimat status majemuk", () => {
      // Kata 'cancel' dievaluasi sebelum 'complete'
      const cancelWins = getStudentPipelineStatus({
        student_status: "cancel after complete medical examination",
      } as UserDataModel);
      assert.strictEqual(cancelWins.key, "CANCEL");

      // Kata 'postpone' dievaluasi sebelum 'waiting visa'
      const holdWins = getStudentPipelineStatus({
        student_status: "postpone due to waiting visa processing delay",
      } as UserDataModel);
      assert.strictEqual(holdWins.key, "HOLD");
    });
  });

  // =========================================================================
  // TASK 8: Resolusi Label Tahapan Alur (getCurrentStepLabel)
  // =========================================================================
  describe("Task 8: Resolusi Label Tahapan Alur (getCurrentStepLabel)", () => {
    it("Task 8.1: Harus membaca label tahapan dari relasi stage.country.steps yang cocok", () => {
      const student = {
        current_step_id: 12,
        stage: {
          country: {
            steps: [
              { id: 10, label: "Konsultasi Awal" },
              { id: 12, label: "Pengajuan Letter of Offer" },
              { id: 14, label: "Pembayaran Deposit" },
            ],
          },
        },
      } as unknown as UserDataModel;

      assert.strictEqual(getCurrentStepLabel(student), "Pengajuan Letter of Offer");
    });

    it("Task 8.2: Harus fallback ke teks status siswa jika steps tidak cocok", () => {
      const studentCancelled = {
        current_step_id: 999,
        student_status: "cancel",
        stage: { country: { steps: [] } },
      } as unknown as UserDataModel;
      assert.strictEqual(getCurrentStepLabel(studentCancelled), "Cancelled");

      const studentHold = {
        current_step_id: 999,
        student_status: "on hold",
        stage: { country: { steps: [] } },
      } as unknown as UserDataModel;
      assert.strictEqual(getCurrentStepLabel(studentHold), "On Hold");
    });

    it("Task 8.3: Harus memberikan fallback Preparation jika tidak ada tahapan atau status spesifik", () => {
      const studentEmpty = {
        current_step_id: null,
        stage: null,
        student_status: null,
      } as unknown as UserDataModel;
      assert.strictEqual(getCurrentStepLabel(studentEmpty), "Preparation");
      assert.strictEqual(getCurrentStepLabel(null), "-");
    });
  });

  // =========================================================================
  // TASK 9: Penentuan Tone & Aksesibilitas Warna Tahapan (getStepTone)
  // =========================================================================
  describe("Task 9: Penentuan Tone & Aksesibilitas Warna Tahapan (getStepTone)", () => {
    it("Task 9.1: Harus memberikan tone merah untuk kata kunci batal", () => {
      const tone = getStepTone("Batal Pendaftaran");
      assert.strictEqual(tone.color, "#dc2626");
      assert.strictEqual(tone.background, "#fff1f2");
    });

    it("Task 9.2: Harus memberikan tone hijau untuk kata kunci visa granted / selesai", () => {
      const tone = getStepTone("Visa Granted & Pre-Departure");
      assert.strictEqual(tone.color, "#16a34a");
      assert.strictEqual(tone.background, "#f0fdf4");
    });

    it("Task 9.3: Harus memberikan tone biru untuk proses visa", () => {
      const tone = getStepTone("Proses Visa Lodgement");
      assert.strictEqual(tone.color, "#0284c7");
      assert.strictEqual(tone.background, "#f0f9ff");
    });

    it("Task 9.4: Harus memberikan tone kuning/amber untuk penundaan atau hold", () => {
      const tone = getStepTone("On Hold Sementara");
      assert.strictEqual(tone.color, "#d97706");
      assert.strictEqual(tone.background, "#fff7ed");
    });

    it("Task 9.5: Harus memberikan tone default slate jika tidak ada kata kunci khusus", () => {
      const tone = getStepTone("Konsultasi Umum");
      assert.strictEqual(tone.color, "#475569");
      assert.strictEqual(tone.background, "#f8fafc");
    });
  });

  // =========================================================================
  // TASK 10: Formatting Tanggal & Keamanan Waktu (formatShortDate)
  // =========================================================================
  describe("Task 10: Formatting Tanggal & Keamanan Waktu (formatShortDate)", () => {
    it("Task 10.1: Harus memformat tanggal ISO standar ke format ringkas bahasa Indonesia", () => {
      const result = formatShortDate("2026-05-15T10:00:00Z");
      assert.ok(result.includes("2026"));
      assert.ok(result.includes("Mei") || result.includes("May"));
    });

    it("Task 10.2: Harus mengembalikan fallback - jika format tanggal tidak valid", () => {
      assert.strictEqual(formatShortDate("bukan-tanggal"), "-");
      assert.strictEqual(formatShortDate("2026-99-99"), "-");
      assert.strictEqual(formatShortDate("undefined"), "-");
      assert.strictEqual(formatShortDate("null"), "-");
    });

    it("Task 10.3: Harus mengembalikan fallback - jika tanggal kosong, null, atau whitespace", () => {
      assert.strictEqual(formatShortDate(null), "-");
      assert.strictEqual(formatShortDate(undefined), "-");
      assert.strictEqual(formatShortDate(""), "-");
      assert.strictEqual(formatShortDate("    "), "-");
    });

    it("Task 10.4: Harus menangani tahun kabisat (29 Februari) dan Unix Epoch", () => {
      const leap = formatShortDate("2024-02-29T00:00:00Z");
      assert.ok(leap.includes("2024"));
      assert.ok(leap.includes("Feb"));

      const epoch = formatShortDate("1970-01-01T00:00:00Z");
      assert.ok(epoch.includes("1970"));
    });
  });

  // =========================================================================
  // TASK 11: Uji Ketahanan Terhadap Anomali & Payload Ekstrem
  // =========================================================================
  describe("Task 11: Uji Ketahanan Terhadap Anomali & Payload Ekstrem", () => {
    it("Task 11.1: Harus tetap berjalan normal saat menerima objek dengan null prototype", () => {
      const bareObject = Object.create(null);
      bareObject.name = "Siswa Tanpa Prototype";
      assert.strictEqual(getCountryName(bareObject), "-");
      assert.strictEqual(getStudentInitials(bareObject), "ST");
    });

    it("Task 11.2: Harus tahan terhadap string nama masif (10.000 karakter) tanpa hang", () => {
      const hugeName = "Budi " + "Santoso ".repeat(1500);
      const student = { name: hugeName } as UserDataModel;
      const initials = getStudentInitials(student);
      assert.strictEqual(initials, "BS");
    });

    it("Task 11.3: Harus menangani payload tipe data salah pada student_status (bukan string)", () => {
      const numericStatus = getStudentPipelineStatus({ student_status: 99999 as unknown as string } as UserDataModel);
      assert.strictEqual(numericStatus.key, "ONGOING");

      const objectStatus = getStudentPipelineStatus({ student_status: { status: "cancel" } as unknown as string } as UserDataModel);
      assert.strictEqual(objectStatus.key, "ONGOING");

      const arrayStatus = getStudentPipelineStatus({ student_status: ["cancel", "done"] as unknown as string } as UserDataModel);
      assert.strictEqual(arrayStatus.key, "CANCEL"); // Array toString() menjadi 'cancel,done', kata 'cancel' terdeteksi
    });
  });

  // =========================================================================
  // TASK 12: Pengurutan Siswa Pipeline (Data Baru Masuk Selalu Muncul di Atas)
  // =========================================================================
  describe("Task 12: Pengurutan Siswa Pipeline (compareStudentsByNewest)", () => {
    it("Task 12.1: Siswa dengan created_at lebih baru harus berada di posisi teratas", () => {
      const studentOld = {
        id: "usr_1",
        name: "Siswa Lama",
        created_at: "2026-10-01T10:00:00Z",
      } as UserDataModel;

      const studentNew = {
        id: "usr_2",
        name: "Siswa Baru Masuk",
        created_at: "2026-10-26T09:00:00Z",
      } as UserDataModel;

      const list = [studentOld, studentNew].sort(compareStudentsByNewest);
      assert.strictEqual(list[0].id, "usr_2");
      assert.strictEqual(list[1].id, "usr_1");
    });

    it("Task 12.2: Siswa yang status pipelinenya baru diperbarui harus berada di atas", () => {
      const studentA = {
        id: "usr_A",
        name: "Siswa A",
        created_at: "2026-10-10T10:00:00Z",
        student_status_updated_at: "2026-10-12T10:00:00Z",
      } as UserDataModel;

      const studentB = {
        id: "usr_B",
        name: "Siswa B Pindah Status",
        created_at: "2026-10-05T10:00:00Z",
        student_status_updated_at: "2026-10-26T09:30:00Z",
      } as UserDataModel;

      const list = [studentA, studentB].sort(compareStudentsByNewest);
      assert.strictEqual(list[0].id, "usr_B");
      assert.strictEqual(list[1].id, "usr_A");
    });

    it("Task 12.3: Jika created_at dan updated_at identik, urutkan berdasarkan ID numerik terbesar", () => {
      const student1 = {
        id: "usr_std_001",
        name: "Siswa 1",
        created_at: "2026-10-20T10:00:00Z",
      } as UserDataModel;

      const student10 = {
        id: "usr_std_010",
        name: "Siswa 10",
        created_at: "2026-10-20T10:00:00Z",
      } as UserDataModel;

      const list = [student1, student10].sort(compareStudentsByNewest);
      assert.strictEqual(list[0].id, "usr_std_010");
      assert.strictEqual(list[1].id, "usr_std_001");
    });
  });

  // =========================================================================
  // TASK 13: Auto-Checklist Alur Dinamis saat Melompati Langkah (Workflow Jump)
  // =========================================================================
  describe("Task 13: Auto-Checklist Alur Dinamis saat Melompati Langkah", () => {
    const orderedIds = [
      "c-1-1", // Pengumpulan Dokumen
      "c-1-2", // English Course
      "c-2-1", // Admin Fee / Service Fee 1
      "c-2-2", // Offer Letter Acceptance
      "c-2-3", // Medical Check Up
      "c-2-4", // Visa Application Submission
      "c-2-5", // Pembayaran 2
      "c-2-6", // Final Doc Visa
      "c-3-1", // Biometrics & Visa Grant
      "c-3-2", // Admin Fee / Service Fee 2
    ];

    it("Task 13.1: Mencentang item pertama hanya mengaktifkan item tersebut", () => {
      const prev: Record<string, boolean> = {};
      const next = computeWorkflowChecklistProgression(prev, "c-1-1", orderedIds);
      assert.strictEqual(next["c-1-1"], true);
      assert.strictEqual(next["c-1-2"], undefined);
    });

    it("Task 13.2: Mencentang item lanjutan (melompat) otomatis mencentang seluruh item di atasnya", () => {
      const prev: Record<string, boolean> = {
        "c-1-1": true,
        "c-1-2": true,
      };
      // Melompat langsung ke Medical Check Up (c-2-3)
      const next = computeWorkflowChecklistProgression(prev, "c-2-3", orderedIds);

      // Seluruh item di atas c-2-3 harus bernilai true
      assert.strictEqual(next["c-1-1"], true);
      assert.strictEqual(next["c-1-2"], true);
      assert.strictEqual(next["c-2-1"], true); // Admin Fee / Service Fee 1 otomatis tercentang
      assert.strictEqual(next["c-2-2"], true); // Offer Letter Acceptance otomatis tercentang
      assert.strictEqual(next["c-2-3"], true); // Item target tercentang

      // Item di bawahnya tidak boleh tercentang otomatis
      assert.strictEqual(next["c-2-4"], undefined);
      assert.strictEqual(next["c-3-1"], undefined);
    });

    it("Task 13.3: Melompat langsung ke langkah Complete (Visa Grant) mengaktifkan semua tahap sebelumnya", () => {
      const prev: Record<string, boolean> = {};
      const next = computeWorkflowChecklistProgression(prev, "c-3-1", orderedIds);

      for (let i = 0; i <= 8; i++) {
        assert.strictEqual(next[orderedIds[i]], true);
      }
      assert.strictEqual(next["c-3-2"], undefined);
    });

    it("Task 13.4: Menghilangkan centang (uncheck) membatalkan item target", () => {
      const prev: Record<string, boolean> = {
        "c-1-1": true,
        "c-1-2": true,
        "c-2-1": true,
      };
      const next = computeWorkflowChecklistProgression(prev, "c-2-1", orderedIds);
      assert.strictEqual(next["c-2-1"], false);
      assert.strictEqual(next["c-1-1"], true);
      assert.strictEqual(next["c-1-2"], true);
    });

    it("Task 13.5: Menghilangkan centang pada langkah di kategori awal otomatis membatalkan langkah setelahnya dan seluruh kategori berikutnya", () => {
      const prev: Record<string, boolean> = {
        "c-1-1": true,
        "c-1-2": true,
        "c-2-1": true,
        "c-2-2": true,
        "c-2-3": true,
        "c-3-1": true,
      };
      // User memundurkan langkah ke c-1-2 (uncheck c-1-2)
      const next = computeWorkflowChecklistProgression(prev, "c-1-2", orderedIds);
      assert.strictEqual(next["c-1-1"], true);
      assert.strictEqual(next["c-1-2"], false);
      assert.strictEqual(next["c-2-1"], false);
      assert.strictEqual(next["c-2-2"], false);
      assert.strictEqual(next["c-2-3"], false);
      assert.strictEqual(next["c-3-1"], false);
    });

    it("Task 13.6: Melompat ke langkah ke-7 lalu mundur ke langkah ke-4 menghapus langkah ke-5 ke atas secara akurat", () => {
      // User melompat ke c-2-5 (langkah ke-7 dari orderedIds)
      const stateStep7 = computeWorkflowChecklistProgression({}, "c-2-5", orderedIds);
      assert.strictEqual(stateStep7["c-2-5"], true);
      assert.strictEqual(stateStep7["c-2-4"], true);
      assert.strictEqual(stateStep7["c-2-3"], true);
      assert.strictEqual(stateStep7["c-2-2"], true);

      // User kemudian memundurkan checklist dengan uncheck c-2-3 (langkah ke-5) agar tersisa hingga langkah ke-4 (c-2-2)
      const stateStep4 = computeWorkflowChecklistProgression(stateStep7, "c-2-3", orderedIds);
      assert.strictEqual(stateStep4["c-1-1"], true);
      assert.strictEqual(stateStep4["c-1-2"], true);
      assert.strictEqual(stateStep4["c-2-1"], true);
      assert.strictEqual(stateStep4["c-2-2"], true);
      assert.strictEqual(stateStep4["c-2-3"], false);
      assert.strictEqual(stateStep4["c-2-4"], false);
      assert.strictEqual(stateStep4["c-2-5"], false);
    });
  });

  // =========================================================================
  // TASK 14: Validasi Format 24 Jam dan Tanggal Chat (formatChatMessageTime)
  // =========================================================================
  describe("Task 14: Validasi Format 24 Jam dan Tanggal Chat (formatChatMessageTime)", () => {
    it("Task 14.1: Harus memformat waktu ke 24 jam (tanpa AM/PM) dengan jam di kiri dan tanggal di kanan", () => {
      // 10 November 2026 pukul 12:25
      const date1 = new Date(2026, 10, 10, 12, 25, 0);
      const res1 = formatChatMessageTime(date1);
      assert.strictEqual(res1, "12.25 · 10 Nov");

      // Siang jam 14:05 (harus 14.05, bukan 02.05 PM)
      const date2 = new Date(2026, 10, 10, 14, 5, 0);
      const res2 = formatChatMessageTime(date2);
      assert.strictEqual(res2, "14.05 · 10 Nov");

      // Malam jam 23:59
      const date3 = new Date(2026, 10, 10, 23, 59, 0);
      const res3 = formatChatMessageTime(date3);
      assert.strictEqual(res3, "23.59 · 10 Nov");

      // Pagi jam 08:09
      const date4 = new Date(2026, 10, 10, 8, 9, 0);
      const res4 = formatChatMessageTime(date4);
      assert.strictEqual(res4, "08.09 · 10 Nov");
    });

    it("Task 14.2: Tidak boleh mengandung label AM atau PM dalam kondisi apa pun", () => {
      const pmDate = new Date(2026, 5, 15, 18, 30, 0);
      const res = formatChatMessageTime(pmDate);
      assert.strictEqual(res.includes("AM"), false);
      assert.strictEqual(res.includes("PM"), false);
      assert.strictEqual(res.includes("am"), false);
      assert.strictEqual(res.includes("pm"), false);
      assert.strictEqual(res, "18.30 · 15 Jun");
    });

    it("Task 14.3: Menangani input kosong atau tanggal tidak valid dengan aman", () => {
      assert.strictEqual(formatChatMessageTime(null), "");
      assert.strictEqual(formatChatMessageTime(undefined), "");
      assert.strictEqual(formatChatMessageTime("invalid-date-string"), "");
    });

    it("Task 14.4: formatChatTimeOnly harus menghasilkan jam 24 jam saja untuk di dalam bubble chat", () => {
      const d1 = new Date(2026, 10, 10, 12, 25, 0);
      assert.strictEqual(formatChatTimeOnly(d1), "12.25");

      const d2 = new Date(2026, 10, 10, 15, 7, 0);
      assert.strictEqual(formatChatTimeOnly(d2), "15.07");

      const d3 = new Date(2026, 10, 10, 0, 5, 0);
      assert.strictEqual(formatChatTimeOnly(d3), "00.05");

      assert.strictEqual(formatChatTimeOnly(null), "");
    });

    it("Task 14.5: isSameDay harus mendeteksi kecocokan hari kalender dengan benar", () => {
      const d1 = new Date(2026, 10, 10, 12, 0, 0);
      const d2 = new Date(2026, 10, 10, 23, 59, 0);
      const d3 = new Date(2026, 10, 11, 1, 0, 0);

      assert.strictEqual(isSameDay(d1, d2), true);
      assert.strictEqual(isSameDay(d1, d3), false);
      assert.strictEqual(isSameDay(null, d1), false);
    });

    it("Task 14.6: formatChatDateGroup harus memformat divider tanggal di atas chat ala WhatsApp", () => {
      const now = new Date();
      assert.strictEqual(formatChatDateGroup(now), "Hari Ini");

      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      assert.strictEqual(formatChatDateGroup(yesterday), "Kemarin");

      const past = new Date(2024, 0, 15);
      assert.strictEqual(formatChatDateGroup(past), "15 Januari 2024");
    });

    it("Task 14.7: isChatMessageEditable membatasi edit pesan maksimal 15 menit", () => {
      const now = Date.now();

      // Baru saja (1 menit lalu) -> boleh edit
      const oneMinuteAgo = new Date(now - 60 * 1000).toISOString();
      assert.strictEqual(isChatMessageEditable(oneMinuteAgo, 15), true);

      // 14 menit lalu -> boleh edit
      const fourteenMinutesAgo = new Date(now - 14 * 60 * 1000).toISOString();
      assert.strictEqual(isChatMessageEditable(fourteenMinutesAgo, 15), true);

      // 16 menit lalu -> tidak boleh edit
      const sixteenMinutesAgo = new Date(now - 16 * 60 * 1000).toISOString();
      assert.strictEqual(isChatMessageEditable(sixteenMinutesAgo, 15), false);

      // 1 jam lalu -> tidak boleh edit
      const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
      assert.strictEqual(isChatMessageEditable(oneHourAgo, 15), false);

      // Input null, undefined, invalid -> false
      assert.strictEqual(isChatMessageEditable(null, 15), false);
      assert.strictEqual(isChatMessageEditable(undefined, 15), false);
      assert.strictEqual(isChatMessageEditable("invalid-date", 15), false);
    });
  });

  describe("Task 15: Sinkronisasi Status Visa & Pipeline (Modal Dropdown & Badge)", () => {
    it("Task 15.1: PIPELINE_STATUS_OPTIONS harus memuat 5 status pipeline", () => {
      assert.strictEqual(PIPELINE_STATUS_OPTIONS.length, 5);
      assert.deepStrictEqual(
        PIPELINE_STATUS_OPTIONS.map((opt) => opt.value),
        [
          "On Going",
          "Waiting Visa",
          "Student Done (Grant)",
          "Post Pone",
          "Cancel (Refused)",
        ]
      );
    });

    it("Task 15.2: normalizePipelineStatusOption harus memetakan status lama dan varian string secara akurat", () => {
      assert.strictEqual(normalizePipelineStatusOption("Grant"), "Student Done (Grant)");
      assert.strictEqual(normalizePipelineStatusOption("grant"), "Student Done (Grant)");
      assert.strictEqual(normalizePipelineStatusOption("STUDENT DONE"), "Student Done (Grant)");
      assert.strictEqual(normalizePipelineStatusOption("Waiting"), "Waiting Visa");
      assert.strictEqual(normalizePipelineStatusOption("waiting_visa"), "Waiting Visa");
      assert.strictEqual(normalizePipelineStatusOption("Refused"), "Cancel (Refused)");
      assert.strictEqual(normalizePipelineStatusOption("CANCEL"), "Cancel (Refused)");
      assert.strictEqual(normalizePipelineStatusOption("POSTPONE"), "Post Pone");
      assert.strictEqual(normalizePipelineStatusOption("ON GOING"), "On Going");
      assert.strictEqual(normalizePipelineStatusOption(null), "On Going");
    });

    it("Task 15.3: getVisaStatusBadgeMeta harus menghasilkan style badge dan label yang selaras dengan pipeline", () => {
      const grantMeta = getVisaStatusBadgeMeta("Grant");
      assert.strictEqual(grantMeta.label, "Student Done (Grant)");
      assert.strictEqual(grantMeta.style.color, "#2563eb");

      const waitingMeta = getVisaStatusBadgeMeta("Waiting");
      assert.strictEqual(waitingMeta.label, "Waiting Visa");
      assert.strictEqual(waitingMeta.style.color, "#0284c7");

      const refuseMeta = getVisaStatusBadgeMeta("Refused");
      assert.strictEqual(refuseMeta.label, "Cancel (Refused)");
      assert.strictEqual(refuseMeta.style.color, "#dc2626");

      const postponeMeta = getVisaStatusBadgeMeta("Post Pone");
      assert.strictEqual(postponeMeta.label, "Post Pone");
      assert.strictEqual(postponeMeta.style.color, "#d97706");

      const ongoingMeta = getVisaStatusBadgeMeta("On Going");
      assert.strictEqual(ongoingMeta.label, "On Going");
      assert.strictEqual(ongoingMeta.style.color, "#059669");
    });
  });

  // =========================================================================
  // TASK 16: Validasi Status Centang Alur Kerja Visa Grant (isWorkflowVisaGrantChecked)
  // =========================================================================
  describe("Task 16: Proteksi Tombol Edit Visa Granted At berdasarkan Checklist Alur Kerja", () => {
    const mockWorkflow = [
      {
        id: "step-1",
        label: "Preparation",
        children: [
          { id: "c-1-1", label: "Administration Fee Payment" },
          { id: "c-1-2", label: "Offer Letter" },
        ],
      },
      {
        id: "step-2",
        label: "Progress",
        children: [
          { id: "c-2-1", label: "Document Collection" },
        ],
      },
      {
        id: "step-3",
        label: "Complete",
        children: [
          { id: "c-3-1", label: "Visa Grant" },
          { id: "c-3-2", label: "Pre-Departure Briefing" },
        ],
      },
    ];

    it("Task 16.1: Harus mengembalikan false jika tahap Visa Grant belum dicentang", () => {
      const checkedMap = {
        "c-1-1": true,
        "c-1-2": true,
        "c-2-1": true,
      };
      assert.strictEqual(isWorkflowVisaGrantChecked(mockWorkflow, checkedMap), false);
    });

    it("Task 16.2: Harus mengembalikan true jika tahap Visa Grant telah dicentang", () => {
      const checkedMap = {
        "c-1-1": true,
        "c-1-2": true,
        "c-2-1": true,
        "c-3-1": true,
      };
      assert.strictEqual(isWorkflowVisaGrantChecked(mockWorkflow, checkedMap), true);
    });

    it("Task 16.3: Harus aman dan mengembalikan false jika workflowSteps kosong atau null", () => {
      assert.strictEqual(isWorkflowVisaGrantChecked([], { "c-3-1": true }), false);
      assert.strictEqual(isWorkflowVisaGrantChecked(null as any, { "c-3-1": true }), false);
      assert.strictEqual(isWorkflowVisaGrantChecked(mockWorkflow, {}), false);
    });
  });

  // =========================================================================
  // TASK 17: Penyaringan Konsultan dan Tag Mention Catatan Internal
  // =========================================================================
  describe("Task 17: Penyaringan Konsultan dan Tag Mention Catatan Internal", () => {
    const mockUsers: UserDataModel[] = [
      { id: "1", name: "Director Boss", role: "DIRECTOR", email: "director@oss.com" },
      { id: "2", name: "Admission Kim", role: "ADMISSION", email: "admission@oss.com" },
      { id: "3", name: "Jani Antari", role: "CONSULTANT", email: "jani@oss.com" },
      { id: "4", name: "Nadia Saraswati", role: "CONSULTANT", email: "nadia@oss.com" },
      { id: "5", name: "Ayu Pratiwi", role: "CONSULTANT", email: "ayu@oss.com" },
      { id: "6", name: "Budi Santoso", role: "STUDENT", email: "budi@student.com" },
    ];

    it("Task 17.1: isMatchingConsultant mencocokkan nama konsultan persis atau sebagian", () => {
      const consultant = { name: "Jani Antari", email: "jani@oss.com" };
      assert.strictEqual(isMatchingConsultant(consultant, "Jani Antari"), true);
      assert.strictEqual(isMatchingConsultant(consultant, "jani"), true);
      assert.strictEqual(isMatchingConsultant(consultant, "JANI ANTARI"), true);
      assert.strictEqual(isMatchingConsultant(consultant, "Nadia"), false);
      assert.strictEqual(isMatchingConsultant(consultant, ""), false);
      assert.strictEqual(isMatchingConsultant(consultant, null), false);
      assert.strictEqual(isMatchingConsultant(null, "Jani"), false);
    });

    it("Task 17.2: filterInternalNotesMentionableUsers menyertakan Director, Admission, dan HANYA konsultan penanggung jawab", () => {
      const result = filterInternalNotesMentionableUsers(mockUsers, "Jani Antari");
      const names = result.map((u) => u.name);

      assert.ok(names.includes("Director Boss"));
      assert.ok(names.includes("Admission Kim"));
      assert.ok(names.includes("Jani Antari"));
      assert.ok(!names.includes("Nadia Saraswati"), "Konsultan Nadia tidak boleh muncul untuk murid Jani");
      assert.ok(!names.includes("Ayu Pratiwi"), "Konsultan Ayu tidak boleh muncul untuk murid Jani");
      assert.ok(!names.includes("Budi Santoso"), "Siswa tidak boleh muncul pada catatan internal");
      assert.strictEqual(result.length, 3);
    });

    it("Task 17.3: filterInternalNotesMentionableUsers tanpa konsultan assigned tidak membocorkan konsultan mana pun", () => {
      const result = filterInternalNotesMentionableUsers(mockUsers, null);
      const names = result.map((u) => u.name);

      assert.ok(names.includes("Director Boss"));
      assert.ok(names.includes("Admission Kim"));
      assert.ok(!names.includes("Jani Antari"));
      assert.ok(!names.includes("Nadia Saraswati"));
      assert.ok(!names.includes("Ayu Pratiwi"));
      assert.strictEqual(result.length, 2);
    });

    it("Task 17.4: Menangani input users kosong atau undefined dengan aman", () => {
      assert.deepStrictEqual(filterInternalNotesMentionableUsers(undefined, "Jani"), []);
      assert.deepStrictEqual(filterInternalNotesMentionableUsers([], "Jani"), []);
    });
  });
});
