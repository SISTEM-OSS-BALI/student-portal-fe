import dayjs from "dayjs";
import type {
  AnswerQuestionDataModel,
  QuestionBaseDataModel,
  QuestionDataModel,
} from "@/app/models/question";

export interface SubmissionEntry {
  submissionId: string;
  createdAt: string;
  answersMap: Map<string, AnswerQuestionDataModel>;
  title: string;
  badge?: string;
  subtitle: string;
  details: Array<{ questionText: string; answerText: string }>;
}

export const KNOWN_OPTION_ID_MAP: Record<string, string> = {
  // Next of Kin / Relationship
  opt_nok_02_1: "Father",
  opt_nok_02_2: "Mother",
  opt_nok_02_3: "Spouse",
  opt_nok_02_4: "Sibling",
  opt_nok_02_5: "Legal Guardian",
  father: "Father",
  mother: "Mother",
  spouse: "Spouse",
  sibling: "Sibling",
  guardian: "Legal Guardian",
  ayah: "Father",
  ibu: "Mother",
  "ayah kandung": "Father",
  "ibu kandung": "Mother",
  "ayah kandung (father)": "Father",
  "ibu kandung (mother)": "Mother",
  "suami / istri": "Spouse",
  "suami / istri (spouse)": "Spouse",
  "saudara kandung": "Sibling",
  "saudara kandung (sibling)": "Sibling",
  "wali sah": "Legal Guardian",
  "wali sah (legal guardian)": "Legal Guardian",

  // Gender
  opt_pd_03_1: "Male",
  opt_pd_03_2: "Female",
  male: "Male",
  female: "Female",
  "laki-laki": "Male",
  perempuan: "Female",

  // Nationality
  opt_pd_06_1: "Indonesian (WNI)",
  opt_pd_06_2: "Foreigner (WNA)",
  idn: "Indonesian (WNI)",
  foreigner: "Foreigner (WNA)",

  // Marital Status
  opt_pd_10_1: "Single",
  opt_pd_10_2: "Married",
  opt_pd_10_3: "Divorced",
  opt_pd_10_4: "Widowed",
  single: "Single",
  married: "Married",
  divorced: "Divorced",
  widowed: "Widowed",
  "belum menikah": "Single",
  menikah: "Married",
  "cerai hidup": "Divorced",
  "cerai mati": "Widowed",

  // Religion
  opt_pd_11_1: "Islam",
  opt_pd_11_2: "Protestant",
  opt_pd_11_3: "Catholic",
  opt_pd_11_4: "Hindu",
  opt_pd_11_5: "Buddhist",
  opt_pd_11_6: "Confucian",

  // Formal Education Level
  opt_fe_01_1: "High School",
  opt_fe_01_2: "Diploma",
  opt_fe_01_3: "Bachelor's Degree",
  opt_fe_01_4: "Master's Degree",
  opt_fe_01_5: "Doctoral Degree",
  high_school: "High School",
  diploma: "Diploma",
  bachelor: "Bachelor's Degree",
  master: "Master's Degree",
  phd: "Doctoral Degree",

  // Language
  opt_fe_08_1: "Bahasa Indonesia",
  opt_fe_08_2: "English",
  opt_fe_08_3: "Bilingual",

  // Employment Type
  opt_eh_03_1: "Full-Time",
  opt_eh_03_2: "Part-Time",
  opt_eh_03_3: "Contract",
  opt_eh_03_4: "Internship",
  opt_eh_03_5: "Freelance",
  full_time: "Full-Time",
  part_time: "Part-Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
  magang: "Internship",
  "pekerja lepas": "Freelance",
  "penuh waktu": "Full-Time",
  "paruh waktu": "Part-Time",

  // Yes / No
  opt_eh_06_1: "Yes",
  opt_eh_06_2: "No",
  opt_nfe_07_1: "Yes",
  opt_nfe_07_2: "No",
  opt_th_06_1: "No",
  opt_th_06_2: "Yes",
  yes: "Yes",
  no: "No",
  ya: "Yes",
  tidak: "No",

  // Travel Purpose
  opt_th_02_1: "Holiday / Tourism",
  opt_th_02_2: "Study / Education",
  opt_th_02_3: "Business / Work",
  opt_th_02_4: "Family Visit",
  opt_th_02_5: "Transit",

  // Achievement Category & Level
  opt_ac_02_1: "Academic",
  opt_ac_02_2: "Sports",
  opt_ac_02_3: "Arts & Culture",
  opt_ac_02_4: "Professional",
  opt_ac_02_5: "Leadership",
  opt_ac_03_1: "Institutional",
  opt_ac_03_2: "Regional",
  opt_ac_03_3: "Provincial",
  opt_ac_03_4: "National",
  opt_ac_03_5: "International",
};

export function resolveOptionIdOrValueToLabel(
  idOrValue?: string | null,
): string {
  if (!idOrValue) return "";
  const trimmed = idOrValue.trim();
  if (!trimmed) return "";
  if (trimmed.includes(",")) {
    return trimmed
      .split(",")
      .map((part) => resolveOptionIdOrValueToLabel(part.trim()))
      .filter(Boolean)
      .join(", ");
  }
  const lower = trimmed.toLowerCase();
  if (KNOWN_OPTION_ID_MAP[lower]) {
    return KNOWN_OPTION_ID_MAP[lower];
  }
  return trimmed;
}

export function getAnswerDisplayText(
  question: QuestionDataModel,
  answer: AnswerQuestionDataModel,
): string {
  const isOption = ["SELECT", "RADIO", "CHECKBOX"].includes(question.input_type);
  if (isOption && answer.selected_option_ids && answer.selected_option_ids.length > 0) {
    const selectedSet = new Set(answer.selected_option_ids.map(String));
    const matchedLabels = (question.options ?? [])
      .filter((opt) => selectedSet.has(String(opt.id)) || selectedSet.has(String(opt.value)))
      .map((opt) => opt.label);
    if (matchedLabels.length > 0) {
      return matchedLabels
        .map((lbl) => resolveOptionIdOrValueToLabel(lbl) || lbl)
        .join(", ");
    }
    const fallbackLabels = answer.selected_option_ids
      .map((idOrVal) => resolveOptionIdOrValueToLabel(String(idOrVal)))
      .filter(Boolean);
    if (fallbackLabels.length > 0) {
      return fallbackLabels.join(", ");
    }
    return answer.selected_option_ids.join(", ");
  }

  if (isOption && answer.answer_text) {
    const resolved = resolveOptionIdOrValueToLabel(answer.answer_text);
    if (resolved && resolved !== answer.answer_text) {
      return resolved;
    }
  }

  if (question.input_type === "DATE" && answer.answer_text) {
    const parsed = dayjs(answer.answer_text);
    return parsed.isValid() ? parsed.format("DD MMMM YYYY") : answer.answer_text;
  }

  return resolveOptionIdOrValueToLabel(answer.answer_text) ?? "";
}

export function groupSubmissionsForBase(
  baseQuestions: QuestionDataModel[],
  allAnswers: AnswerQuestionDataModel[],
): SubmissionEntry[] {
  if (!baseQuestions.length || !allAnswers.length) {
    return [];
  }

  const baseQuestionIds = new Set(baseQuestions.map((q) => String(q.id)));
  const relevantAnswers = allAnswers.filter((a) =>
    baseQuestionIds.has(String(a.question_id)),
  );

  if (!relevantAnswers.length) {
    return [];
  }

  const groupsMap = new Map<string, AnswerQuestionDataModel[]>();
  relevantAnswers.forEach((ans) => {
    let subId = ans.submission_id;
    if (!subId || !subId.trim()) {
      const timeBucket = ans.created_at ? Math.floor(Date.parse(ans.created_at) / 60000) : 0;
      subId = `sub_legacy_${timeBucket}`;
    }
    const list = groupsMap.get(subId) ?? [];
    list.push(ans);
    groupsMap.set(subId, list);
  });

  const entries: SubmissionEntry[] = [];

  groupsMap.forEach((answers, subId) => {
    const answersMap = new Map<string, AnswerQuestionDataModel>();
    answers.forEach((ans) => {
      const existing = answersMap.get(String(ans.question_id));
      if (!existing) {
        answersMap.set(String(ans.question_id), ans);
      } else {
        const existingTime = Date.parse(existing.created_at ?? "");
        const nextTime = Date.parse(ans.created_at ?? "");
        if (Number.isNaN(existingTime) || nextTime >= existingTime) {
          answersMap.set(String(ans.question_id), ans);
        }
      }
    });

    const details: Array<{ questionText: string; answerText: string; order: number }> = [];
    baseQuestions.forEach((q) => {
      const ans = answersMap.get(String(q.id));
      if (!ans) return;
      const displayVal = getAnswerDisplayText(q, ans);
      if (displayVal && displayVal.trim()) {
        details.push({
          questionText: q.text,
          answerText: displayVal.trim(),
          order: q.order ?? 0,
        });
      }
    });

    details.sort((a, b) => a.order - b.order);

    if (details.length === 0) {
      return;
    }

    let title = "";
    let badge = "";
    let position = "";
    let major = "";
    let period = "";
    let score = "";
    let contact = "";

    baseQuestions.forEach((q) => {
      const ans = answersMap.get(String(q.id));
      if (!ans) return;
      const val = getAnswerDisplayText(q, ans);
      if (!val || !val.trim()) return;

      const qText = (q.text || "").toLowerCase();

      if (!title) {
        if (
          qText.includes("nama sekolah") ||
          qText.includes("school") ||
          qText.includes("universitas") ||
          qText.includes("university") ||
          qText.includes("institusi") ||
          qText.includes("institution") ||
          qText.includes("perguruan tinggi") ||
          qText.includes("nama perusahaan") ||
          qText.includes("company") ||
          qText.includes("employer") ||
          qText.includes("instansi") ||
          qText.includes("nama kursus") ||
          qText.includes("course") ||
          qText.includes("nama prestasi") ||
          qText.includes("award") ||
          qText.includes("achievement") ||
          qText.includes("negara tujuan") ||
          qText.includes("destination") ||
          qText.includes("nama lengkap") ||
          qText.includes("full name") ||
          qText.includes("kontak darurat") ||
          qText.includes("emergency contact")
        ) {
          title = val;
        }
      }

      if (!badge) {
        if (
          qText.includes("jenjang") ||
          qText.includes("degree") ||
          qText.includes("tipe pekerjaan") ||
          qText.includes("employment type") ||
          qText.includes("jenis pekerjaan") ||
          qText.includes("status pekerjaan") ||
          qText.includes("hubungan") ||
          qText.includes("relationship") ||
          qText.includes("tingkat prestasi") ||
          qText.includes("competition level") ||
          qText.includes("achievement level") ||
          qText.includes("kategori prestasi") ||
          qText.includes("achievement category") ||
          qText.includes("jenis visa") ||
          qText.includes("visa type")
        ) {
          badge = val;
        }
      }

      if (!position && (
        qText.includes("posisi") ||
        qText.includes("jabatan") ||
        qText.includes("job title") ||
        qText.includes("position")
      )) {
        position = val;
      }

      if (!major && (
        qText.includes("jurusan") ||
        qText.includes("bidang studi") ||
        qText.includes("program studi") ||
        qText.includes("major") ||
        qText.includes("field of study")
      )) {
        major = val;
      }

      if (!period && (
        qText.includes("tahun") ||
        qText.includes("periode") ||
        qText.includes("tanggal mulai") ||
        qText.includes("start date") ||
        qText.includes("year")
      )) {
        period = val;
      }

      if (!score && (
        qText.includes("ipk") ||
        qText.includes("gpa") ||
        qText.includes("nilai akhir") ||
        qText.includes("skor")
      )) {
        score = `IPK: ${val}`;
      }

      if (!contact && (
        qText.includes("nomor telepon") ||
        qText.includes("telepon") ||
        qText.includes("phone") ||
        qText.includes("whatsapp")
      )) {
        contact = val;
      }
    });

    if (!title && details.length > 0) {
      title = details[0].answerText;
    }

    let subtitle = "";
    if (position) {
      subtitle = period ? `${position} (${period})` : position;
    } else if (major) {
      subtitle = period ? `${major} (${period})` : major;
      if (score) {
        subtitle = `${subtitle}, ${score}`;
      }
    } else if (contact) {
      subtitle = contact;
    } else if (period) {
      subtitle = period;
    }

    if (!subtitle && details.length > 1) {
      const remaining = details.filter((d) => d.answerText !== title && d.answerText !== badge);
      if (remaining.length > 0) {
        subtitle = remaining.slice(0, 2).map((d) => d.answerText).join(", ");
      }
    }

    const firstAns = answers[0];
    const createdAt = firstAns?.created_at ?? "";

    entries.push({
      submissionId: subId,
      createdAt,
      answersMap,
      title: title || "Data Riwayat",
      badge,
      subtitle,
      details: details.map(({ questionText, answerText }) => ({ questionText, answerText })),
    });
  });

  entries.sort((a, b) => {
    const tA = Date.parse(a.createdAt);
    const tB = Date.parse(b.createdAt);
    if (Number.isNaN(tA) || Number.isNaN(tB)) return 0;
    return tB - tA;
  });

  return entries;
}

export interface BaseDraft {
  values: Record<string, unknown>;
  editingSubmissionId?: string | null;
  editingTitle?: string | null;
  updatedAt: number;
}

export function hasMeaningfulValues(values: Record<string, unknown>): boolean {
  if (!values || typeof values !== "object") return false;
  return Object.values(values).some((v) => {
    if (v === undefined || v === null || v === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  });
}

export function loadDraftsFromStorage(
  userId?: string | number,
): Record<string, BaseDraft> {
  if (typeof window === "undefined" || !userId) return {};
  try {
    const raw = sessionStorage.getItem(`student_pinfo_drafts_${userId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveDraftsToStorage(
  userId: string | number | undefined,
  drafts: Record<string, BaseDraft>,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    sessionStorage.setItem(
      `student_pinfo_drafts_${userId}`,
      JSON.stringify(drafts),
    );
  } catch {
    // Abaikan galat batas kuota penyimpanan browser
  }
}

export function clearDraftFromStorage(
  userId: string | number | undefined,
  baseId: string,
): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    const drafts = loadDraftsFromStorage(userId);
    if (drafts[baseId]) {
      delete drafts[baseId];
      saveDraftsToStorage(userId, drafts);
    }
  } catch {
    // Abaikan galat penyimpanan
  }
}

export function loadActiveTabFromStorage(
  userId?: string | number,
): string | null {
  if (typeof window === "undefined") return null;
  try {
    if (userId) {
      const userTab = sessionStorage.getItem(`student_pinfo_active_tab_${userId}`);
      if (userTab) return userTab;
    }
    return sessionStorage.getItem("student_pinfo_active_tab");
  } catch {
    return null;
  }
}

export function saveActiveTabToStorage(
  userId: string | number | undefined,
  tabKey: string,
): void {
  if (typeof window === "undefined" || !tabKey) return;
  try {
    sessionStorage.setItem("student_pinfo_active_tab", String(tabKey));
    if (userId) {
      sessionStorage.setItem(`student_pinfo_active_tab_${userId}`, String(tabKey));
    }
  } catch {
    // Abaikan galat penyimpanan
  }
}

export function resolveActiveTab(
  bases?: QuestionBaseDataModel[],
  userId?: string | number,
  drafts?: Record<string, BaseDraft>,
  preferredTab?: string | null,
): string | undefined {
  if (!bases || !bases.length) return undefined;

  const baseIds = new Set(bases.map((b) => String(b.id)));

  // 1. Tab preferensi (misal dari URL query param ?tab=... atau activeTab saat ini)
  if (preferredTab && baseIds.has(String(preferredTab))) {
    return String(preferredTab);
  }

  // 2. Tab yang tersimpan di sessionStorage untuk user ini atau session browser
  const storedTab = loadActiveTabFromStorage(userId);
  if (storedTab && baseIds.has(storedTab)) {
    return storedTab;
  }

  // 3. Tab yang memiliki draf belum tersimpan dengan perubahan paling baru
  if (drafts) {
    const draftEntries = Object.entries(drafts)
      .filter(([baseId, draft]) => baseIds.has(baseId) && hasMeaningfulValues(draft?.values))
      .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0));

    if (draftEntries.length > 0) {
      return draftEntries[0][0];
    }
  }

  // 4. Default ke base pertama
  return String(bases[0].id);
}

export function isStillWorkingQuestion(question: QuestionDataModel): boolean {
  if (question.id === "q_eh_06" || question.id === "q_nfe_07") return true;
  const text = (question.text || "").toLowerCase();
  return (
    text.includes("masih bekerja") ||
    text.includes("masih aktif bekerja") ||
    text.includes("still working") ||
    text.includes("masih mengikuti") ||
    text.includes("masih berjalan") ||
    text.includes("masih berlangsung") ||
    text.includes("still ongoing") ||
    text.includes("masih kursus") ||
    text.includes("masih pelatihan")
  );
}

export function isWorkEndDateQuestion(
  question: QuestionDataModel,
  baseId?: string,
): boolean {
  if (question.id === "q_eh_05" || question.id === "q_nfe_04") return true;
  if (question.input_type !== "DATE") return false;
  const text = (question.text || "").toLowerCase();
  const isEndDate =
    text.includes("selesai") ||
    text.includes("berakhir") ||
    text.includes("end date");
  const isRelevantBase =
    text.includes("bekerja") ||
    text.includes("kerja") ||
    text.includes("work") ||
    text.includes("pelatihan") ||
    text.includes("kursus") ||
    baseId === "qb_employment_history" ||
    baseId === "qb_nonformal_education";
  return isEndDate && isRelevantBase;
}

export function getStillWorkingOptions(question?: QuestionDataModel | null): {
  yesOptionId: string;
  noOptionId: string;
} {
  const isNonformal =
    question?.id === "q_nfe_07" ||
    question?.base_id === "qb_nonformal_education" ||
    (question?.text || "").toLowerCase().includes("pelatihan") ||
    (question?.text || "").toLowerCase().includes("kursus");

  const defaultYes = isNonformal ? "opt_nfe_07_1" : "opt_eh_06_1";
  const defaultNo = isNonformal ? "opt_nfe_07_2" : "opt_eh_06_2";

  if (!question || !question.options) {
    return {
      yesOptionId: defaultYes,
      noOptionId: defaultNo,
    };
  }

  const yesOpt = question.options.find((opt) => {
    const val = (opt.value || "").toUpperCase();
    const lbl = (opt.label || "").toLowerCase();
    const id = (opt.id || "").toLowerCase();
    return (
      val === "YES" ||
      lbl.includes("ya") ||
      lbl.includes("still working") ||
      lbl.includes("masih berjalan") ||
      lbl.includes("masih berlangsung") ||
      lbl.includes("ongoing") ||
      lbl.includes("present") ||
      id.includes("yes") ||
      id.endsWith("_1")
    );
  });

  const noOpt = question.options.find((opt) => {
    const val = (opt.value || "").toUpperCase();
    const lbl = (opt.label || "").toLowerCase();
    const id = (opt.id || "").toLowerCase();
    return (
      val === "NO" ||
      lbl.includes("tidak") ||
      lbl.includes("(no)") ||
      lbl.includes("selesai") ||
      id.includes("no") ||
      id.endsWith("_2")
    );
  });

  return {
    yesOptionId: yesOpt ? String(yesOpt.id ?? yesOpt.value) : defaultYes,
    noOptionId: noOpt ? String(noOpt.id ?? noOpt.value) : defaultNo,
  };
}

export function isStillWorkingValue(
  value: unknown,
  yesOptionId?: string,
): boolean {
  if (value === undefined || value === null || value === "") return false;
  const valStr = String(value).trim();
  if (yesOptionId && valStr === String(yesOptionId)) return true;
  const lower = valStr.toLowerCase();
  return (
    valStr.toUpperCase() === "YES" ||
    lower.includes("still working") ||
    lower.includes("still ongoing") ||
    lower.includes("present") ||
    lower.includes("masih berlangsung") ||
    lower.includes("masih berjalan") ||
    lower === "ya" ||
    lower.startsWith("ya ") ||
    lower.includes("(still working") ||
    lower.includes("(masih berjalan") ||
    lower.includes("(masih berlangsung") ||
    lower.includes("(present")
  );
}

export function toDayjsOrUndefined(val: unknown): dayjs.Dayjs | undefined {
  if (!val) return undefined;
  if (dayjs.isDayjs(val)) {
    return val.isValid() ? val : undefined;
  }
  if (val instanceof Date) {
    const d = dayjs(val);
    return d.isValid() ? d : undefined;
  }
  if (typeof val === "string" || typeof val === "number") {
    const str = String(val).trim();
    if (!str) return undefined;
    const d = dayjs(str);
    return d.isValid() ? d : undefined;
  }
  if (typeof val === "object") {
    const anyVal = val as Record<string, unknown>;
    if (anyVal.$d) {
      const d = dayjs(anyVal.$d as string | number | Date);
      if (d.isValid()) return d;
    }
    if (anyVal.date) {
      const d = dayjs(anyVal.date as string | number | Date);
      if (d.isValid()) return d;
    }
  }
  return undefined;
}

export function harmonizeEmploymentDatesAndStatus(
  values: Record<string, unknown>,
  questions: QuestionDataModel[],
  changedKey?: string,
  baseId?: string,
): {
  nextValues: Record<string, unknown>;
  forcedStillWorkingValue?: string;
  shouldClearEndDate?: boolean;
} {
  const stillWorkingQ = questions.find(isStillWorkingQuestion);
  const workEndDateQ = questions.find((q) => isWorkEndDateQuestion(q, baseId));

  if (!stillWorkingQ || !workEndDateQ) {
    return { nextValues: values };
  }

  const stillWorkingId = String(stillWorkingQ.id);
  const endDateId = String(workEndDateQ.id);
  const { yesOptionId, noOptionId } = getStillWorkingOptions(stillWorkingQ);

  const nextValues = { ...values };
  let forcedStillWorkingValue: string | undefined;
  let shouldClearEndDate = false;

  // Skenario 1: Tanggal selesai diubah secara spesifik
  if (changedKey === endDateId) {
    const selectedDate = nextValues[endDateId];
    if (selectedDate !== undefined && selectedDate !== null && selectedDate !== "") {
      // Jika tanggal diisi dari tahun sebelumnya atau tanggal apapun dipilih, otomatis pilih 'No'
      nextValues[stillWorkingId] = noOptionId;
      forcedStillWorkingValue = noOptionId;
    }
  } else if (changedKey === stillWorkingId) {
    // Skenario 2: Status masih bekerja diubah secara spesifik
    const chosenStatus = nextValues[stillWorkingId];
    if (isStillWorkingValue(chosenStatus, yesOptionId)) {
      // Jika memilih masih bekerja, tanggal selesai ditiadakan / non-aktif
      nextValues[endDateId] = undefined;
      shouldClearEndDate = true;
    }
  } else {
    // Skenario 3: Inisialisasi awal, restorasi draf, atau mode edit
    const currentStatus = nextValues[stillWorkingId];
    const currentDate = nextValues[endDateId];

    if (isStillWorkingValue(currentStatus, yesOptionId)) {
      nextValues[endDateId] = undefined;
      shouldClearEndDate = true;
    } else if (
      currentDate !== undefined &&
      currentDate !== null &&
      currentDate !== "" &&
      (currentStatus === undefined || currentStatus === null || currentStatus === "")
    ) {
      nextValues[stillWorkingId] = noOptionId;
      forcedStillWorkingValue = noOptionId;
    }
  }

  return { nextValues, forcedStillWorkingValue, shouldClearEndDate };
}

export type DateConstraintType =
  | "DEFAULT"
  | "PAST_ONLY"
  | "FUTURE_ONLY"
  | "AFTER_START_DATE"
  | "NONE";

export interface ResolvedDateConstraint {
  type: DateConstraintType;
  pairedStartQuestionId?: string;
  errorMessage?: string;
}

export function resolveDateConstraint(
  question: QuestionDataModel,
  allQuestionsInBase: QuestionDataModel[] = [],
): ResolvedDateConstraint {
  if (question.input_type !== "DATE") {
    return { type: "NONE" };
  }

  // 1. Cek konfigurasi eksplisit dari data tersimpan (misal CONSTRAINT:PAST_ONLY)
  const rawPlaceholder = (question.placeholder || "").trim();
  if (rawPlaceholder.startsWith("CONSTRAINT:")) {
    const explicit = rawPlaceholder
      .replace("CONSTRAINT:", "")
      .trim()
      .toUpperCase() as DateConstraintType;

    if (explicit === "PAST_ONLY") {
      return {
        type: "PAST_ONLY",
        errorMessage: "Tanggal tidak boleh di masa depan",
      };
    }
    if (explicit === "FUTURE_ONLY") {
      return {
        type: "FUTURE_ONLY",
        errorMessage: "Tanggal harus di masa depan",
      };
    }
    if (explicit === "NONE") {
      return { type: "NONE" };
    }
    if (explicit === "AFTER_START_DATE") {
      const pairedStart = findPairedStartDateQuestion(question, allQuestionsInBase);
      return {
        type: "AFTER_START_DATE",
        pairedStartQuestionId: pairedStart?.id,
        errorMessage: getEndDateErrorMessage(question),
      };
    }
  }

  // 2. Deteksi cerdas otomatis berdasarkan ID dan teks pertanyaan
  const qId = String(question.id || "").toLowerCase();
  const text = (question.text || "").toLowerCase();

  // Tanggal Lahir: harus di masa lalu / maksimal hari ini
  if (qId === "q_pd_05" || text.includes("birth") || text.includes("lahir")) {
    return {
      type: "PAST_ONLY",
      errorMessage: "Tanggal lahir tidak boleh di masa depan",
    };
  }

  // Tanggal Penerbitan Paspor: harus di masa lalu / maksimal hari ini
  if (
    text.includes("issue date") ||
    text.includes("dikeluarkan") ||
    text.includes("terbit")
  ) {
    return {
      type: "PAST_ONLY",
      errorMessage: "Tanggal penerbitan paspor tidak boleh di masa depan",
    };
  }

  // Tanggal Selesai / Kepulangan / Habis Berlaku Paspor: tidak boleh mundur dari tanggal mulai / kedatangan / penerbitan
  const isEnd =
    qId === "q_eh_05" ||
    qId === "q_nfe_04" ||
    qId === "q_th_04" ||
    qId === "q_pd_09" ||
    text.includes("end date") ||
    text.includes("selesai") ||
    text.includes("berakhir") ||
    text.includes("departure") ||
    text.includes("kepulangan") ||
    text.includes("expiry") ||
    text.includes("habis berlaku") ||
    text.includes("kadaluwarsa") ||
    text.includes("kedaluwarsa");

  if (isEnd) {
    const pairedStart = findPairedStartDateQuestion(question, allQuestionsInBase);
    if (pairedStart) {
      return {
        type: "AFTER_START_DATE",
        pairedStartQuestionId: String(pairedStart.id),
        errorMessage: getEndDateErrorMessage(question),
      };
    }
  }

  return { type: "NONE" };
}

export function findPairedStartDateQuestion(
  endDateQuestion: QuestionDataModel,
  allQuestions: QuestionDataModel[],
): QuestionDataModel | undefined {
  const endId = String(endDateQuestion.id || "").toLowerCase();
  const endText = (endDateQuestion.text || "").toLowerCase();

  // Pasangan spesifik yang umum
  if (endId === "q_eh_05") {
    return allQuestions.find((q) => String(q.id) === "q_eh_04");
  }
  if (endId === "q_nfe_04") {
    return allQuestions.find((q) => String(q.id) === "q_nfe_03");
  }
  if (endId === "q_th_04") {
    return allQuestions.find((q) => String(q.id) === "q_th_03");
  }

  // Jika pertanyaan adalah tanggal kedaluwarsa atau habis berlaku paspor
  if (
    endId === "q_pd_09" ||
    endText.includes("expiry") ||
    endText.includes("habis berlaku") ||
    endText.includes("kadaluwarsa") ||
    endText.includes("kedaluwarsa")
  ) {
    const passportStart = allQuestions.find((q) => {
      const t = (q.text || "").toLowerCase();
      return (
        q.id !== endDateQuestion.id &&
        q.input_type === "DATE" &&
        (t.includes("issue") ||
          t.includes("dikeluarkan") ||
          t.includes("terbit") ||
          t.includes("start") ||
          t.includes("mulai"))
      );
    });
    if (passportStart) return passportStart;
  }

  // Pencarian mundur pada pertanyaan DATE sebelumnya di seksi yang sama
  const currentIndex = allQuestions.findIndex((q) => q.id === endDateQuestion.id);
  const preceding = currentIndex > 0 ? allQuestions.slice(0, currentIndex) : allQuestions;

  return preceding
    .filter((q) => q.id !== endDateQuestion.id && q.input_type === "DATE")
    .reverse()
    .find((q) => {
      const t = (q.text || "").toLowerCase();
      return (
        t.includes("start date") ||
        t.includes("mulai") ||
        t.includes("arrival") ||
        t.includes("kedatangan") ||
        t.includes("masuk") ||
        t.includes("issue") ||
        t.includes("dikeluarkan") ||
        t.includes("terbit")
      );
    });
}

function getEndDateErrorMessage(question: QuestionDataModel): string {
  const text = (question.text || "").toLowerCase();
  if (text.includes("departure") || text.includes("kepulangan")) {
    return "Tanggal kepulangan tidak boleh lebih awal dari tanggal kedatangan";
  }
  if (
    text.includes("expiry") ||
    text.includes("habis berlaku") ||
    text.includes("kadaluwarsa") ||
    text.includes("kedaluwarsa")
  ) {
    return "Tanggal habis berlaku tidak boleh lebih awal dari tanggal penerbitan";
  }
  return "Tanggal selesai tidak boleh lebih awal dari tanggal mulai";
}
