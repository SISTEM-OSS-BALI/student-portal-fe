import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import { sanitizeQuestionPlaceholders } from "../utils/placeholder-sanitizer";
import type {
  QuestionDataModel,
  QuestionPayloadCreateModel,
  QuestionPayloadUpdateModel,
} from "../models/question";

export const DEFAULT_PERSONAL_DETAILS_QUESTIONS: QuestionDataModel[] = [
  {
    id: "q_pd_08",
    base_id: "qb_personal_details",
    text: "Passport Number",
    input_type: "TEXT",
    required: false,
    order: 8,
    help_text: "Nomor paspor aktif yang akan digunakan untuk pengajuan visa.",
    placeholder: "Contoh: B1234567",
    max_length: 20,
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
  },
  {
    id: "q_pd_14",
    base_id: "qb_personal_details",
    text: "Residential City",
    input_type: "TEXT",
    required: true,
    order: 14,
    help_text: "Kota tempat tinggal saat ini.",
    placeholder: "Contoh: Denpasar",
    max_length: 100,
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
  },
  {
    id: "q_pd_15",
    base_id: "qb_personal_details",
    text: "State or Province",
    input_type: "TEXT",
    required: true,
    order: 15,
    help_text: "Provinsi tempat tinggal saat ini.",
    placeholder: "Contoh: Bali",
    max_length: 100,
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
  },
  {
    id: "q_pd_16",
    base_id: "qb_personal_details",
    text: "Postal Code",
    input_type: "TEXT",
    required: true,
    order: 16,
    help_text: "5 digit kode pos alamat tempat tinggal.",
    placeholder: "Contoh: 80361",
    min_length: 5,
    max_length: 10,
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
  },
  {
    id: "q_pd_17",
    base_id: "qb_personal_details",
    text: "Height",
    input_type: "NUMBER",
    required: false,
    order: 17,
    help_text: "Tinggi badan dalam satuan sentimeter (cm).",
    placeholder: "Contoh: 173",
    max_length: 3,
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
  },
  {
    id: "q_pd_18",
    base_id: "qb_personal_details",
    text: "Weight",
    input_type: "NUMBER",
    required: false,
    order: 18,
    help_text: "Berat badan dalam satuan kilogram (kg).",
    placeholder: "Contoh: 80",
    max_length: 3,
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
  },
  {
    id: "q_pd_19",
    base_id: "qb_personal_details",
    text: "Professional Profile Summary",
    input_type: "TEXTAREA",
    required: false,
    order: 19,
    help_text: "Tuliskan ringkasan profil singkat dalam bahasa Inggris untuk kebutuhan CV. Bersifat opsional dan dapat disusun otomatis dengan AI.",
    placeholder: "Contoh: Highly motivated professional with strong academic foundation and hands-on operational experience. Skilled in teamwork and cross-cultural communication, dedicated to continuous learning.",
    max_length: 1000,
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
  },
];

export const DEFAULT_NONFORMAL_QUESTIONS: QuestionDataModel[] = [
  {
    id: "q_nfe_07",
    base_id: "qb_nonformal_education",
    text: "Are You Still Attending This Training?",
    input_type: "RADIO",
    required: true,
    order: 5,
    help_text: "Pilih Ya apabila pelatihan masih berlangsung.",
    active: true,
    created_at: "2026-10-26T00:00:00Z",
    updated_at: "2026-10-26T00:00:00Z",
    options: [
      {
        id: "opt_nfe_07_1",
        question_id: "q_nfe_07",
        label: "Ya",
        value: "YES",
        order: 1,
        active: true,
        created_at: "2026-10-26T00:00:00Z",
        updated_at: "2026-10-26T00:00:00Z",
      },
      {
        id: "opt_nfe_07_2",
        question_id: "q_nfe_07",
        label: "Tidak",
        value: "NO",
        order: 2,
        active: true,
        created_at: "2026-10-26T00:00:00Z",
        updated_at: "2026-10-26T00:00:00Z",
      },
    ],
  },
];

const questionsUrl = "/api/questions";
const entity = "question";
const queryKey = "questions";

export const useQuestions = ({ queryString }: { queryString?: string }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${questionsUrl}?${queryString}` : questionsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as QuestionDataModel[];
      const questionsList = Array.isArray(payload) ? payload : [];
      let mergedList = [...questionsList];

      const isPersonalDetails =
        !queryString ||
        queryString.includes("qb_personal_details") ||
        queryString.includes("personal") ||
        mergedList.some((q) => String(q.id).startsWith("q_pd_"));

      if (isPersonalDetails) {
        const pdBaseId =
          mergedList.find((q) => String(q.id).startsWith("q_pd_"))?.base_id ||
          (queryString?.match(/base_id=([^&]+)/)?.[1] ?? "qb_personal_details");

        const existingIds = new Set(mergedList.map((q) => String(q.id)));
        DEFAULT_PERSONAL_DETAILS_QUESTIONS.forEach((q) => {
          if (!existingIds.has(String(q.id))) {
            mergedList.push({
              ...q,
              base_id: pdBaseId,
            });
          }
        });
      }

      const isNonformalEducation =
        !queryString ||
        queryString.includes("qb_nonformal_education") ||
        queryString.includes("nonformal") ||
        queryString.includes("pelatihan") ||
        queryString.includes("kursus") ||
        mergedList.some((q) => String(q.id).startsWith("q_nfe_"));

      if (isNonformalEducation) {
        const nfeBaseId =
          mergedList.find((q) => String(q.id).startsWith("q_nfe_"))?.base_id ||
          (queryString?.match(/base_id=([^&]+)/)?.[1] ?? "qb_nonformal_education");

        const existingIds = new Set(mergedList.map((q) => String(q.id)));
        DEFAULT_NONFORMAL_QUESTIONS.forEach((q) => {
          if (!existingIds.has(String(q.id))) {
            mergedList.push({
              ...q,
              base_id: nfeBaseId,
            });
          }
        });
      }

      mergedList.sort(
        (a, b) => (Number(a.order) || 0) - (Number(b.order) || 0),
      );

      return mergedList.map(sanitizeQuestionPlaceholders);
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: QuestionPayloadCreateModel) =>
      api
        .post(questionsUrl, payload)
        .then(
          (res) => (res.data?.result ?? res.data) as QuestionDataModel,
        ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) =>
      api.delete(`${questionsUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
    },
  });

  return {
    data,
    fetchLoading,
    onCreate,
    onCreateLoading,
    onDelete,
    onDeleteLoading,
  };
};

export const useQuestion = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${questionsUrl}/${id}`);
      const payload = (result.data?.result ?? result.data) as QuestionDataModel;
      return payload ? sanitizeQuestionPlaceholders(payload) : payload;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id: updateId,
      payload,
    }: {
      id: string | number;
      payload: QuestionPayloadUpdateModel;
    }) =>
      api
        .put(`${questionsUrl}/${updateId}`, payload)
        .then(
          (res) => (res.data?.result ?? res.data) as QuestionDataModel,
        ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  return {
    data,
    fetchLoading,
    onUpdate,
    onUpdateLoading,
  };
};
