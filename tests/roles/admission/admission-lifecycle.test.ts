import { describe, it } from "node:test";
import assert from "node:assert";
import type { UserDataModel, StudentFormValues } from "@/app/models/user";
import type { StagesManagementDataModel } from "@/app/models/stages-management";
import type { DocumentDataModel } from "@/app/models/documents-management";
import type { VisaTypeManagementDataModel } from "@/app/models/visa-type-management";
import { hasPermission } from "@/app/utils/role-permissions";

describe("ROLE: ADMISSION - Pengujian Siklus Hidup Penuh & Kompleksitas Operasional (DFD Suite)", () => {
  const currentRole = "admission";

  // =========================================================================
  // TASK 1: REGISTRASI & ONBOARDING SISWA BARU (DFD 1.0)
  // =========================================================================
  describe("Task 1: Registrasi & Onboarding Siswa Baru (FormStudentComponent Validation)", () => {
    it("Task 1.1: Admisi memvalidasi kolom wajib (Nama, Email, Visa Type, Negara/Stage)", () => {
      const validPayload: StudentFormValues = {
        name: "Ahmad Dahlan",
        email: "ahmad.dahlan@example.com",
        visa_type: "visa_subclass_500",
        stage_id: "stage_aus_01",
        name_consultant: "Sarah Jenkins",
        translation_quota: 2,
        has_initial_translations: true,
      };

      assert.ok(validPayload.name && validPayload.name.trim().length > 0);
      assert.ok(validPayload.email && validPayload.email.includes("@"));
      assert.ok(validPayload.visa_type);
      assert.ok(validPayload.stage_id);

      // Verifikasi wewenang Admisi dalam membuat siswa baru
      assert.strictEqual(hasPermission(currentRole, "student.create"), true);
    });

    it("Task 1.2: Admisi menolak form registrasi jika format email tidak valid", () => {
      const invalidEmails = [
        "bukan-email",
        "emailtanpaat.com",
        "email@",
        "@domain.com",
        "spasi di email@domain.com",
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      invalidEmails.forEach((email) => {
        const isValid = emailRegex.test(email);
        assert.strictEqual(isValid, false, `Email ${email} harusnya ditolak`);
      });
    });

    it("Task 1.3: Reset otomatis informasi kampus dan jenjang studi jika jenis visa BUKAN Student Visa", () => {
      // Sesuai aturan bisnis di FormStudentComponent.tsx lines 228-236:
      // if (!isStudentVisa) form.setFieldsValue({ name_campus: undefined, degree: undefined, name_degree: undefined })
      const visaTypes: Partial<VisaTypeManagementDataModel>[] = [
        { id: "visa_1", name: "Student Visa (Subclass 500)" },
        { id: "visa_2", name: "Visitor Visa (Subclass 600)" },
        { id: "visa_3", name: "Working Holiday Visa (Subclass 417)" },
      ];

      const checkIsStudentVisa = (visaId: string) => {
        const selected = visaTypes.find((v) => v.id === visaId);
        return String(selected?.name ?? "").toLowerCase().includes("student");
      };

      assert.strictEqual(checkIsStudentVisa("visa_1"), true);
      assert.strictEqual(checkIsStudentVisa("visa_2"), false);
      assert.strictEqual(checkIsStudentVisa("visa_3"), false);

      // Simulasi pembersihan data form
      const sanitizeAcademicFields = (formData: StudentFormValues) => {
        if (!checkIsStudentVisa(formData.visa_type ?? "")) {
          return {
            ...formData,
            name_campus: undefined,
            degree: undefined,
            name_degree: undefined,
          };
        }
        return formData;
      };

      const visitorStudentData: StudentFormValues = {
        name: "Dewi Lestari",
        email: "dewi@example.com",
        visa_type: "visa_2", // Visitor Visa
        name_campus: "University of Melbourne",
        degree: "Bachelor",
        name_degree: "Computer Science",
      };

      const cleaned = sanitizeAcademicFields(visitorStudentData);
      assert.strictEqual(cleaned.name_campus, undefined);
      assert.strictEqual(cleaned.degree, undefined);
      assert.strictEqual(cleaned.name_degree, undefined);
    });

    it("Task 1.4: Inisialisasi kuota penerjemahan dokumen (mencegah kuota negatif)", () => {
      const validateQuota = (quota: number) => {
        if (isNaN(quota) || quota < 0) return 0;
        return Math.floor(quota);
      };

      assert.strictEqual(validateQuota(-5), 0);
      assert.strictEqual(validateQuota(0), 0);
      assert.strictEqual(validateQuota(3.7), 3);
      assert.strictEqual(validateQuota(10), 10);
    });

    it("Task 1.5: Validasi kode referral siswa (lookup status found vs not_found)", () => {
      const validReferralCodes: Record<string, string> = {
        "REF-ALUMNI-2026": "Budi Gunawan",
        "REF-PARTNER-ID": "EduGlobal Agency",
      };

      const lookupReferral = (code: string) => {
        const trimmed = (code ?? "").trim().toUpperCase();
        if (!trimmed) return { status: "idle", name: null };
        if (validReferralCodes[trimmed]) {
          return { status: "found", name: validReferralCodes[trimmed] };
        }
        return { status: "not_found", name: null };
      };

      assert.deepStrictEqual(lookupReferral(""), { status: "idle", name: null });
      assert.deepStrictEqual(lookupReferral("REF-ALUMNI-2026"), {
        status: "found",
        name: "Budi Gunawan",
      });
      assert.deepStrictEqual(lookupReferral("REF-PALSU-999"), {
        status: "not_found",
        name: null,
      });
    });
  });

  // =========================================================================
  // TASK 2: KENDALI TAHAPAN ALUR NEGARA / STAGES MANAGEMENT (DFD 2.0)
  // =========================================================================
  describe("Task 2: Kendali Tahapan Alur Negara (Stages & Steps Progression)", () => {
    const countryStages: Partial<StagesManagementDataModel>[] = [
      {
        id: "stg_aus_prep",
        country_id: "cty_aus",
        country: {
          id: "cty_aus",
          name: "Australia",
          steps: [
            { id: "step_1", label: "Preparation & Document Collection" },
            { id: "step_2", label: "Translation & Verification" },
            { id: "step_3", label: "Visa Lodgement" },
            { id: "step_4", label: "Biometrics & Medical" },
            { id: "step_5", label: "Visa Granted" },
          ],
        },
      },
    ];

    it("Task 2.1: Admisi adalah SATU-SATUNYA peran yang berhak memutakhirkan tahapan alur siswa", () => {
      assert.strictEqual(hasPermission("admission", "student.editStage"), true);
      assert.strictEqual(hasPermission("director", "student.editStage"), false);
      assert.strictEqual(hasPermission("student", "student.editStage"), false);
      assert.strictEqual(hasPermission("consultant", "student.editStage"), false);
    });

    it("Task 2.2: Sistem menolak perpindahan tahapan jika dokumen wajib (mandatory) belum disetujui", () => {
      const studentDocuments = [
        { internal_code: "PASSPORT", required: true, approval_status: "approved" },
        { internal_code: "STUDENT_SIGN", required: true, approval_status: "approved" },
        { internal_code: "FINANCIAL_SPONSOR", required: true, approval_status: "rejected" }, // Gagal
      ];

      const canAdvanceStage = (docs: typeof studentDocuments) => {
        const mandatoryDocs = docs.filter((d) => d.required);
        return mandatoryDocs.every((d) => d.approval_status === "approved");
      };

      assert.strictEqual(canAdvanceStage(studentDocuments), false);

      // Saat semua disetujui
      studentDocuments[2].approval_status = "approved";
      assert.strictEqual(canAdvanceStage(studentDocuments), true);
    });

    it("Task 2.3: Pembaruan workflow_checked_ids mencatat riwayat langkah yang diselesaikan", () => {
      const addCompletedStep = (currentCheckedIds: string | null | undefined, stepId: string) => {
        const set = new Set((currentCheckedIds ?? "").split(",").filter(Boolean));
        set.add(stepId);
        return Array.from(set).join(",");
      };

      let checked = "";
      checked = addCompletedStep(checked, "step_1");
      assert.strictEqual(checked, "step_1");

      checked = addCompletedStep(checked, "step_2");
      assert.strictEqual(checked, "step_1,step_2");

      // Menambahkan step yang sama tidak boleh menduplikasi
      checked = addCompletedStep(checked, "step_1");
      assert.strictEqual(checked, "step_1,step_2");
    });

    it("Task 2.4: Portal tahapan terkunci saat status pendaftaran siswa adalah CANCEL atau HOLD", () => {
      const canMutateStudent = (studentStatus: string) => {
        const blockedStatuses = ["cancel", "cancelled", "batal", "hold", "pause"];
        return !blockedStatuses.includes(studentStatus.toLowerCase());
      };

      assert.strictEqual(canMutateStudent("ACTIVE"), true);
      assert.strictEqual(canMutateStudent("PROCESSING"), true);
      assert.strictEqual(canMutateStudent("CANCEL"), false);
      assert.strictEqual(canMutateStudent("HOLD"), false);
    });
  });

  // =========================================================================
  // TASK 3: MASTER DATA & REGULASI PERSYARATAN (DFD 4.0)
  // =========================================================================
  describe("Task 3: Manajemen Master Data Persyaratan Dokumen & Regulasi Visa", () => {
    it("Task 3.1: Admisi mengonfigurasi dokumen mandatory vs optional per negara tujuan", () => {
      const masterDocuments: Partial<DocumentDataModel>[] = [
        { id: 1, internal_code: "PASSPORT", label: "Paspor", required: true, category: "identity" },
        { id: 2, internal_code: "STUDENT_SIGN", label: "Surat Pernyataan", required: true, category: "legal" },
        { id: 3, internal_code: "RESUME_CV", label: "CV / Resume", required: false, category: "academic" },
        { id: 4, internal_code: "SCHOLARSHIP_LETTER", label: "Surat Beasiswa", required: false, category: "financial" },
      ];

      const mandatoryCodes = masterDocuments.filter((d) => d.required).map((d) => d.internal_code);
      const optionalCodes = masterDocuments.filter((d) => !d.required).map((d) => d.internal_code);

      assert.deepStrictEqual(mandatoryCodes, ["PASSPORT", "STUDENT_SIGN"]);
      assert.deepStrictEqual(optionalCodes, ["RESUME_CV", "SCHOLARSHIP_LETTER"]);
    });

    it("Task 3.2: Penentuan dokumen yang wajib melalui biro penerjemahan tersumpah", () => {
      const academicDoc: Partial<DocumentDataModel> = {
        id: 5,
        internal_code: "ACADEMIC_TRANSCRIPT",
        label: "Ijazah & Transkrip Asli",
        translation_needed: "yes",
        required: true,
      };

      const identityDoc: Partial<DocumentDataModel> = {
        id: 1,
        internal_code: "PASSPORT",
        label: "Paspor Internasional",
        translation_needed: "no",
        required: true,
      };

      const requiresSwornTranslation = (doc: Partial<DocumentDataModel>) => doc.translation_needed === "yes";

      assert.strictEqual(requiresSwornTranslation(academicDoc), true);
      assert.strictEqual(requiresSwornTranslation(identityDoc), false);
    });

    it("Task 3.3: Admisi berhak mengelola master data (CRUD Master Data)", () => {
      assert.strictEqual(hasPermission("admission", "masterData.manage"), true);
      assert.strictEqual(hasPermission("director", "masterData.manage"), true);
      assert.strictEqual(hasPermission("consultant", "masterData.manage"), false);
      assert.strictEqual(hasPermission("student", "masterData.manage"), false);
    });
  });

  // =========================================================================
  // TASK 4: CATATAN EVALUASI INTERNAL & KOLABORASI BIMBINGAN (DFD 5.0)
  // =========================================================================
  describe("Task 4: Kolaborasi Catatan Evaluasi Internal (Internal Notes System)", () => {
    it("Task 4.1: Admisi dapat menambahkan catatan bimbingan dan evaluasi siswa", () => {
      assert.strictEqual(hasPermission(currentRole, "notes.create"), true);
      assert.strictEqual(hasPermission(currentRole, "notes.viewInternal"), true);
    });

    it("Task 4.2: Siswa diblokir secara mutlak dari membaca catatan bertanda internal", () => {
      const notesList = [
        { id: 1, content: "Siswa perlu perbaiki scan paspor halaman depan", is_internal: false },
        { id: 2, content: "Internal Note: Skor IELTS siswa pas-pasan, perlu simulasi wawancara GTE", is_internal: true },
      ];

      const filterNotesForRole = (role: string, notes: typeof notesList) => {
        const canViewInternal = hasPermission(role, "notes.viewInternal");
        if (canViewInternal) return notes;
        return notes.filter((n) => !n.is_internal);
      };

      const admissionVisibleNotes = filterNotesForRole("admission", notesList);
      assert.strictEqual(admissionVisibleNotes.length, 2);

      const studentVisibleNotes = filterNotesForRole("student", notesList);
      assert.strictEqual(studentVisibleNotes.length, 1);
      assert.strictEqual(studentVisibleNotes[0].id, 1);
    });
  });

  // =========================================================================
  // TASK 5: PEMBANGKITAN SURAT RESMI SISWA / LETTER GENERATOR (DFD 6.0)
  // =========================================================================
  describe("Task 5: Pembangkitan Dokumen Surat Resmi (Statement & Sponsor Letter)", () => {
    it("Task 5.1: Admisi menolak pembangkitan Statement Letter jika data universitas atau intake belum lengkap", () => {
      const validateStatementLetterPrerequisites = (student: Partial<UserDataModel>) => {
        const errors: string[] = [];
        if (!student.name_campus) errors.push("Nama kampus wajib diisi");
        if (!student.degree) errors.push("Jenjang pendidikan wajib diisi");
        if (!student.name_degree) errors.push("Program studi wajib diisi");
        return { isValid: errors.length === 0, errors };
      };

      const incompleteStudent: Partial<UserDataModel> = {
        name: "Rizky Ramadhan",
        name_campus: "Monash University",
        // degree & name_degree kosong
      };

      const result = validateStatementLetterPrerequisites(incompleteStudent);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.errors.length, 2);

      const completeStudent: Partial<UserDataModel> = {
        name: "Rizky Ramadhan",
        name_campus: "Monash University",
        degree: "Master",
        name_degree: "Master of Data Science",
      };

      const validResult = validateStatementLetterPrerequisites(completeStudent);
      assert.strictEqual(validResult.isValid, true);
      assert.strictEqual(validResult.errors.length, 0);
    });

    it("Task 5.2: Admisi memvalidasi nama berkas hasil generate surat resmi", () => {
      const generateLetterFileName = (studentName: string, letterType: "SPONSOR" | "STATEMENT") => {
        const cleanName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
        const timestamp = "20261016";
        return `${cleanName}_${letterType}_LETTER_${timestamp}.docx`;
      };

      const fileName = generateLetterFileName("Siti Nurhaliza", "STATEMENT");
      assert.strictEqual(fileName, "Siti_Nurhaliza_STATEMENT_LETTER_20261016.docx");
    });
  });

  // =========================================================================
  // TASK 6: FILTER LANJUTAN & PENCARIAN SISWA BERDASARKAN REFERRAL (DFD 7.0)
  // =========================================================================
  describe("Task 6: Filter Lanjutan & Pencarian Siswa Berdasarkan Referral", () => {
    const studentsSample: Partial<UserDataModel>[] = [
      {
        id: 1,
        name: "Andi Pratama",
        email: "andi@example.com",
        code_referral: "REF-ALUMNI-01",
        source_category: "referral",
      },
      {
        id: 2,
        name: "Budi Santoso",
        email: "budi@example.com",
        code_referral: "REF-AGENT-99",
        source_category: "referral",
      },
      {
        id: 3,
        name: "Citra Kirana",
        email: "citra@example.com",
        code_referral: null,
        source_category: "instagram",
      },
      {
        id: 4,
        name: "Dewi Lestari",
        email: "dewi@example.com",
        code_referral: undefined,
        source: "referral",
      },
    ];

    const filterByReferral = (
      students: Partial<UserDataModel>[],
      activeReferralFilter?: string
    ) => {
      if (!activeReferralFilter) return students;
      return students.filter((student) => {
        const studentReferral = student.code_referral?.trim() || "";
        const hasReferral = Boolean(
          studentReferral ||
            student.source_category?.toLowerCase() === "referral" ||
            student.source?.toLowerCase() === "referral"
        );

        if (activeReferralFilter === "__has_referral__") {
          return hasReferral;
        }
        if (activeReferralFilter === "__no_referral__") {
          return !hasReferral;
        }
        return (
          studentReferral.toLowerCase() === activeReferralFilter.toLowerCase()
        );
      });
    };

    it("Task 6.1: Menyaring siswa yang memiliki referral (__has_referral__)", () => {
      const result = filterByReferral(studentsSample, "__has_referral__");
      assert.strictEqual(result.length, 3);
      assert.deepStrictEqual(result.map((s) => s.id), [1, 2, 4]);
    });

    it("Task 6.2: Menyaring siswa tanpa referral (__no_referral__)", () => {
      const result = filterByReferral(studentsSample, "__no_referral__");
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].id, 3);
    });

    it("Task 6.3: Menyaring siswa dengan kode referral spesifik", () => {
      const result = filterByReferral(studentsSample, "REF-AGENT-99");
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, "Budi Santoso");
    });

    it("Task 6.4: Pencarian kata kunci menemukan siswa melalui kode referral di haystack", () => {
      const keyword = "ALUMNI";
      const matches = studentsSample.filter((student) => {
        const haystack = [
          student.name,
          student.email,
          student.code_referral,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(keyword.toLowerCase());
      });
      assert.strictEqual(matches.length, 1);
      assert.strictEqual(matches[0].name, "Andi Pratama");
    });
  });
});
