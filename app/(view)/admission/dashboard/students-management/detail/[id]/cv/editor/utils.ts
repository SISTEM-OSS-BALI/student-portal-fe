import dayjs from "dayjs";
import type { UserDataModel } from "@/app/models/user";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import {
  getAnswerDisplayText,
  groupSubmissionsForBase,
  isStillWorkingValue,
  resolveOptionIdOrValueToLabel,
} from "@/app/utils/personal-info-submissions";
import type {
  CvAchievement,
  CvActivity,
  CvData,
  CvEducation,
  CvEmploymentHistory,
  CvExperience,
  CvFormalEducation,
  CvInterest,
  CvLanguage,
  CvLeadership,
  CvNextOfKin,
  CvNonformalEducation,
  CvSkill,
  CvTravelHistory,
} from "./types";

export function extractStudentCvData(
  student?: UserDataModel | null,
  answers?: AnswerQuestionDataModel[] | null,
  questions?: QuestionDataModel[] | null,
  questionBases?: Array<{ id: string | number; name?: string }> | null,
): CvData {
  const fullName = (student?.name || "").trim();
  const nameParts = fullName ? fullName.split(/\s+/) : ["Student"];
  let firstName = nameParts[0] || "Student";
  let lastName = nameParts.slice(1).join(" ") || "";
  let email = student?.email || "student@example.com";
  let phone = student?.no_phone || "+62 812-3456-7890";
  let city = student?.stage?.country?.name || "Indonesia";
  let studentJobTitle =
    student?.degree || student?.name_degree || "";
  const currentCountry = "Indonesia";
  let profileDescription = "";

  // Maps for quick lookup
  const questionMap = new Map<string, QuestionDataModel>();
  (questions ?? []).forEach((q) => {
    questionMap.set(String(q.id), q);
  });

  const baseMap = new Map<string, string>();
  (questionBases ?? []).forEach((b) => {
    baseMap.set(String(b.id), (b.name ?? "").toLowerCase());
  });

  // Categorize questions into bases
  const pdQuestions: QuestionDataModel[] = [];
  const formalEduQuestions: QuestionDataModel[] = [];
  const nonformalEduQuestions: QuestionDataModel[] = [];
  const employmentQuestions: QuestionDataModel[] = [];
  const achievementQuestions: QuestionDataModel[] = [];
  const travelQuestions: QuestionDataModel[] = [];
  const kinQuestions: QuestionDataModel[] = [];
  const otherQuestions: QuestionDataModel[] = [];

  (questions ?? []).forEach((q) => {
    const baseId = String(q.base_id || "");
    const baseName = (baseMap.get(baseId) || "").toLowerCase();
    const qId = String(q.id).toLowerCase();

    if (
      baseId === "qb_personal_details" ||
      qId.startsWith("q_pd_") ||
      baseName.includes("personal") ||
      baseName.includes("pribadi")
    ) {
      pdQuestions.push(q);
    } else if (
      baseId === "qb_nonformal_education" ||
      qId.startsWith("q_nfe_") ||
      baseName.includes("nonformal") ||
      baseName.includes("kursus") ||
      baseName.includes("pelatihan")
    ) {
      nonformalEduQuestions.push(q);
    } else if (
      baseId === "qb_formal_education" ||
      qId.startsWith("q_fe_") ||
      (baseName.includes("formal") && !baseName.includes("non")) ||
      (baseName.includes("pendidikan") && !baseName.includes("non"))
    ) {
      formalEduQuestions.push(q);
    } else if (
      baseId === "qb_employment_history" ||
      qId.startsWith("q_eh_") ||
      baseName.includes("employment") ||
      baseName.includes("kerja") ||
      baseName.includes("pengalaman")
    ) {
      employmentQuestions.push(q);
    } else if (
      baseId === "qb_achievement" ||
      qId.startsWith("q_ac_") ||
      baseName.includes("achievement") ||
      baseName.includes("prestasi") ||
      baseName.includes("penghargaan")
    ) {
      achievementQuestions.push(q);
    } else if (
      baseId === "qb_travel_history" ||
      qId.startsWith("q_th_") ||
      baseName.includes("travel") ||
      baseName.includes("perjalanan")
    ) {
      travelQuestions.push(q);
    } else if (
      baseId === "qb_next_of_kin" ||
      qId.startsWith("q_nok_") ||
      baseName.includes("kin") ||
      baseName.includes("orang tua") ||
      baseName.includes("wali")
    ) {
      kinQuestions.push(q);
    } else {
      otherQuestions.push(q);
    }
  });

  const allAnswers = answers ?? [];

  // ================= 1. PERSONAL DETAILS =================
  let dateOfBirth = "";
  let placeOfBirth = "";
  let age = "";
  let nationality = "Indonesian";
  let gender = "";
  let maritalStatus = "Single";
  let height = "";
  let weight = "";
  let idNumber = "";
  let passportNumber = "";
  let provinceState = "";
  let postalCode = "";

  pdQuestions.forEach((q) => {
    const ans = allAnswers.find((a) => String(a.question_id) === String(q.id));
    if (!ans) return;
    const val = getAnswerDisplayText(q, ans).trim();
    if (!val) return;
    const qId = String(q.id).toLowerCase();
    const qText = (q.text || "").toLowerCase();

    if (qId === "q_pd_01" || qText.includes("nama lengkap")) {
      const parts = val.split(/\s+/);
      if (parts.length === 1) {
        firstName = parts[0] || firstName;
      } else {
        firstName = parts.slice(0, parts.length - 1).join(" ") || firstName;
        lastName = parts[parts.length - 1] || lastName;
      }
    } else if (
      qId === "q_pd_first_name" ||
      qText.includes("nama depan") ||
      qText.includes("first name")
    ) {
      firstName = val;
    } else if (
      qId === "q_pd_last_name" ||
      qText.includes("nama belakang") ||
      qText.includes("last name") ||
      qText.includes("surname")
    ) {
      lastName = val;
    } else if (
      qId === "q_pd_03" ||
      qText.includes("jenis kelamin") ||
      qText.includes("gender")
    ) {
      gender = resolveOptionIdOrValueToLabel(val) || val;
    } else if (
      qId === "q_pd_04" ||
      qText.includes("tempat lahir") ||
      qText.includes("place of birth")
    ) {
      placeOfBirth = val;
    } else if (
      qId === "q_pd_05" ||
      qText.includes("tanggal lahir") ||
      qText.includes("birth")
    ) {
      dateOfBirth = val;
      const dob = dayjs(ans.answer_text || val);
      if (dob.isValid()) {
        const diff = dayjs().diff(dob, "year");
        if (diff > 0 && diff < 120) {
          age = String(diff);
        }
      }
    } else if (
      qId === "q_pd_06" ||
      qText.includes("kewarganegaraan") ||
      qText.includes("nationality")
    ) {
      nationality = resolveOptionIdOrValueToLabel(val) || val;
    } else if (
      qId === "q_pd_07" ||
      qText.includes("nik") ||
      qText.includes("ktp")
    ) {
      idNumber = val;
    } else if (
      qId === "q_pd_08" ||
      ((qText.includes("paspor") || qText.includes("passport")) &&
        !qText.includes("kadaluarsa") &&
        !qText.includes("expiry") &&
        !qText.includes("berlaku"))
    ) {
      passportNumber = val;
    } else if (
      qId === "q_pd_10" ||
      qText.includes("pernikahan") ||
      qText.includes("marital")
    ) {
      maritalStatus = resolveOptionIdOrValueToLabel(val) || val;
    } else if (
      qId === "q_pd_12" ||
      qText.includes("telepon") ||
      qText.includes("whatsapp")
    ) {
      phone = val;
    } else if (
      qId === "q_pd_14" ||
      qText.includes("kota domisili") ||
      qText === "kota" ||
      qText.includes("city")
    ) {
      city = val;
    } else if (
      qId === "q_pd_15" ||
      qText.includes("provinsi") ||
      qText.includes("province") ||
      qText.includes("state")
    ) {
      provinceState = val;
    } else if (
      qId === "q_pd_16" ||
      qText.includes("kode pos") ||
      qText.includes("postal code") ||
      qText.includes("zip")
    ) {
      postalCode = val;
    } else if (
      qId === "q_pd_17" ||
      qText.includes("tinggi badan") ||
      qText.includes("height")
    ) {
      height = val.replace(/[^0-9]/g, "") || val;
    } else if (
      qId === "q_pd_18" ||
      qText.includes("berat badan") ||
      qText.includes("weight")
    ) {
      weight = val.replace(/[^0-9]/g, "") || val;
    } else if (
      qId === "q_pd_19" ||
      qText.includes("ringkasan profil") ||
      qText.includes("profile summary") ||
      qText.includes("deskripsi diri")
    ) {
      if (!profileDescription) {
        profileDescription = val;
      }
    } else if (qId === "q_pd_13" || qText.includes("alamat")) {
      if (!postalCode) {
        const postalMatch = val.match(/\b\d{5}\b/);
        if (postalMatch) {
          postalCode = postalMatch[0];
        }
      }
      if (!city || city === "Indonesia") {
        const chunks = val
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (chunks.length > 2) {
          city = chunks[chunks.length - 3] || chunks[chunks.length - 2] || city;
          if (!provinceState) {
            provinceState = chunks[chunks.length - 2] || "";
          }
        } else if (chunks.length > 1) {
          city = chunks[chunks.length - 2] || chunks[0] || city;
        }
      }
    }
  });

  // ================= 2. EMPLOYMENT HISTORY (GROUPED BY SUBMISSION) =================
  const experiences: CvExperience[] = [];
  const employmentHistory: CvEmploymentHistory[] = [];

  const employmentSubmissions = groupSubmissionsForBase(
    employmentQuestions,
    allAnswers,
  );

  employmentSubmissions.forEach((sub) => {
    const findVal = (
      predicate: (q: QuestionDataModel) => boolean,
    ): string => {
      for (const q of employmentQuestions) {
        if (predicate(q)) {
          const ans = sub.answersMap.get(String(q.id));
          if (ans) {
            const val = getAnswerDisplayText(q, ans).trim();
            if (val) return val;
          }
        }
      }
      return "";
    };

    const company = findVal(
      (q) =>
        q.id === "q_eh_01" ||
        /perusahaan|tempat bekerja|company|instansi/i.test(q.text),
    );
    const position = findVal(
      (q) =>
        q.id === "q_eh_02" || /jabatan|posisi|position|role/i.test(q.text),
    );
    const typeRaw = findVal(
      (q) =>
        q.id === "q_eh_03" || /tipe pekerjaan|employment type/i.test(q.text),
    );
    const startDateRaw = findVal(
      (q) =>
        q.id === "q_eh_04" ||
        /tanggal mulai|mulai bekerja|start date/i.test(q.text),
    );
    const endDateRaw = findVal(
      (q) =>
        q.id === "q_eh_05" ||
        /tanggal selesai|selesai bekerja|end date/i.test(q.text),
    );
    const stillWorkingRaw = findVal(
      (q) =>
        q.id === "q_eh_06" || /masih bekerja|still working/i.test(q.text),
    );
    const location = findVal(
      (q) =>
        q.id === "q_eh_07" || /kota|negara|location|alamat/i.test(q.text),
    );
    const description = findVal(
      (q) =>
        q.id === "q_eh_08" ||
        /tugas|tanggung jawab|deskripsi|responsibilities/i.test(q.text),
    );

    const isStillWorking = isStillWorkingValue(stillWorkingRaw);

    let formattedStart = "";
    if (startDateRaw) {
      const d = dayjs(startDateRaw);
      formattedStart = d.isValid() ? d.format("MMM YYYY") : startDateRaw;
    }

    let formattedEnd = "";
    if (isStillWorking || (!endDateRaw && formattedStart)) {
      formattedEnd = "Present";
    } else if (endDateRaw) {
      const d = dayjs(endDateRaw);
      formattedEnd = d.isValid() ? d.format("MMM YYYY") : endDateRaw;
    }

    let cleanType = resolveOptionIdOrValueToLabel(typeRaw) || typeRaw;
    if (cleanType.includes("(") && cleanType.includes(")")) {
      cleanType = cleanType.replace(/.*\((.*)\).*/, "$1").trim();
    }

    const displayPosition =
      position || sub.badge || "Professional Staff";
    const displayJobTitle =
      cleanType &&
      !displayPosition.toLowerCase().includes(cleanType.toLowerCase())
        ? `${displayPosition} (${cleanType})`
        : displayPosition;

    const displayCompany =
      location && !company.toLowerCase().includes(location.toLowerCase())
        ? `${company}, ${location}`
        : company;

    experiences.push({
      id: `exp-${sub.submissionId}`,
      job_title: displayJobTitle,
      company: displayCompany || "Perusahaan",
      start_date: formattedStart,
      end_date: formattedEnd,
      description: description || "",
    });

    employmentHistory.push({
      id: `emp-${sub.submissionId}`,
      company: company || "Perusahaan",
      type: cleanType || "Full-Time",
      position: position || "Staff",
      from_date: formattedStart || startDateRaw,
      to_date:
        formattedEnd ||
        (endDateRaw
          ? dayjs(endDateRaw).isValid()
            ? dayjs(endDateRaw).format("MMM YYYY")
            : endDateRaw
          : "Present"),
      contact_reference: location || "",
    });

    if (!studentJobTitle && position) {
      studentJobTitle = position;
    }
  });

  // ================= 3. FORMAL EDUCATION (GROUPED BY SUBMISSION) =================
  const educations: CvEducation[] = [];
  const formalEducations: CvFormalEducation[] = [];

  const formalEduSubmissions = groupSubmissionsForBase(
    formalEduQuestions,
    allAnswers,
  );

  formalEduSubmissions.forEach((sub) => {
    const findEduVal = (
      predicate: (q: QuestionDataModel) => boolean,
    ): string => {
      for (const q of formalEduQuestions) {
        if (predicate(q)) {
          const ans = sub.answersMap.get(String(q.id));
          if (ans) {
            const val = getAnswerDisplayText(q, ans).trim();
            if (val) return val;
          }
        }
      }
      return "";
    };

    const degree = findEduVal(
      (q) => q.id === "q_fe_01" || /jenjang|degree/i.test(q.text),
    );
    const school = findEduVal(
      (q) =>
        q.id === "q_fe_02" ||
        /nama sekolah|universitas|institusi|school|campus/i.test(q.text),
    );
    const major = findEduVal(
      (q) =>
        q.id === "q_fe_03" || /jurusan|bidang studi|major/i.test(q.text),
    );
    const location = findEduVal(
      (q) => q.id === "q_fe_04" || /kota|negara|city/i.test(q.text),
    );
    const startYear = findEduVal(
      (q) => q.id === "q_fe_05" || /tahun mulai|commence/i.test(q.text),
    );
    const endYear = findEduVal(
      (q) =>
        q.id === "q_fe_06" || /tahun kelulusan|selesai|completed/i.test(q.text),
    );
    const gpa = findEduVal(
      (q) => q.id === "q_fe_07" || /ipk|nilai akhir|gpa/i.test(q.text),
    );
    const lang = findEduVal(
      (q) => q.id === "q_fe_08" || /bahasa pengantar/i.test(q.text),
    );

    const descItems = [
      gpa ? `IPK atau GPA ${gpa}` : "",
      location,
      lang ? `Bahasa Pengantar ${lang}` : "",
    ].filter(Boolean);

    educations.push({
      id: `edu-${sub.submissionId}`,
      school_name: school || "Universitas",
      degree: degree || "Bachelor Degree",
      major: major || "",
      start_date: startYear || "",
      end_date: endYear || "Present",
      description: descItems.join(" • "),
    });

    formalEducations.push({
      id: `formal-${sub.submissionId}`,
      level: degree || "Bachelor Degree",
      school: school || "Universitas",
      commence: startYear || "",
      completed: endYear || "Present",
    });
  });

  // Default fallback from student profile if no formal education records answered
  if (
    educations.length === 0 &&
    (student?.name_campus || student?.name_degree || student?.degree)
  ) {
    const campus = student?.name_campus || "Universitas";
    const deg =
      student?.degree || student?.name_degree || "Bachelor's Degree";
    const year = student?.created_at
      ? new Date(student.created_at).getFullYear().toString()
      : "2020";

    educations.push({
      id: "edu-profile-1",
      school_name: campus,
      degree: deg,
      major: student?.name_degree || "",
      start_date: year,
      end_date: "Present",
      description: "Program studi yang ditempuh oleh student.",
    });

    formalEducations.push({
      id: "formal-profile-1",
      level: deg,
      school: campus,
      commence: year,
      completed: "Present",
    });
  }

  // ================= 4. NONFORMAL EDUCATION =================
  const nonformalEducations: CvNonformalEducation[] = [];
  const activities: CvActivity[] = [];
  const skills: CvSkill[] = [];

  const nonformalSubmissions = groupSubmissionsForBase(
    nonformalEduQuestions,
    allAnswers,
  );

  nonformalSubmissions.forEach((sub) => {
    const findNfeVal = (
      predicate: (q: QuestionDataModel) => boolean,
    ): string => {
      for (const q of nonformalEduQuestions) {
        if (predicate(q)) {
          const ans = sub.answersMap.get(String(q.id));
          if (ans) {
            const val = getAnswerDisplayText(q, ans).trim();
            if (val) return val;
          }
        }
      }
      return "";
    };

    const course = findNfeVal(
      (q) =>
        q.id === "q_nfe_01" ||
        /nama kursus|pelatihan|sertifikasi|course/i.test(q.text),
    );
    const provider = findNfeVal(
      (q) =>
        q.id === "q_nfe_02" || /lembaga|penyelenggara|provider/i.test(q.text),
    );
    const startDate = findNfeVal(
      (q) => q.id === "q_nfe_03" || /tanggal mulai/i.test(q.text),
    );
    const endDate = findNfeVal(
      (q) => q.id === "q_nfe_04" || /tanggal selesai/i.test(q.text),
    );
    const stillOngoing = findNfeVal(
      (q) =>
        q.id === "q_nfe_07" ||
        /masih mengikuti|masih berjalan|masih berlangsung|still ongoing|masih kursus|masih pelatihan/i.test(
          q.text,
        ),
    );
    const isOngoing =
      isStillWorkingValue(stillOngoing) || (!endDate && Boolean(startDate));

    const certNo = findNfeVal(
      (q) =>
        q.id === "q_nfe_05" || /nomor sertifikat|kredensial/i.test(q.text),
    );
    const skillsLearned = findNfeVal(
      (q) =>
        q.id === "q_nfe_06" || /keterampilan|materi|skills/i.test(q.text),
    );

    const fStart = startDate
      ? dayjs(startDate).isValid()
        ? dayjs(startDate).format("YYYY")
        : startDate
      : "";
    const fEnd = isOngoing
      ? "Present"
      : endDate
      ? dayjs(endDate).isValid()
        ? dayjs(endDate).format("YYYY")
        : endDate
      : "";

    nonformalEducations.push({
      id: `nonformal-${sub.submissionId}`,
      level: course || "Pelatihan atau Sertifikasi",
      school: provider || "",
      commence: fStart,
      completed: isOngoing ? "Present" : fEnd || "Selesai",
    });

    activities.push({
      id: `act-nfe-${sub.submissionId}`,
      name: course || "Pelatihan Keahlian",
      start_date: fStart,
      end_date: isOngoing ? "Present" : fEnd,
      description: [
        provider,
        certNo ? `No ${certNo}` : "",
        skillsLearned,
      ]
        .filter(Boolean)
        .join(" • "),
    });

    if (skillsLearned) {
      skillsLearned
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((item, idx) => {
          skills.push({
            id: `skill-nfe-${sub.submissionId}-${idx}`,
            name: item,
          });
        });
    }
  });

  // ================= 5. ACHIEVEMENTS =================
  const achievements: CvAchievement[] = [];
  const leaderships: CvLeadership[] = [];

  const achievementSubmissions = groupSubmissionsForBase(
    achievementQuestions,
    allAnswers,
  );

  achievementSubmissions.forEach((sub) => {
    const findAchVal = (
      predicate: (q: QuestionDataModel) => boolean,
    ): string => {
      for (const q of achievementQuestions) {
        if (predicate(q)) {
          const ans = sub.answersMap.get(String(q.id));
          if (ans) {
            const val = getAnswerDisplayText(q, ans).trim();
            if (val) return val;
          }
        }
      }
      return "";
    };

    const achTitle = findAchVal(
      (q) =>
        q.id === "q_ac_01" ||
        /nama prestasi|penghargaan|award/i.test(q.text),
    );
    const achCategory = findAchVal(
      (q) => q.id === "q_ac_02" || /kategori/i.test(q.text),
    );
    const achLevel = findAchVal(
      (q) => q.id === "q_ac_03" || /tingkat/i.test(q.text),
    );
    const achYear = findAchVal(
      (q) => q.id === "q_ac_04" || /tahun/i.test(q.text),
    );
    const achIssuer = findAchVal(
      (q) => q.id === "q_ac_05" || /lembaga|pemberi|issuer/i.test(q.text),
    );
    const achDesc = findAchVal(
      (q) => q.id === "q_ac_06" || /deskripsi/i.test(q.text),
    );

    achievements.push({
      id: `ach-${sub.submissionId}`,
      company: achIssuer || "",
      type:
        [achCategory, achLevel].filter(Boolean).join(" - ") ||
        "Penghargaan",
      position: achTitle || "Juara atau Penerima Penghargaan",
      from_date: achYear || "",
      to_date: achYear || "",
    });

    leaderships.push({
      id: `lead-ach-${sub.submissionId}`,
      role: achTitle || "Penghargaan",
      organization: achIssuer || "Lembaga",
      start_date: achYear || "",
      end_date: "",
      description: [achLevel, achDesc].filter(Boolean).join(" • "),
    });
  });

  // ================= 6. TRAVEL HISTORY =================
  const travelHistory: CvTravelHistory[] = [];

  const travelSubmissions = groupSubmissionsForBase(
    travelQuestions,
    allAnswers,
  );

  travelSubmissions.forEach((sub) => {
    const findTrvVal = (
      predicate: (q: QuestionDataModel) => boolean,
    ): string => {
      for (const q of travelQuestions) {
        if (predicate(q)) {
          const ans = sub.answersMap.get(String(q.id));
          if (ans) {
            const val = getAnswerDisplayText(q, ans).trim();
            if (val) return val;
          }
        }
      }
      return "";
    };

    const trvCountry = findTrvVal(
      (q) => q.id === "q_th_01" || /destination|country|negara/i.test(q.text),
    );
    const trvPurpose = findTrvVal(
      (q) => q.id === "q_th_02" || /purpose|tujuan/i.test(q.text),
    );
    const trvArrival = findTrvVal(
      (q) => q.id === "q_th_03" || /kedatangan|arrival/i.test(q.text),
    );
    const trvDeparture = findTrvVal(
      (q) => q.id === "q_th_04" || /kepulangan|departure/i.test(q.text),
    );

    const fArrival = trvArrival
      ? dayjs(trvArrival).isValid()
        ? dayjs(trvArrival).format("MMM YYYY")
        : trvArrival
      : "";
    const fDeparture = trvDeparture
      ? dayjs(trvDeparture).isValid()
        ? dayjs(trvDeparture).format("MMM YYYY")
        : trvDeparture
      : "";

    travelHistory.push({
      id: `trv-${sub.submissionId}`,
      country: trvCountry || "",
      purpose: trvPurpose || "",
      start_date: fArrival,
      end_date: fDeparture,
    });
  });

  // ================= 7. NEXT OF KIN =================
  const nextOfKin: CvNextOfKin = {
    name: "",
    relationship: "Parent",
    address: "",
    city: city || "",
    province: provinceState || "",
    postal_code: postalCode || "",
    country: currentCountry,
    contact_no: "",
    email: "",
  };

  kinQuestions.forEach((q) => {
    const ans = allAnswers.find((a) => String(a.question_id) === String(q.id));
    if (!ans) return;
    const val = getAnswerDisplayText(q, ans).trim();
    if (!val) return;
    const qId = String(q.id).toLowerCase();
    const qText = (q.text || "").toLowerCase();

    if (
      qId === "q_nok_01" ||
      qText.includes("nama lengkap") ||
      qText.includes("full name") ||
      qText.includes("name")
    ) {
      nextOfKin.name = val;
    } else if (
      qId === "q_nok_02" ||
      qText.includes("hubungan") ||
      qText.includes("relationship") ||
      qText.includes("relation")
    ) {
      nextOfKin.relationship = resolveOptionIdOrValueToLabel(val) || val;
    } else if (
      qId === "q_nok_03" ||
      qText.includes("telepon") ||
      qText.includes("whatsapp") ||
      qText.includes("phone") ||
      qText.includes("contact")
    ) {
      nextOfKin.contact_no = val;
    } else if (qId === "q_nok_04" || qText.includes("email")) {
      nextOfKin.email = val;
    } else if (
      qId === "q_nok_06" ||
      qText.includes("alamat") ||
      qText.includes("address")
    ) {
      nextOfKin.address = val;
    }
  });

  // ================= 8. OTHER QUESTIONS (SUMMARY, SKILLS, LANGUAGES) =================
  const languages: CvLanguage[] = [];

  otherQuestions.forEach((q) => {
    const ans = allAnswers.find((a) => String(a.question_id) === String(q.id));
    if (!ans) return;
    const val = getAnswerDisplayText(q, ans).trim();
    if (!val) return;
    const qText = (q.text || "").toLowerCase();

    if (/tentang|about|summary|profil|ringkasan/i.test(qText)) {
      profileDescription = profileDescription
        ? `${profileDescription}\n\n${val}`
        : val;
    } else if (/skill|keahlian|kemampuan/i.test(qText)) {
      val
        .split(/[,;\n]+/)
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((item, idx) => {
          skills.push({
            id: `skill-other-${idx}`,
            name: item,
          });
        });
    } else if (/bahasa|language|ielts|toefl/i.test(qText)) {
      languages.push({
        id: `lang-other-${q.id}`,
        name: q.text.replace(/bahasa/i, "").trim() || "Bahasa",
        proficiency: val,
      });
    }
  });

  // Professional summary is only used if explicitly provided by student or admission
  // No artificial fallback generation to avoid mixing languages and inventing unverified profiles

  // Ensure professional default skills if empty
  if (skills.length === 0) {
    skills.push(
      { id: "s-1", name: "Communication & Interpersonal Skills" },
      { id: "s-2", name: "Problem Solving & Critical Thinking" },
      { id: "s-3", name: "Team Collaboration & Leadership" },
      { id: "s-4", name: "Time Management & Work Ethics" },
      { id: "s-5", name: "Microsoft Office & Google Workspace" },
    );
  }

  // Ensure professional default languages if empty
  if (languages.length === 0) {
    languages.push(
      {
        id: "l-1",
        name: "Bahasa Indonesia",
        proficiency: "Native atau Penutur Asli",
      },
      {
        id: "l-2",
        name: "English",
        proficiency: "Professional Working atau Percakapan",
      },
    );
  }

  const interests: CvInterest[] = [
    {
      id: "int-1",
      description: "Professional Development & Industry Trends",
    },
    {
      id: "int-2",
      description: "Cross-Cultural Communication & Global Networking",
    },
  ];

  return {
    first_name: firstName,
    last_name: lastName,
    email: email,
    phone: phone,
    city: city,
    job_title: studentJobTitle || "Student atau Graduate",
    photo_url: student?.profile_picture_url || "",
    profile_description: profileDescription,
    template_id: "formal",
    province_state: provinceState,
    postal_code: postalCode,
    country: currentCountry,
    date_of_birth: dateOfBirth,
    place_of_birth: placeOfBirth,
    age: age,
    nationality: nationality,
    gender: gender,
    marital_status: maritalStatus,
    height: height,
    weight: weight,
    id_number: idNumber,
    passport_number: passportNumber,
    formal_educations: formalEducations,
    nonformal_educations: nonformalEducations,
    employment_history: employmentHistory,
    achievements: achievements,
    travel_history: travelHistory,
    next_of_kin: nextOfKin,
    educations,
    experiences,
    skills,
    languages,
    leaderships,
    activities,
    interests,
  };
}
