"use client";

import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Radio,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Tour,
  Typography,
  Upload,
} from "antd";
import type { TourProps } from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  PlusCircleOutlined,
  PlusOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { generateProfileSummaryText } from "@/app/utils/ai-profile-summary";
import { extractStudentCvData } from "@/app/(view)/admission/dashboard/students-management/detail/[id]/cv/editor/utils";
import dayjs, { type Dayjs } from "dayjs";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/app/utils/use-auth";
import { useQuestionBases } from "@/app/hooks/use-question-bases";
import {
  useQuestions,
  DEFAULT_PERSONAL_DETAILS_QUESTIONS,
  DEFAULT_NONFORMAL_QUESTIONS,
} from "@/app/hooks/use-questions";
import { useUser, useUpdateUser } from "@/app/hooks/use-users";
import type { UserDataModel } from "@/app/models/user";
import { useAnswerQuestions } from "@/app/hooks/use-answer-questions";
import { usePageTour } from "@/app/hooks/use-page-tour";
import { isAllowedUploadSize } from "@/app/utils/upload";
import PageHeader from "@/app/components/common/page-header";
import AppButton from "@/app/components/common/app-button";
import AppFormField from "@/app/components/common/app-form-field";
import AppTypography from "@/app/components/common/app-typography";
import {
  cleanHelpText,
  cleanOptionLabel,
  cleanPlaceholder,
  cleanQuestionLabel,
  formatBadgeEnglish,
} from "@/app/utils/placeholder-sanitizer";
import {
  clearDraftFromStorage,
  getStillWorkingOptions,
  groupSubmissionsForBase,
  harmonizeEmploymentDatesAndStatus,
  hasMeaningfulValues,
  isStillWorkingQuestion,
  isStillWorkingValue,
  isWorkEndDateQuestion,
  loadActiveTabFromStorage,
  loadDraftsFromStorage,
  resolveActiveTab,
  saveActiveTabToStorage,
  saveDraftsToStorage,
  toDayjsOrUndefined,
  resolveDateConstraint,
  type BaseDraft,
  type SubmissionEntry,
} from "@/app/utils/personal-info-submissions";
import type {
  AnswerQuestionDataModel,
  QuestionDataModel,
} from "@/app/models/question";
import styles from "./personal-info.module.css";

const { TextArea } = Input;
const { Text, Title } = Typography;

interface SafeDatePickerProps
  extends Omit<ComponentProps<typeof DatePicker>, "value"> {
  value?: unknown;
}

const SafeDatePicker = forwardRef<any, SafeDatePickerProps>(
  function SafeDatePicker({ value, ...rest }, ref) {
    const safeValue = toDayjsOrUndefined(value);
    return <DatePicker ref={ref} value={safeValue} {...(rest as any)} />;
  },
);
SafeDatePicker.displayName = "SafeDatePicker";

const cleanSlashText = (val?: string | null): string => {
  if (!val) return "";
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (lower.includes("personal") || lower.includes("pribadi")) return "Personal Details";
  if (lower.includes("nonformal") || lower.includes("pelatihan") || lower.includes("kursus")) return "Nonformal Education";
  if (lower.includes("formal") || lower.includes("pendidikan formal")) return "Formal Education";
  if (lower.includes("employment") || lower.includes("pekerjaan") || lower.includes("kerja")) return "Employment History";
  if (lower.includes("achievement") || lower.includes("prestasi")) return "Achievement";
  if (lower.includes("travel") || lower.includes("perjalanan")) return "Travel History";
  if (lower.includes("kin") || lower.includes("kontak darurat") || lower.includes("parents") || lower.includes("orang tua")) return "Next of Kin";
  return trimmed
    .replace(/student\/client/gi, "student")
    .replace(/Next of kin\/parents/gi, "Next of Kin");
};

const syncTabToUrl = (tabKey: string) => {
  if (typeof window === "undefined" || !tabKey) return;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("tab") !== String(tabKey)) {
      url.searchParams.set("tab", String(tabKey));
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
  } catch {
    // Abaikan jika replaceState tidak didukung
  }
};

const renderQuestionLabel = (question: QuestionDataModel) => (
  <AppTypography.Label>
    {cleanQuestionLabel(question.text)}
  </AppTypography.Label>
);

const renderQuestionField = (
  question: QuestionDataModel,
  disabled?: boolean,
  overridePlaceholder?: string,
  disabledDate?: (current: any) => boolean,
) => {
  return (
    <AppFormField
      question={question}
      disabled={disabled}
      placeholder={overridePlaceholder}
      disabledDate={disabledDate}
    />
  );
};

function buildFieldValue(
  question: QuestionDataModel,
  answer?: AnswerQuestionDataModel,
) {
  if (!answer) {
    return undefined;
  }

  const selectedOptionIds = (answer.selected_option_ids ?? []).map(String);
  const answerText = answer.answer_text ?? "";

  switch (question.input_type) {
    case "CHECKBOX":
      return selectedOptionIds;

    case "SELECT":
    case "RADIO": {
      if (selectedOptionIds[0]) {
        return selectedOptionIds[0];
      }
      if (answerText && question.options) {
        const normalized = answerText.trim().toLowerCase();
        const matched = question.options.find((opt) => {
          const optId = String(opt.id || "").toLowerCase();
          const optVal = String(opt.value || "").toLowerCase();
          const optLabel = String(opt.label || "").toLowerCase();
          return (
            optId === normalized ||
            optVal === normalized ||
            optLabel === normalized ||
            (normalized.includes("ya") && optLabel.includes("ya")) ||
            (normalized.includes("tidak") && optLabel.includes("tidak")) ||
            (normalized.includes("yes") && optVal === "yes") ||
            (normalized.includes("no") && optVal === "no")
          );
        });
        if (matched) {
          return matched.id ?? matched.value;
        }
      }
      return undefined;
    }

    case "DATE": {
      if (!answerText) {
        return undefined;
      }

      const parsed = dayjs(answerText);
      return parsed.isValid() ? parsed : undefined;
    }

    case "NUMBER":
      return answerText !== "" && !Number.isNaN(Number(answerText))
        ? Number(answerText)
        : undefined;

    default:
      return answerText || undefined;
  }
}

function buildInitialFormValues(
  baseQuestions: QuestionDataModel[],
  answerByQuestionId: Map<string, AnswerQuestionDataModel>,
  allowMultipleSubmissions: boolean,
  currentUser?: UserDataModel | null,
) {
  if (allowMultipleSubmissions) {
    return {};
  }

  const values: Record<string, unknown> = {};

  baseQuestions.forEach((question) => {
    const answer = answerByQuestionId.get(String(question.id));
    const fieldValue = buildFieldValue(question, answer);

    if (fieldValue !== undefined) {
      values[String(question.id)] = fieldValue;
    } else if (currentUser) {
      const qText = (question.text || "").toLowerCase();
      const qId = String(question.id);

      // (A) Nomor telepon / WhatsApp dari pendaftaran Admisi
      const isPhoneQuestion =
        qId === "q_pd_12" ||
        question.input_type === "PHONE" ||
        qText.includes("nomor telepon") ||
        qText.includes("no. telepon") ||
        qText.includes("no telepon") ||
        qText.includes("no. hp") ||
        qText.includes("no hp") ||
        qText.includes("whatsapp") ||
        qText.includes("phone number");

      if (isPhoneQuestion && currentUser.no_phone && currentUser.no_phone.trim()) {
        values[qId] = currentUser.no_phone.trim();
      }

      // (B) Nama Lengkap dari pendaftaran Admisi
      const isNameQuestion =
        qId === "q_pd_01" ||
        qText.includes("nama lengkap sesuai paspor / ktp") ||
        qText.includes("nama lengkap") ||
        qText.includes("full name");

      if (isNameQuestion && currentUser.name && currentUser.name.trim()) {
        values[qId] = currentUser.name.trim();
      }

      // (C) Email dari pendaftaran Admisi
      const isEmailQuestion =
        question.input_type === "EMAIL" ||
        qText.includes("email");

      if (isEmailQuestion && currentUser.email && currentUser.email.trim()) {
        values[qId] = currentUser.email.trim();
      }
    }
  });

  return values;
}

export default function FormUploadDocumentComponent() {
  const queryClient = useQueryClient();
  const { notification } = App.useApp();
  const [form] = Form.useForm();
  const [submittingSection, setSubmittingSection] = useState<string | null>(
    null,
  );
  const isSubmittingRef = useRef<boolean>(false);
  const [activeTab, setActiveTab] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    try {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab) return urlTab;
      return loadActiveTabFromStorage() || undefined;
    } catch {
      return undefined;
    }
  });

  const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(
    null,
  );
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [isConfirmEditModalOpen, setIsConfirmEditModalOpen] =
    useState<boolean>(false);
  const [pendingEditValues, setPendingEditValues] =
    useState<Record<string, unknown> | null>(null);
  const [expandedDetailSubIds, setExpandedDetailSubIds] = useState<Set<string>>(
    new Set(),
  );

  const [drafts, setDrafts] = useState<Record<string, BaseDraft>>({});
  const [draftsLoaded, setDraftsLoaded] = useState(false);
  const isInitialDraftsLoaded = useRef(false);
  const draftsRef = useRef<Record<string, BaseDraft>>({});
  draftsRef.current = drafts;

  const { user_id } = useAuth();
  const { data: currentUser } = useUser({ id: user_id });
  const { onUpdate: onUpdateUser } = useUpdateUser();
  const { data: bases, fetchLoading: basesLoading } = useQuestionBases({});

  const { open: tourOpen, close: closeTour, restart: restartTour } = usePageTour(
    "student_tour_personal_info_done",
  );

  const tourSteps: TourProps["steps"] = [
    {
      title: "Personal Information",
      description:
        "Halaman ini untuk mengisi data diri kamu yang diperlukan dalam proses aplikasi visa.",
      target: null,
    },
    {
      title: "Tab Kategori",
      description:
        "Setiap tab berisi kategori pertanyaan yang berbeda. Pastikan semua tab sudah diisi dengan lengkap.",
      target: () => document.getElementById("personal-info-tabs")!,
      placement: "bottom",
    },
    {
      title: "Isi Jawaban Baru",
      description:
        "Klik tombol ini untuk mereset form dan mengisi jawaban baru. Section ini mendukung multiple submissions.",
      target: () => document.getElementById("personal-info-add-btn")!,
      placement: "left",
    },
    {
      title: "Kolom Isian",
      description:
        "Isi semua kolom yang ditandai bintang (*). Kolom ini wajib diisi sebelum menyimpan data.",
      target: () => document.getElementById("personal-info-form-fields")!,
      placement: "top",
    },
    {
      title: "Simpan Jawaban",
      description:
        "Setelah melengkapi seluruh kolom yang tersedia, klik tombol ini untuk menyimpan data Anda ke sistem.",
      target: () => document.getElementById("personal-info-submit-btn")!,
      placement: "top",
    },
  ];

  useEffect(() => {
    if (!bases?.length) return;
    const urlTab =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("tab")
        : null;

    const resolved = resolveActiveTab(
      bases,
      currentUser?.id,
      draftsRef.current,
      activeTab || urlTab,
    );

    if (resolved && resolved !== activeTab) {
      setActiveTab(resolved);
      saveActiveTabToStorage(currentUser?.id, resolved);
      syncTabToUrl(resolved);
    }
  }, [activeTab, bases, currentUser?.id]);

  useEffect(() => {
    if (currentUser?.id && !isInitialDraftsLoaded.current) {
      const loaded = loadDraftsFromStorage(currentUser.id);
      setDrafts(loaded);
      draftsRef.current = loaded;
      isInitialDraftsLoaded.current = true;
      setDraftsLoaded(true);

      if (bases?.length) {
        const storedTab = loadActiveTabFromStorage(currentUser.id);
        const resolved = resolveActiveTab(
          bases,
          currentUser.id,
          loaded,
          storedTab || activeTab,
        );
        if (resolved && resolved !== activeTab) {
          setActiveTab(resolved);
          saveActiveTabToStorage(currentUser.id, resolved);
          syncTabToUrl(resolved);
        }
      }
    }
  }, [currentUser?.id, bases, activeTab]);

  const resolvedBaseId = useMemo(() => {
    if (!bases?.length) {
      return undefined;
    }

    const baseIds = new Set(bases.map((base) => String(base.id)));
    return activeTab && baseIds.has(activeTab)
      ? activeTab
      : String(bases[0].id);
  }, [activeTab, bases]);

  const { data: questions, fetchLoading: questionsLoading } = useQuestions({
    queryString: resolvedBaseId ? `base_id=${resolvedBaseId}` : undefined,
  });

  const { data: answerQuestions } = useAnswerQuestions({
    queryString: currentUser?.id ? `student_id=${currentUser.id}` : undefined,
    enabled: Boolean(currentUser?.id),
    withNotification: false,
  });

  const {
    onCreate: createAnswerQuestion,
    onCreateLoading: creatingAnswerQuestion,
    onUpdate: updateAnswerQuestion,
    onUpdateLoading: updatingAnswerQuestion,
    onDelete: deleteAnswerQuestion,
    onDeleteLoading: deletingAnswerQuestion,
  } = useAnswerQuestions({
    enabled: false,
    withNotification: false,
  });

  const { data: allQuestions } = useQuestions({});
  const [isGeneratingProfileSummary, setIsGeneratingProfileSummary] = useState(false);

  const handleGenerateStudentProfileSummary = async () => {
    setIsGeneratingProfileSummary(true);
    try {
      const cvData = extractStudentCvData(
        currentUser,
        answerQuestions ?? [],
        allQuestions ?? questions ?? [],
        bases,
      );
      const summary = await generateProfileSummaryText({
        fullName:
          currentUser?.name ||
          `${cvData.first_name || ""} ${cvData.last_name || ""}`.trim(),
        jobTitle:
          currentUser?.degree ||
          currentUser?.name_degree ||
          cvData.job_title,
        educations: cvData.educations,
        experiences: cvData.experiences,
        skills: cvData.skills,
      });

      form.setFieldValue("q_pd_19", summary);
      notification.success({
        message: "Ringkasan Profil Terbuat",
        description:
          "Ringkasan profil profesional dalam bahasa Inggris berhasil disusun. Anda dapat meninjau dan menyesuaikannya.",
      });
    } catch {
      notification.error({
        message: "Gagal Menyusun Profil",
        description:
          "Terjadi kendala saat menyusun ringkasan profil dengan AI.",
      });
    } finally {
      setIsGeneratingProfileSummary(false);
    }
  };

  const answerByQuestionId = useMemo(() => {
    const map = new Map<string, AnswerQuestionDataModel>();

    (answerQuestions ?? []).forEach((answer) => {
      if (!answer?.question_id) {
        return;
      }

      const key = String(answer.question_id);
      const existing = map.get(key);

      if (!existing) {
        map.set(key, answer);
        return;
      }

      const existingTime = Date.parse(existing.created_at ?? "");
      const nextTime = Date.parse(answer.created_at ?? "");

      if (Number.isNaN(existingTime) || nextTime > existingTime) {
        map.set(key, answer);
      }
    });

    return map;
  }, [answerQuestions]);

  const normalizeAnswerText = (value: unknown) => {
    if (value === undefined || value === null) {
      return undefined;
    }

    if (dayjs.isDayjs(value)) {
      return (value as Dayjs).toISOString();
    }

    if (typeof value === "string") {
      return value.trim();
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }

    return String(value);
  };

  const questionsByBaseId = useMemo(() => {
    const grouped = new Map<string, QuestionDataModel[]>();

    (questions ?? []).forEach((question) => {
      const key = String(question.base_id);
      const existing = grouped.get(key) ?? [];
      existing.push(question);
      grouped.set(key, existing);
    });

    const pdKey = "qb_personal_details";
    const pdList = grouped.get(pdKey) ?? [];
    if (pdList.length > 0 || bases?.some((b) => String(b.id) === pdKey)) {
      const existingIds = new Set(pdList.map((q) => String(q.id)));
      let updated = false;
      DEFAULT_PERSONAL_DETAILS_QUESTIONS.forEach((q) => {
        if (!existingIds.has(String(q.id))) {
          pdList.push({ ...q, base_id: pdKey });
          updated = true;
        }
      });
      if (updated) {
        pdList.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        grouped.set(pdKey, pdList);
      }
    }

    const nfeKey = "qb_nonformal_education";
    const nfeList = grouped.get(nfeKey) ?? [];
    if (nfeList.length > 0 || bases?.some((b) => String(b.id) === nfeKey)) {
      const existingIds = new Set(nfeList.map((q) => String(q.id)));
      let updated = false;
      DEFAULT_NONFORMAL_QUESTIONS.forEach((q) => {
        if (!existingIds.has(String(q.id))) {
          nfeList.push({ ...q, base_id: nfeKey });
          updated = true;
        }
      });
      if (updated) {
        nfeList.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
        grouped.set(nfeKey, nfeList);
      }
    }

    return grouped;
  }, [questions]);

  const activeBase = useMemo(() => {
    return (bases ?? []).find((base) => String(base.id) === String(resolvedBaseId));
  }, [bases, resolvedBaseId]);

  const activeBaseQuestions = useMemo(() => {
    if (!resolvedBaseId) {
      return [];
    }

    const list = [...(questionsByBaseId.get(String(resolvedBaseId)) ?? [])];
    const baseName = (activeBase?.name ?? "").toLowerCase();
    const isPd =
      String(resolvedBaseId) === "qb_personal_details" ||
      baseName.includes("personal") ||
      baseName.includes("pribadi") ||
      list.some((q) => String(q.id).startsWith("q_pd_"));

    if (isPd) {
      const existingIds = new Set(list.map((q) => String(q.id)));
      DEFAULT_PERSONAL_DETAILS_QUESTIONS.forEach((q) => {
        if (!existingIds.has(String(q.id))) {
          list.push({ ...q, base_id: resolvedBaseId });
        }
      });
      list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }

    const isNfe =
      String(resolvedBaseId) === "qb_nonformal_education" ||
      baseName.includes("nonformal") ||
      baseName.includes("kursus") ||
      baseName.includes("pelatihan") ||
      list.some((q) => String(q.id).startsWith("q_nfe_"));

    if (isNfe) {
      const existingIds = new Set(list.map((q) => String(q.id)));
      DEFAULT_NONFORMAL_QUESTIONS.forEach((q) => {
        if (!existingIds.has(String(q.id))) {
          list.push({ ...q, base_id: resolvedBaseId });
        }
      });
      list.sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
    }

    return list;
  }, [activeBase, questionsByBaseId, resolvedBaseId]);

  const allowMultipleSubmissions = Boolean(
    activeBase?.allow_multiple_submissions,
  );

  const submissionsByBaseId = useMemo(() => {
    const map = new Map<string, SubmissionEntry[]>();
    (bases ?? []).forEach((base) => {
      if (base.allow_multiple_submissions) {
        const bQuestions = questionsByBaseId.get(String(base.id)) ?? [];
        map.set(
          String(base.id),
          groupSubmissionsForBase(bQuestions, answerQuestions ?? []),
        );
      }
    });
    return map;
  }, [bases, questionsByBaseId, answerQuestions]);

  const handleStartEdit = (entry: SubmissionEntry) => {
    setEditingSubmissionId(entry.submissionId);
    setEditingTitle(entry.title || "Data");

    const values: Record<string, unknown> = {};
    activeBaseQuestions.forEach((q) => {
      const ans = entry.answersMap.get(String(q.id));
      const val = buildFieldValue(q, ans);
      if (val !== undefined) {
        values[String(q.id)] = val;
      }
    });

    const { nextValues: harmonizedValues } = harmonizeEmploymentDatesAndStatus(
      values,
      activeBaseQuestions,
      undefined,
      resolvedBaseId,
    );

    form.setFieldsValue(harmonizedValues);

    if (resolvedBaseId) {
      setDrafts((prev) => {
        const updatedDraft: BaseDraft = {
          values: harmonizedValues,
          editingSubmissionId: entry.submissionId,
          editingTitle: entry.title || "Data",
          updatedAt: Date.now(),
        };
        const next = {
          ...prev,
          [resolvedBaseId]: updatedDraft,
        };
        saveDraftsToStorage(currentUser?.id, next);
        draftsRef.current = next;
        return next;
      });
    }

    const element = document.getElementById("personal-info-form-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCancelEdit = () => {
    if (resolvedBaseId) {
      clearDraftFromStorage(currentUser?.id, resolvedBaseId);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[resolvedBaseId];
        saveDraftsToStorage(currentUser?.id, next);
        draftsRef.current = next;
        return next;
      });
    }
    setEditingSubmissionId(null);
    setEditingTitle(null);
    setPendingEditValues(null);
    setIsConfirmEditModalOpen(false);
    form.resetFields(activeBaseQuestions.map((q) => String(q.id)));
  };

  const handleAddNew = () => {
    if (resolvedBaseId) {
      clearDraftFromStorage(currentUser?.id, resolvedBaseId);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[resolvedBaseId];
        saveDraftsToStorage(currentUser?.id, next);
        draftsRef.current = next;
        return next;
      });
    }
    setEditingSubmissionId(null);
    setEditingTitle(null);
    setPendingEditValues(null);
    setIsConfirmEditModalOpen(false);
    form.resetFields(activeBaseQuestions.map((q) => String(q.id)));

    const element = document.getElementById("personal-info-form-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleDeleteEntry = async (entry: SubmissionEntry) => {
    try {
      const deleteTasks = Array.from(entry.answersMap.values()).map((ans) =>
        deleteAnswerQuestion(ans.id),
      );
      await Promise.all(deleteTasks);
      await queryClient.invalidateQueries({ queryKey: ["answer-questions"] });

      if (editingSubmissionId === entry.submissionId) {
        handleCancelEdit();
      }

      notification.success({
        message: "Data berhasil dihapus",
        description: `Riwayat ${entry.title} telah dihapus dari sistem.`,
      });
    } catch (err) {
      notification.error({
        message: "Gagal menghapus data",
        description:
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat menghapus data.",
      });
    }
  };

  const handleTabChange = (targetTabKey: string) => {
    if (targetTabKey === activeTab) return;

    // 1. Simpan draf dari tab yang sedang ditinggalkan jika terdapat nilai
    if (resolvedBaseId) {
      const currentValues = form.getFieldsValue();
      if (hasMeaningfulValues(currentValues)) {
        setDrafts((prev) => {
          const next = {
            ...prev,
            [resolvedBaseId]: {
              values: currentValues,
              editingSubmissionId: editingSubmissionId || undefined,
              editingTitle: editingTitle || undefined,
              updatedAt: Date.now(),
            },
          };
          saveDraftsToStorage(currentUser?.id, next);
          draftsRef.current = next;
          return next;
        });
      }
    }

    // 2. Ubah tab aktif
    setActiveTab(targetTabKey);
    saveActiveTabToStorage(currentUser?.id, targetTabKey);
    syncTabToUrl(targetTabKey);

    // 3. Muat draf tab tujuan jika ada, atau nilai default
    const targetDraft = draftsRef.current[targetTabKey];
    if (targetDraft && hasMeaningfulValues(targetDraft.values)) {
      if (targetDraft.editingSubmissionId) {
        setEditingSubmissionId(targetDraft.editingSubmissionId);
        setEditingTitle(targetDraft.editingTitle ?? null);
      } else {
        setEditingSubmissionId(null);
        setEditingTitle(null);
      }
      const targetQuestions = questionsByBaseId.get(targetTabKey) ?? [];
      const { nextValues: harmonizedDraft } = harmonizeEmploymentDatesAndStatus(
        targetDraft.values,
        targetQuestions,
        undefined,
        targetTabKey,
      );
      form.setFieldsValue(harmonizedDraft);
    } else {
      setEditingSubmissionId(null);
      setEditingTitle(null);
      const targetBase = (bases ?? []).find(
        (b) => String(b.id) === targetTabKey,
      );
      const targetQuestions = questionsByBaseId.get(targetTabKey) ?? [];

      if (targetBase?.allow_multiple_submissions) {
        form.resetFields(targetQuestions.map((q) => String(q.id)));
      } else {
        const initVals = buildInitialFormValues(
          targetQuestions,
          answerByQuestionId,
          false,
          currentUser,
        );
        form.setFieldsValue(initVals);
      }
    }
  };

  useEffect(() => {
    if (!resolvedBaseId || !activeBaseQuestions.length) {
      form.resetFields();
      return;
    }

    // Cek apakah ada draf tersimpan untuk tab ini
    const activeDraft = draftsRef.current[resolvedBaseId];
    if (activeDraft && hasMeaningfulValues(activeDraft.values)) {
      if (activeDraft.editingSubmissionId) {
        setEditingSubmissionId(activeDraft.editingSubmissionId);
        setEditingTitle(activeDraft.editingTitle ?? null);
      }
      const { nextValues: harmonizedDraft } = harmonizeEmploymentDatesAndStatus(
        activeDraft.values,
        activeBaseQuestions,
        undefined,
        resolvedBaseId,
      );
      form.setFieldsValue(harmonizedDraft);
      return;
    }

    if (allowMultipleSubmissions && editingSubmissionId) {
      return;
    }

    const values = buildInitialFormValues(
      activeBaseQuestions,
      answerByQuestionId,
      allowMultipleSubmissions,
      currentUser,
    );
    form.setFieldsValue(values);
  }, [
    activeBaseQuestions,
    allowMultipleSubmissions,
    answerByQuestionId,
    currentUser,
    draftsLoaded,
    editingSubmissionId,
    form,
    resolvedBaseId,
  ]);

  const executeSaveAnswers = async (
    values: Record<string, unknown>,
    targetSubmissionId: string | null,
  ) => {
    if (!currentUser?.id || !resolvedBaseId) {
      isSubmittingRef.current = false;
      setSubmittingSection(null);
      return;
    }

    isSubmittingRef.current = true;
    setSubmittingSection(resolvedBaseId);

    try {
      const isEditMode = Boolean(targetSubmissionId);
      const subId =
        targetSubmissionId ||
        `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

      const currentEntries =
        submissionsByBaseId.get(String(resolvedBaseId)) ?? [];
      const existingEntry = isEditMode
        ? currentEntries.find((e) => e.submissionId === targetSubmissionId)
        : null;

      const tasks = activeBaseQuestions.map(async (question) => {
        const rawValue = values?.[String(question.id)];
        const isOptionType = ["SELECT", "RADIO", "CHECKBOX"].includes(
          question.input_type,
        );

        let payload: {
          submission_id?: string;
          answer_text?: string;
          selected_option_ids?: string[];
        } | null = null;

        if (isOptionType) {
          const selected = Array.isArray(rawValue)
            ? rawValue.filter(Boolean)
            : rawValue
              ? [rawValue]
              : [];
          const selectedIds = selected.map((v) => String(v));

          if (!selectedIds.length && !question.required) {
            return null;
          }

          payload = {
            submission_id: subId,
            selected_option_ids: selectedIds,
          };
        } else {
          const answerText = normalizeAnswerText(rawValue);

          if (!answerText && !question.required) {
            return null;
          }

          payload = {
            submission_id: subId,
            answer_text: answerText ?? "",
          };
        }

        if (isEditMode && existingEntry) {
          const existingAns = existingEntry.answersMap.get(
            String(question.id),
          );
          if (existingAns) {
            return updateAnswerQuestion({
              id: existingAns.id,
              payload: {
                ...payload,
                submission_id: subId,
              },
            });
          }
        }

        return createAnswerQuestion({
          question_id: String(question.id),
          student_id: String(currentUser.id),
          submission_id: subId,
          ...payload,
        });
      });

      await Promise.all(tasks);
      await queryClient.invalidateQueries({ queryKey: ["answer-questions"] });

      // Bersihkan draf setelah berhasil disimpan
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[resolvedBaseId];
        saveDraftsToStorage(currentUser?.id, next);
        draftsRef.current = next;
        return next;
      });
      clearDraftFromStorage(currentUser?.id, resolvedBaseId);

      if (isEditMode) {
        notification.success({
          message: "Perubahan berhasil disimpan",
          description: `Data ${editingTitle || activeBase?.name || "pendidikan"} berhasil diperbarui.`,
        });
        setIsConfirmEditModalOpen(false);
        setEditingSubmissionId(null);
        setEditingTitle(null);
        setPendingEditValues(null);
        form.resetFields(activeBaseQuestions.map((q) => String(q.id)));
      } else {
        notification.success({
          message: "Data berhasil disimpan",
          description: `Data baru berhasil ditambahkan ke riwayat ${activeBase?.name || "pendidikan"}.`,
        });
        form.resetFields(activeBaseQuestions.map((q) => String(q.id)));
      }
    } catch (error) {
      notification.error({
        message: "Gagal menyimpan data",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmittingSection(null);
    }
  };

  const handleSubmitAnswers = async (
    baseId: string,
    baseQuestions: QuestionDataModel[],
    allowMultipleSubmissions: boolean,
    values: Record<string, unknown>,
  ) => {
    if (!currentUser?.id) {
      notification.error({
        message: "Pengguna tidak ditemukan",
        description: "Silakan login ulang sebelum mengirim jawaban.",
      });
      return;
    }

    // Pastikan submit hanya diproses untuk tab yang sedang aktif
    if (String(baseId) !== String(resolvedBaseId)) {
      return;
    }

    // Synchronous mutex lock untuk mencegah double submit
    if (isSubmittingRef.current || submittingSection) {
      return;
    }
    isSubmittingRef.current = true;
    setSubmittingSection(baseId);

    if (allowMultipleSubmissions) {
      if (editingSubmissionId) {
        setPendingEditValues(values);
        setIsConfirmEditModalOpen(true);
        isSubmittingRef.current = false;
        setSubmittingSection(null);
        return;
      }

      await executeSaveAnswers(values, null);
      return;
    }

    try {
      const tasks = baseQuestions.map(async (question) => {
        const rawValue = values?.[String(question.id)];
        const isOptionType = ["SELECT", "RADIO", "CHECKBOX"].includes(
          question.input_type,
        );

        let payload: {
          answer_text?: string;
          selected_option_ids?: string[];
        } | null = null;

        if (isOptionType) {
          const selected = Array.isArray(rawValue)
            ? rawValue.filter(Boolean)
            : rawValue
              ? [rawValue]
              : [];

          const selectedIds = selected.map((value) => String(value));

          if (!selectedIds.length && !question.required) {
            return null;
          }

          payload = {
            selected_option_ids: selectedIds,
          };
        } else {
          const answerText = normalizeAnswerText(rawValue);

          if (!answerText && !question.required) {
            return null;
          }

          payload = {
            answer_text: answerText ?? "",
          };
        }

        const existing = answerByQuestionId.get(String(question.id));
        if (existing && !allowMultipleSubmissions) {
          return updateAnswerQuestion({
            id: existing.id,
            payload,
          });
        }

        return createAnswerQuestion({
          question_id: String(question.id),
          student_id: String(currentUser.id),
          ...payload,
        });
      });

      const results = await Promise.all(tasks);
      const submitted = results.filter(Boolean).length;

      // Sinkronkan Nama KTP (q_pd_01) ke nama akun profil jika diisi/diperbarui
      const ktpNameQuestion = baseQuestions.find(
        (q) =>
          String(q.id) === "q_pd_01" ||
          (q.text && q.text.toLowerCase().includes("nama lengkap sesuai paspor / ktp")),
      );
      if (ktpNameQuestion) {
        const rawKtpName = values?.[String(ktpNameQuestion.id)];
        const normalizedKtpName = normalizeAnswerText(rawKtpName);
        if (
          normalizedKtpName &&
          typeof normalizedKtpName === "string" &&
          normalizedKtpName.trim() &&
          normalizedKtpName.trim() !== currentUser.name
        ) {
          try {
            await onUpdateUser({
              id: currentUser.id,
              payload: { name: normalizedKtpName.trim() },
            });
          } catch (syncErr) {
            console.error("Gagal sinkron nama KTP ke profil:", syncErr);
          }
        }
      }

      // Sinkronkan Nomor Telepon (q_pd_12 / PHONE) ke profil jika diedit/diperbarui oleh siswa
      const phoneQuestion = baseQuestions.find((q) => {
        const qId = String(q.id);
        const qText = (q.text || "").toLowerCase();
        return (
          qId === "q_pd_12" ||
          q.input_type === "PHONE" ||
          qText.includes("nomor telepon") ||
          qText.includes("no. telepon") ||
          qText.includes("no telepon") ||
          qText.includes("no. hp") ||
          qText.includes("no hp") ||
          qText.includes("whatsapp") ||
          qText.includes("phone number")
        );
      });
      if (phoneQuestion) {
        const rawPhone = values?.[String(phoneQuestion.id)];
        const normalizedPhone = normalizeAnswerText(rawPhone);
        if (
          normalizedPhone &&
          typeof normalizedPhone === "string" &&
          normalizedPhone.trim() &&
          normalizedPhone.trim() !== (currentUser.no_phone || "").trim()
        ) {
          try {
            await onUpdateUser({
              id: currentUser.id,
              payload: { no_phone: normalizedPhone.trim() },
            });
          } catch (syncErr) {
            console.error("Gagal sinkron nomor telepon ke profil:", syncErr);
          }
        }
      }

      const refreshedValues = buildInitialFormValues(
        baseQuestions,
        new Map(
          baseQuestions.map((question) => {
            const existing = answerByQuestionId.get(String(question.id));
            const rawValue = values?.[String(question.id)];

            const fakeAnswer: AnswerQuestionDataModel = {
              id: existing?.id ?? "",
              question_id: String(question.id),
              answer_text: ["SELECT", "RADIO", "CHECKBOX"].includes(
                question.input_type,
              )
                ? undefined
                : normalizeAnswerText(rawValue),
              selected_option_ids: ["CHECKBOX"].includes(question.input_type)
                ? Array.isArray(rawValue)
                  ? rawValue.map(String)
                  : []
                : ["SELECT", "RADIO"].includes(question.input_type) &&
                    rawValue
                  ? [String(rawValue)]
                  : [],
              created_at: existing?.created_at ?? new Date().toISOString(),
            };

            return [String(question.id), fakeAnswer];
          }),
        ),
        false,
        currentUser,
      );

      form.setFieldsValue(refreshedValues);

      // Bersihkan draf setelah berhasil disimpan
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[baseId];
        saveDraftsToStorage(currentUser?.id, next);
        draftsRef.current = next;
        return next;
      });
      clearDraftFromStorage(currentUser?.id, baseId);

      notification.success({
        message: "Jawaban berhasil disimpan",
        description: submitted
          ? `${submitted} jawaban berhasil disubmit dan field tetap terisi.`
          : "Tidak ada perubahan jawaban yang dikirim.",
      });
    } catch (error) {
      notification.error({
        message: "Gagal submit jawaban",
        description:
          error instanceof Error ? error.message : "Coba lagi beberapa saat.",
      });
    } finally {
      isSubmittingRef.current = false;
      setSubmittingSection(null);
    }
  };

  const items = (bases ?? []).map((base) => {
    const baseQuestions = questionsByBaseId.get(String(base.id)) ?? [];
    const baseAllowMultiple = Boolean(base.allow_multiple_submissions);
    const currentBaseEntries = submissionsByBaseId.get(String(base.id)) ?? [];

    return {
      key: String(base.id),
      label: cleanSlashText(base.name),
      children: (
        <Form
          form={form}
          key={base.id}
          layout="vertical"
          onValuesChange={(changed, allValues) => {
            if (!resolvedBaseId) return;

            const changedKey = Object.keys(changed || {})[0];
            const { nextValues, forcedStillWorkingValue, shouldClearEndDate } =
              harmonizeEmploymentDatesAndStatus(
                allValues,
                baseQuestions,
                changedKey,
                String(base.id),
              );

            if (forcedStillWorkingValue !== undefined) {
              const stillWorkingQ = baseQuestions.find(isStillWorkingQuestion);
              if (stillWorkingQ) {
                form.setFieldValue(
                  String(stillWorkingQ.id),
                  forcedStillWorkingValue,
                );
              }
            }

            if (shouldClearEndDate) {
              const workEndDateQ = baseQuestions.find((q) =>
                isWorkEndDateQuestion(q, String(base.id)),
              );
              if (workEndDateQ) {
                form.setFieldValue(String(workEndDateQ.id), undefined);
              }
            }

            setDrafts((prev) => {
              const updatedDraft: BaseDraft = {
                values: nextValues,
                editingSubmissionId: editingSubmissionId || undefined,
                editingTitle: editingTitle || undefined,
                updatedAt: Date.now(),
              };
              const next = {
                ...prev,
                [resolvedBaseId]: updatedDraft,
              };
              saveDraftsToStorage(currentUser?.id, next);
              draftsRef.current = next;
              return next;
            });

            saveActiveTabToStorage(currentUser?.id, resolvedBaseId);
            syncTabToUrl(resolvedBaseId);
          }}
          onFinish={(values) =>
            handleSubmitAnswers(
              String(base.id),
              baseQuestions,
              baseAllowMultiple,
              values,
            )
          }
        >
          {baseAllowMultiple && currentBaseEntries.length > 0 ? (
            <div style={{ marginBottom: 24 }}>
              <div className={styles.historySectionHeader}>
                <Space align="center" size={8}>
                  <h3 className={styles.historyTitle}>
                    Riwayat Tersimpan
                  </h3>
                  <Badge
                    count={currentBaseEntries.length}
                    className={styles.historyBadge}
                  />
                </Space>
                <AppButton
                  id="personal-info-add-btn"
                  variant="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={handleAddNew}
                >
                  Tambah
                </AppButton>
              </div>

              <Space
                direction="vertical"
                size={12}
                style={{ width: "100%", marginBottom: 16 }}
              >
                {currentBaseEntries.map((entry) => {
                    const isExpanded = expandedDetailSubIds.has(
                      entry.submissionId,
                    );
                    const isCurrentlyEditing =
                      editingSubmissionId === entry.submissionId;

                    return (
                      <Card
                        key={entry.submissionId}
                        size="small"
                        style={{
                          borderRadius: 10,
                          borderColor: isCurrentlyEditing
                            ? "#2563eb"
                            : "#e2e8f0",
                          background: isCurrentlyEditing
                            ? "#f0f7ff"
                            : "#ffffff",
                          boxShadow: isCurrentlyEditing
                            ? "0 0 0 2px rgba(37, 99, 235, 0.15)"
                            : "0 1px 3px rgba(15, 23, 42, 0.04)",
                          transition: "all 0.2s ease",
                        }}
                        styles={{ body: { padding: "12px 16px" } }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: 12,
                            width: "100%",
                          }}
                        >
                          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                flexWrap: "wrap",
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#1e293b",
                                  lineHeight: 1.35,
                                  wordBreak: "break-word",
                                }}
                              >
                                {entry.title}
                              </span>
                              {entry.badge ? (
                                <Tag
                                  style={{
                                    borderRadius: 4,
                                    fontSize: 10.5,
                                    lineHeight: "16px",
                                    height: 18,
                                    padding: "0 6px",
                                    fontWeight: 600,
                                    margin: 0,
                                    border: "1px solid #bfdbfe",
                                    backgroundColor: "#eff6ff",
                                    color: "#1d4ed8",
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                >
                                  {formatBadgeEnglish(entry.badge)}
                                </Tag>
                              ) : null}
                              {isCurrentlyEditing ? (
                                <Tag
                                  style={{
                                    borderRadius: 4,
                                    fontSize: 10.5,
                                    lineHeight: "16px",
                                    height: 18,
                                    padding: "0 6px",
                                    fontWeight: 600,
                                    margin: 0,
                                    border: "1px solid #fed7aa",
                                    backgroundColor: "#fff7ed",
                                    color: "#c2410c",
                                    display: "inline-flex",
                                    alignItems: "center",
                                  }}
                                >
                                  Sedang Diedit
                                </Tag>
                              ) : null}
                            </div>
                            {entry.subtitle ? (
                              <div
                                style={{
                                  fontSize: 11.5,
                                  color: "#64748b",
                                  marginTop: 2,
                                  lineHeight: 1.35,
                                }}
                              >
                                {entry.subtitle}
                              </div>
                            ) : null}
                          </div>

                          <Space size={6} style={{ flexShrink: 0, marginLeft: 8 }}>
                            <AppButton
                              variant={isCurrentlyEditing ? "primary" : "secondary"}
                              size="small"
                              icon={<EditOutlined />}
                              onClick={() => handleStartEdit(entry)}
                            >
                              {isCurrentlyEditing ? "Sedang Diubah" : "Ubah"}
                            </AppButton>
                            <Popconfirm
                              title="Hapus Data Ini?"
                              description="Apakah Anda yakin ingin menghapus data ini? Data yang dihapus tidak dapat dikembalikan."
                              okText="Hapus"
                              cancelText="Batal"
                              okButtonProps={{
                                danger: true,
                                style: { height: 28, borderRadius: 6, fontSize: 11.5 },
                              }}
                              cancelButtonProps={{ style: { height: 28, borderRadius: 6, fontSize: 11.5 } }}
                              onConfirm={() => handleDeleteEntry(entry)}
                            >
                              <AppButton
                                variant="danger"
                                size="small"
                                icon={<DeleteOutlined />}
                                loading={deletingAnswerQuestion}
                              >
                                Hapus
                              </AppButton>
                            </Popconfirm>
                          </Space>
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            borderTop: "1px dashed #e2e8f0",
                            paddingTop: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography.Text
                              type="secondary"
                              style={{ fontSize: 11.5 }}
                            >
                              {entry.details.length} data terisi
                            </Typography.Text>
                            <Button
                              type="link"
                              size="small"
                              style={{
                                padding: 0,
                                fontSize: 11.5,
                                height: "auto",
                              }}
                              onClick={() => {
                                setExpandedDetailSubIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(entry.submissionId)) {
                                    next.delete(entry.submissionId);
                                  } else {
                                    next.add(entry.submissionId);
                                  }
                                  return next;
                                });
                              }}
                            >
                              {isExpanded
                                ? "Sembunyikan Rincian"
                                : "Lihat Rincian Selengkapnya"}
                            </Button>
                          </div>

                          {isExpanded ? (
                            <div
                              style={{
                                marginTop: 10,
                                padding: "12px 16px",
                                borderRadius: 8,
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                              }}
                            >
                              <Row gutter={[16, 10]}>
                                {entry.details.map((item, idx) => (
                                  <Col key={idx} xs={24} sm={12}>
                                    <div
                                      style={{
                                        fontSize: 11.5,
                                        color: "#64748b",
                                      }}
                                    >
                                      {item.questionText}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 12.5,
                                        fontWeight: 500,
                                        color: "#334155",
                                      }}
                                    >
                                      {item.answerText}
                                    </div>
                                  </Col>
                                ))}
                              </Row>
                            </div>
                          ) : null}
                        </div>
                      </Card>
                    );
                  })}
                </Space>

                <Divider style={{ margin: "20px 0" }} />
              </div>
            ) : null}

          <div id="personal-info-form-section">
            {baseAllowMultiple && editingSubmissionId ? (
              <Alert
                message={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <span>
                      <b>Mode Ubah Data:</b> Mengubah data{" "}
                      <i>{editingTitle || "Riwayat"}</i>
                    </span>
                    <AppButton
                      variant="secondary"
                      size="small"
                      onClick={handleCancelEdit}
                    >
                      Batal Ubah
                    </AppButton>
                  </div>
                }
                description="Silakan sesuaikan kolom yang ingin diubah. Ketikan Anda tetap tersimpan saat berpindah tab. Jendela konfirmasi akan muncul sebelum data disimpan."
                type="info"
                showIcon
                style={{
                  marginBottom: 16,
                  borderRadius: 10,
                  border: "1px solid #bfdbfe",
                  background: "#eff6ff",
                }}
              />
            ) : baseAllowMultiple && currentBaseEntries.length > 0 ? (
              <div style={{ marginBottom: 16 }}>
                <Typography.Title
                  level={5}
                  style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#1e293b" }}
                >
                  Tambah Riwayat Baru
                </Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: 11.5 }}>
                  Lengkapi formulir di bawah ini untuk menambahkan riwayat baru.
                </Typography.Text>
              </div>
            ) : null}

            <div id="personal-info-form-fields">
              <Row gutter={[16, 0]}>
                {baseQuestions.map((question) => {
                  const isEndDate = isWorkEndDateQuestion(
                    question,
                    String(base.id),
                  );
                  const stillWorkingQ = baseQuestions.find(
                    isStillWorkingQuestion,
                  );
                  const isShortPair = [
                    "q_th_03", "q_th_04",
                    "q_fe_05", "q_fe_06",
                    "q_pd_17", "q_pd_18",
                    "q_pd_15", "q_pd_16",
                    "q_nfe_03", "q_nfe_04",
                    "q_eh_04", "q_eh_05",
                  ].includes(String(question.id));

                  const dateConstraint = resolveDateConstraint(question, baseQuestions);
                  const dateDisabledDate =
                    dateConstraint.type !== "NONE"
                      ? (current: any) => {
                          if (!current) return false;
                          const currentDayjs = dayjs(current);
                          if (!currentDayjs.isValid()) return false;

                          if (dateConstraint.type === "PAST_ONLY") {
                            return currentDayjs.isAfter(dayjs().endOf("day"));
                          }
                          if (dateConstraint.type === "FUTURE_ONLY") {
                            return currentDayjs.isBefore(dayjs().startOf("day"));
                          }
                          if (
                            dateConstraint.type === "AFTER_START_DATE" &&
                            dateConstraint.pairedStartQuestionId
                          ) {
                            const startVal = form.getFieldValue(
                              dateConstraint.pairedStartQuestionId,
                            );
                            if (startVal) {
                              const startDayjs = dayjs(startVal);
                              if (startDayjs.isValid()) {
                                return currentDayjs.isBefore(startDayjs, "day");
                              }
                            }
                          }
                          return false;
                        }
                      : undefined;

                  const dateDependencies = dateConstraint.pairedStartQuestionId
                    ? [dateConstraint.pairedStartQuestionId]
                    : String(question.id) === "q_fe_06"
                    ? ["q_fe_05"]
                    : undefined;

                  const dateValidationRule =
                    dateConstraint.type !== "NONE"
                      ? ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
                          validator(_: any, value: any) {
                            if (!value) return Promise.resolve();
                            const currentDayjs = dayjs(value);
                            if (!currentDayjs.isValid()) return Promise.resolve();

                            if (dateConstraint.type === "PAST_ONLY") {
                              if (currentDayjs.isAfter(dayjs().endOf("day"))) {
                                return Promise.reject(
                                  new Error(
                                    dateConstraint.errorMessage ||
                                      "Tanggal tidak boleh di masa depan",
                                  ),
                                );
                              }
                            } else if (dateConstraint.type === "FUTURE_ONLY") {
                              if (currentDayjs.isBefore(dayjs().startOf("day"))) {
                                return Promise.reject(
                                  new Error(
                                    dateConstraint.errorMessage ||
                                      "Tanggal harus di masa depan",
                                  ),
                                );
                              }
                            } else if (
                              dateConstraint.type === "AFTER_START_DATE" &&
                              dateConstraint.pairedStartQuestionId
                            ) {
                              const startVal = getFieldValue(
                                dateConstraint.pairedStartQuestionId,
                              );
                              if (startVal) {
                                const startDayjs = dayjs(startVal);
                                if (
                                  startDayjs.isValid() &&
                                  currentDayjs.isBefore(startDayjs, "day")
                                ) {
                                  return Promise.reject(
                                    new Error(
                                      dateConstraint.errorMessage ||
                                        "Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
                                    ),
                                  );
                                }
                              }
                            }
                            return Promise.resolve();
                          },
                        })
                      : String(question.id) === "q_fe_06"
                      ? ({ getFieldValue }: { getFieldValue: (name: string) => any }) => ({
                          validator(_: any, value: any) {
                            if (!value) return Promise.resolve();
                            const startVal = getFieldValue("q_fe_05");
                            if (startVal && Number(value) < Number(startVal)) {
                              return Promise.reject(
                                new Error(
                                  "Tahun kelulusan tidak boleh lebih kecil dari tahun masuk",
                                ),
                              );
                            }
                            return Promise.resolve();
                          },
                        })
                      : undefined;

                  if (isEndDate && stillWorkingQ) {
                    const stillWorkingFieldId = String(stillWorkingQ.id);
                    const { yesOptionId } = getStillWorkingOptions(stillWorkingQ);

                    return (
                      <Col key={question.id} xs={isShortPair ? 12 : 24} md={12}>
                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues[stillWorkingFieldId] !==
                              currentValues[stillWorkingFieldId] ||
                            prevValues[String(question.id)] !==
                              currentValues[String(question.id)]
                          }
                        >
                          {({ getFieldValue }) => {
                            const stillWorkingValue =
                              getFieldValue(stillWorkingFieldId);
                            const isStillWorking = isStillWorkingValue(
                              stillWorkingValue,
                              yesOptionId,
                            );

                            return (
                              <Form.Item
                                label={renderQuestionLabel(question)}
                                tooltip={question.help_text ? { title: cleanHelpText(question.help_text) } : undefined}
                                name={String(question.id)}
                                dependencies={dateDependencies}
                                getValueProps={(val) => ({
                                  value: toDayjsOrUndefined(val),
                                })}
                                rules={[
                                  ...(question.required && !isStillWorking
                                    ? [{ required: true, message: "Field is required" }]
                                    : []),
                                  ...(dateValidationRule ? [dateValidationRule] : []),
                                ]}
                              >
                                <AppFormField
                                  question={question}
                                  disabled={isStillWorking}
                                  disabledDate={
                                    question.input_type === "DATE"
                                      ? dateDisabledDate
                                      : undefined
                                  }
                                  placeholder={
                                    isStillWorking
                                      ? String(base.id) === "qb_nonformal_education"
                                        ? "Masih berlangsung"
                                        : "Masih aktif bekerja"
                                      : cleanPlaceholder(question.placeholder) || "Pilih tanggal"
                                  }
                                  style={{
                                    backgroundColor: isStillWorking
                                      ? "#f8fafc"
                                      : undefined,
                                  }}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                    );
                  }

                  const isFullWidth = question.input_type === "TEXTAREA";
                  const isQ19 = String(question.id) === "q_pd_19";

                  const questionLabelNode = isQ19 ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        gap: 8,
                      }}
                    >
                      <AppTypography.Label>
                        {cleanQuestionLabel(question.text)}
                      </AppTypography.Label>
                      <Button
                        size="small"
                        type="dashed"
                        icon={<ThunderboltOutlined />}
                        loading={isGeneratingProfileSummary}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleGenerateStudentProfileSummary();
                        }}
                        style={{
                          fontSize: 12,
                          borderRadius: 6,
                          color: "#4f46e5",
                          borderColor: "#c7d2fe",
                        }}
                      >
                        Susun dengan AI
                      </Button>
                    </div>
                  ) : (
                    renderQuestionLabel(question)
                  );

                  return (
                    <Col key={question.id} xs={isShortPair ? 12 : 24} md={isFullWidth ? 24 : 12}>
                      <Form.Item
                        label={questionLabelNode}
                        tooltip={question.help_text ? { title: cleanHelpText(question.help_text) } : undefined}
                        name={String(question.id)}
                        dependencies={dateDependencies}
                        getValueProps={
                          question.input_type === "DATE"
                            ? (val) => ({ value: toDayjsOrUndefined(val) })
                            : undefined
                        }
                        rules={[
                          ...(question.required ? [{ required: true, message: "Field is required" }] : []),
                          ...(dateValidationRule ? [dateValidationRule] : []),
                        ]}
                      >
                        {renderQuestionField(
                          question,
                          false,
                          undefined,
                          question.input_type === "DATE"
                            ? dateDisabledDate
                            : undefined,
                        )}
                      </Form.Item>
                    </Col>
                  );
                })}
              </Row>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              {baseAllowMultiple && editingSubmissionId ? (
                <AppButton
                  variant="secondary"
                  size="small"
                  onClick={handleCancelEdit}
                >
                  Batal
                </AppButton>
              ) : null}

              <AppButton
                id="personal-info-submit-btn"
                variant="primary"
                type="submit"
                loading={submittingSection === String(base.id)}
                disabled={Boolean(submittingSection)}
              >
                {baseAllowMultiple && editingSubmissionId
                  ? "Simpan Perubahan"
                  : "Simpan Data"}
              </AppButton>
            </div>
          </div>
        </Form>
      ),
    };
  });

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: "100%",
        }}
      >
        <PageHeader
          title="Personal Information"
          subtitle="Complete your profile and identity documentation"
          icon={<UserOutlined />}
          headerExtra={
            <Button
              type="text"
              shape="circle"
              icon={<QuestionCircleOutlined style={{ fontSize: 18, color: "#64748b" }} />}
              onClick={restartTour}
              title="Panduan"
              aria-label="Panduan"
            />
          }
        />

        <Card
          className={styles.card}
          loading={basesLoading || questionsLoading}
        >
          <Space direction="vertical" size={14} style={{ width: "100%" }}>
            {items.length ? (
              <div id="personal-info-tabs" className={styles.tabsContainer}>
                <Tabs
                  activeKey={activeTab ?? resolvedBaseId}
                  onChange={handleTabChange}
                  items={items}
                  destroyInactiveTabPane
                />
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 12.5 }}>
                Belum ada base question yang tersedia.
              </Text>
            )}

            {allowMultipleSubmissions ? (
              <Typography.Text type="secondary" style={{ fontSize: 11.5 }}>
                Gunakan tombol Tambah Baru untuk menambahkan riwayat lainnya.
              </Typography.Text>
            ) : null}
          </Space>
        </Card>
      </div>

      <Tour
        open={tourOpen}
        onClose={closeTour}
        onFinish={closeTour}
        steps={tourSteps}
        zIndex={1200}
      />

      <Modal
        title={
          <Space align="center">
            <ExclamationCircleOutlined
              style={{ color: "#faad14", fontSize: 18 }}
            />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Konfirmasi Perubahan Data</span>
          </Space>
        }
        open={isConfirmEditModalOpen}
        onOk={async () => {
          if (pendingEditValues && editingSubmissionId) {
            await executeSaveAnswers(pendingEditValues, editingSubmissionId);
          }
        }}
        onCancel={() => {
          setIsConfirmEditModalOpen(false);
        }}
        okText="Simpan"
        cancelText="Batal"
        confirmLoading={
          submittingSection === String(resolvedBaseId) &&
          (creatingAnswerQuestion || updatingAnswerQuestion)
        }
        okButtonProps={{ style: { height: 32, borderRadius: 6, fontSize: 12 } }}
        cancelButtonProps={{ style: { height: 32, borderRadius: 6, fontSize: 12 } }}
        centered
      >
        <div style={{ padding: "8px 0" }}>
          <Typography.Paragraph style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.5 }}>
            Apakah Anda yakin ingin menyimpan perubahan pada data{" "}
            <b>{editingTitle || activeBase?.name || "pendidikan"}</b> ini?
          </Typography.Paragraph>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Pastikan seluruh data yang Anda masukkan telah sesuai dengan dokumen
            resmi Anda.
          </Typography.Text>
        </div>
      </Modal>
    </>
  );
}
