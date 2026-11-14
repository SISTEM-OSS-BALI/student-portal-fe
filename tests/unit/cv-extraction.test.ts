import { describe, it } from "node:test";
import assert from "node:assert";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import type { UserDataModel } from "@/app/models/user";
import { extractStudentCvData } from "@/app/(view)/admission/dashboard/students-management/detail/[id]/cv/editor/utils";

describe("UNIT TESTING - CV Data Extraction & Grouping", () => {
  const mockBases = [
    { id: "qb_personal_details", name: "Personal Details" },
    { id: "qb_formal_education", name: "Formal Education" },
    { id: "qb_employment_history", name: "Employment History" },
  ];

  const mockQuestions: QuestionDataModel[] = [
    // Personal Details
    {
      id: "q_pd_01",
      base_id: "qb_personal_details",
      text: "Nama Lengkap Sesuai Paspor / KTP",
      input_type: "TEXT",
      required: true,
      order: 1,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_pd_05",
      base_id: "qb_personal_details",
      text: "Tanggal Lahir",
      input_type: "DATE",
      required: true,
      order: 5,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    // Employment History
    {
      id: "q_eh_01",
      base_id: "qb_employment_history",
      text: "Nama Perusahaan / Tempat Bekerja",
      input_type: "TEXT",
      required: true,
      order: 1,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_eh_02",
      base_id: "qb_employment_history",
      text: "Jabatan / Posisi Pekerjaan",
      input_type: "TEXT",
      required: true,
      order: 2,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_eh_03",
      base_id: "qb_employment_history",
      text: "Tipe Pekerjaan",
      input_type: "SELECT",
      required: true,
      order: 3,
      active: true,
      options: [
        {
          id: "opt_eh_03_5",
          question_id: "q_eh_03",
          label: "Pekerja Lepas (Freelance)",
          value: "FREELANCE",
          order: 5,
          active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_eh_04",
      base_id: "qb_employment_history",
      text: "Tanggal Mulai Bekerja",
      input_type: "DATE",
      required: true,
      order: 4,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_eh_05",
      base_id: "qb_employment_history",
      text: "Tanggal Selesai Bekerja",
      input_type: "DATE",
      required: false,
      order: 5,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
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
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_eh_07",
      base_id: "qb_employment_history",
      text: "Kota & Negara Perusahaan",
      input_type: "TEXT",
      required: true,
      order: 7,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_eh_08",
      base_id: "qb_employment_history",
      text: "Tugas & Tanggung Jawab Utama",
      input_type: "TEXTAREA",
      required: true,
      order: 8,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    // Formal Education
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
          id: "opt_fe_s1",
          question_id: "q_fe_01",
          label: "Sarjana (S1 / Bachelor Degree)",
          value: "S1",
          order: 1,
          active: true,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ],
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_fe_02",
      base_id: "qb_formal_education",
      text: "Nama Sekolah / Institusi / Universitas",
      input_type: "TEXT",
      required: true,
      order: 2,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_fe_03",
      base_id: "qb_formal_education",
      text: "Jurusan / Bidang Studi",
      input_type: "TEXT",
      required: true,
      order: 3,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_fe_05",
      base_id: "qb_formal_education",
      text: "Tahun Mulai",
      input_type: "NUMBER",
      required: true,
      order: 5,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "q_fe_06",
      base_id: "qb_formal_education",
      text: "Tahun Kelulusan / Selesai",
      input_type: "NUMBER",
      required: true,
      order: 6,
      active: true,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ];

  const mockStudent: UserDataModel = {
    id: "std_01",
    name: "Ade Suputra Narkawan",
    email: "ade@example.com",
    no_phone: "0895384866492",
    profile_picture_url: "https://example.com/photo.jpg",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  };

  it("kelompokkan seluruh jawaban qb_employment_history menjadi satu entri pengalaman kerja profesional", () => {
    const answers: AnswerQuestionDataModel[] = [
      {
        id: "a1",
        submission_id: "sub_eh_001",
        question_id: "q_eh_01",
        answer_text: "PT Bali Paradise Resort",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "a2",
        submission_id: "sub_eh_001",
        question_id: "q_eh_02",
        answer_text: "Waiter Daily Worker",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "a3",
        submission_id: "sub_eh_001",
        question_id: "q_eh_03",
        answer_text: "FREELANCE",
        selected_option_ids: ["opt_eh_03_5"],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "a4",
        submission_id: "sub_eh_001",
        question_id: "q_eh_04",
        answer_text: "2023-01-15",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "a5",
        submission_id: "sub_eh_001",
        question_id: "q_eh_06",
        answer_text: "YES",
        selected_option_ids: ["opt_eh_06_1"],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "a6",
        submission_id: "sub_eh_001",
        question_id: "q_eh_07",
        answer_text: "Badung, Indonesia",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "a7",
        submission_id: "sub_eh_001",
        question_id: "q_eh_08",
        answer_text: "Melayani tamu restoran, menyiapkan meja makan, dan memastikan kepuasan pelanggan.",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
    ];

    const cv = extractStudentCvData(
      mockStudent,
      answers,
      mockQuestions,
      mockBases,
    );

    // Pastikan tidak ada 7 entri pecahan
    assert.strictEqual(cv.experiences.length, 1);
    const exp = cv.experiences[0];
    assert.strictEqual(exp.company, "PT Bali Paradise Resort, Badung, Indonesia");
    assert.strictEqual(exp.job_title, "Waiter Daily Worker (Freelance)");
    assert.strictEqual(exp.start_date, "Jan 2023");
    assert.strictEqual(exp.end_date, "Present");
    assert.strictEqual(
      exp.description,
      "Melayani tamu restoran, menyiapkan meja makan, dan memastikan kepuasan pelanggan.",
    );

    // Pastikan employment_history untuk formal template juga tersusun 1 baris
    assert.strictEqual(cv.employment_history?.length, 1);
    const emp = cv.employment_history[0];
    assert.strictEqual(emp.company, "PT Bali Paradise Resort");
    assert.strictEqual(emp.position, "Waiter Daily Worker");
    assert.strictEqual(emp.type, "Freelance");
    assert.strictEqual(emp.from_date, "Jan 2023");
    assert.strictEqual(emp.to_date, "Present");
  });

  it("kelompokkan pendidikan formal menjadi satu entri edukasi yang utuh", () => {
    const answers: AnswerQuestionDataModel[] = [
      {
        id: "edu1",
        submission_id: "sub_edu_001",
        question_id: "q_fe_01",
        answer_text: "S1",
        selected_option_ids: ["opt_fe_s1"],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "edu2",
        submission_id: "sub_edu_001",
        question_id: "q_fe_02",
        answer_text: "Universitas Udayana",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "edu3",
        submission_id: "sub_edu_001",
        question_id: "q_fe_03",
        answer_text: "Teknologi Informasi",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "edu4",
        submission_id: "sub_edu_001",
        question_id: "q_fe_05",
        answer_text: "2019",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
      {
        id: "edu5",
        submission_id: "sub_edu_001",
        question_id: "q_fe_06",
        answer_text: "2023",
        selected_option_ids: [],
        created_at: "2024-01-01T10:00:00Z",
      },
    ];

    const cv = extractStudentCvData(
      mockStudent,
      answers,
      mockQuestions,
      mockBases,
    );

    assert.strictEqual(cv.educations.length, 1);
    const edu = cv.educations[0];
    assert.strictEqual(edu.school_name, "Universitas Udayana");
    assert.strictEqual(edu.degree, "Sarjana (S1 / Bachelor Degree)");
    assert.strictEqual(edu.major, "Teknologi Informasi");
    assert.strictEqual(edu.start_date, "2019");
    assert.strictEqual(edu.end_date, "2023");
  });

  it("ekstraksi data diri lengkap, alamat, kode pos, tinggi, berat, dan hitung umur otomatis dari tanggal lahir", () => {
    const extraQuestions: QuestionDataModel[] = [
      ...mockQuestions,
      {
        id: "q_pd_04",
        base_id: "qb_personal_details",
        text: "Tempat Lahir",
        input_type: "TEXT",
        required: true,
        order: 4,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_13",
        base_id: "qb_personal_details",
        text: "Alamat Domisili Lengkap Saat Ini",
        input_type: "TEXTAREA",
        required: true,
        order: 13,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_08",
        base_id: "qb_personal_details",
        text: "Nomor Paspor",
        input_type: "TEXT",
        required: false,
        order: 8,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_14",
        base_id: "qb_personal_details",
        text: "Kota Domisili",
        input_type: "TEXT",
        required: true,
        order: 14,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_15",
        base_id: "qb_personal_details",
        text: "Provinsi / Wilayah",
        input_type: "TEXT",
        required: true,
        order: 15,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_16",
        base_id: "qb_personal_details",
        text: "Kode Pos",
        input_type: "TEXT",
        required: true,
        order: 16,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_17",
        base_id: "qb_personal_details",
        text: "Tinggi Badan (cm)",
        input_type: "NUMBER",
        required: false,
        order: 17,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_18",
        base_id: "qb_personal_details",
        text: "Berat Badan (kg)",
        input_type: "NUMBER",
        required: false,
        order: 18,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    const answers: AnswerQuestionDataModel[] = [
      {
        id: "ans_1",
        question_id: "q_pd_01",
        answer_text: "Ade Suputra Narkawan",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_4",
        question_id: "q_pd_04",
        answer_text: "Karangasem",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_5",
        question_id: "q_pd_05",
        answer_text: "2002-06-26",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_8",
        question_id: "q_pd_08",
        answer_text: "A91827364",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_13",
        question_id: "q_pd_13",
        answer_text: "Br. Dawas, Gang Bima, No. 3",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_14",
        question_id: "q_pd_14",
        answer_text: "Badung",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_15",
        question_id: "q_pd_15",
        answer_text: "Bali",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_16",
        question_id: "q_pd_16",
        answer_text: "80361",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_17",
        question_id: "q_pd_17",
        answer_text: "173",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_18",
        question_id: "q_pd_18",
        answer_text: "80",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    const cv = extractStudentCvData(
      mockStudent,
      answers,
      extraQuestions,
      mockBases,
    );

    assert.strictEqual(cv.first_name, "Ade Suputra");
    assert.strictEqual(cv.last_name, "Narkawan");
    assert.strictEqual(cv.place_of_birth, "Karangasem");
    assert.strictEqual(cv.city, "Badung");
    assert.strictEqual(cv.province_state, "Bali");
    assert.strictEqual(cv.postal_code, "80361");
    assert.strictEqual(cv.passport_number, "A91827364");
    assert.strictEqual(cv.height, "173");
    assert.strictEqual(cv.weight, "80");
    assert.ok(cv.age && parseInt(cv.age, 10) > 0, "Umur harus terhitung otomatis dari tanggal lahir");
  });

  it("ekstraksi nonformal education dengan opsi Present saat kursus masih berjalan", () => {
    const nfeBases = [
      ...mockBases,
      { id: "qb_nonformal_education", name: "Nonformal Education" },
    ];

    const nfeQuestions: QuestionDataModel[] = [
      ...mockQuestions,
      {
        id: "q_nfe_01",
        base_id: "qb_nonformal_education",
        text: "Nama Pelatihan atau Sertifikasi",
        input_type: "TEXT",
        required: true,
        order: 1,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_nfe_02",
        base_id: "qb_nonformal_education",
        text: "Lembaga Penyelenggara",
        input_type: "TEXT",
        required: true,
        order: 2,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_nfe_03",
        base_id: "qb_nonformal_education",
        text: "Tanggal Mulai",
        input_type: "DATE",
        required: true,
        order: 3,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_nfe_04",
        base_id: "qb_nonformal_education",
        text: "Tanggal Selesai",
        input_type: "DATE",
        required: false,
        order: 4,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
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
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
          {
            id: "opt_nfe_07_2",
            question_id: "q_nfe_07",
            label: "Tidak (Sudah selesai)",
            value: "NO",
            order: 2,
            active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    const answers: AnswerQuestionDataModel[] = [
      {
        id: "ans_nfe_1",
        submission_id: "sub_nfe_01",
        question_id: "q_nfe_01",
        answer_text: "English Course",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_nfe_2",
        submission_id: "sub_nfe_01",
        question_id: "q_nfe_02",
        answer_text: "Jolly Roger Education",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_nfe_3",
        submission_id: "sub_nfe_01",
        question_id: "q_nfe_03",
        answer_text: "2024-01-15",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_nfe_7",
        submission_id: "sub_nfe_01",
        question_id: "q_nfe_07",
        answer_text: "YES",
        selected_option_ids: ["opt_nfe_07_1"],
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    const cv = extractStudentCvData(mockStudent, answers, nfeQuestions, nfeBases);

    assert.ok(cv.nonformal_educations);
    assert.strictEqual(cv.nonformal_educations.length, 1);
    assert.strictEqual(cv.nonformal_educations[0].level, "English Course");
    assert.strictEqual(cv.nonformal_educations[0].school, "Jolly Roger Education");
    assert.strictEqual(cv.nonformal_educations[0].commence, "2024");
    assert.strictEqual(cv.nonformal_educations[0].completed, "Present");

    assert.ok(cv.activities);
    assert.strictEqual(cv.activities.length, 1);
    assert.strictEqual(cv.activities[0].name, "English Course");
    assert.strictEqual(cv.activities[0].start_date, "2024");
    assert.strictEqual(cv.activities[0].end_date, "Present");
  });

  it("Mengekstrak jawaban q_pd_19 (Ringkasan Profil Profesional) ke dalam cv.profile_description", () => {
    const pdQuestionsWithSummary: QuestionDataModel[] = [
      {
        id: "q_pd_01",
        base_id: "qb_personal_details",
        text: "Nama Lengkap Sesuai Identitas",
        input_type: "TEXT",
        required: true,
        order: 1,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "q_pd_19",
        base_id: "qb_personal_details",
        text: "Ringkasan Profil Profesional",
        input_type: "TEXTAREA",
        required: false,
        order: 19,
        active: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];

    const answers = [
      {
        id: "ans_pd_1",
        question_id: "q_pd_01",
        answer_text: "Putu Arya Pratama",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ans_pd_19",
        question_id: "q_pd_19",
        answer_text: "Ambitious hospitality professional with 3+ years experience in customer service and operational excellence.",
        selected_option_ids: [],
        created_at: "2024-01-01T00:00:00Z",
      },
    ];

    const cv = extractStudentCvData(
      mockStudent,
      answers,
      pdQuestionsWithSummary,
      [{ id: "qb_personal_details", name: "Personal Details" }],
    );

    assert.strictEqual(
      cv.profile_description,
      "Ambitious hospitality professional with 3+ years experience in customer service and operational excellence.",
    );
  });
});
