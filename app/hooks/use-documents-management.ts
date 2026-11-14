import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import {
  DocumentDataModel,
  DocumentPayloadCreateModel,
  DocumentPayloadUpdateModel,
  TranslationNeededValue,
} from "../models/documents-management";
import {
  normalizeDocumentLabel,
  normalizeDocumentCode,
  getStandardDocumentRequired,
  getStandardDocumentInstructions,
} from "../utils/document-standards";

const normalizeTranslationNeeded = (value?: string): TranslationNeededValue =>
  value?.toLowerCase() === "yes" ? "yes" : "no";

const normalizeCategory = (category?: string, standardLabel?: string): string => {
  if (category) {
    const cat = category.toLowerCase().trim();
    if (cat.includes("ident") || cat.includes("pribadi")) return "identity";
    if (cat.includes("akademik") || cat.includes("edukasi") || cat.includes("academic")) return "academic";
    if (cat.includes("finan") || cat.includes("uang") || cat.includes("finance")) return "finance";
    if (cat.includes("dukung") || cat.includes("lain") || cat.includes("support") || cat.includes("other")) return "other";
  }
  if (standardLabel) {
    const lbl = standardLabel.toLowerCase();
    if (lbl.includes("passport") || lbl.includes("id card") || lbl.includes("birth certificate") || lbl.includes("family card") || lbl.includes("photo") || lbl.includes("sign") || lbl.includes("npwp")) {
      if (lbl.startsWith("sponsor")) return "finance";
      return "identity";
    }
    if (lbl.includes("certificate") || lbl.includes("ielts") || lbl.includes("det") || lbl.includes("transcript")) {
      return "academic";
    }
    if (lbl.includes("sponsor") || lbl.includes("business") || lbl.includes("bank") || lbl.includes("asset") || lbl.includes("siup") || lbl.includes("nib")) {
      return "finance";
    }
  }
  return "other";
};

const normalizeDocument = (data: DocumentDataModel): DocumentDataModel => {
  const raw = data as unknown as Record<string, unknown>;

  // Penamaan dan konfigurasi dokumen bersifat adjustable (bebas diatur pengguna di master data)
  const userLabel = String(raw.label ?? data.label ?? "").trim();
  const userCode = String(raw.internal_code ?? data.internal_code ?? "").trim();
  const userCategory = String(raw.category ?? data.category ?? "").trim().toLowerCase();
  const userNotes = (raw.notes as string | null) ?? data.notes ?? null;
  const userRequired =
    data.required !== undefined && data.required !== null
      ? Boolean(data.required)
      : undefined;

  const fallbackLabel = userLabel || normalizeDocumentLabel(data);
  const fallbackCode = userCode || normalizeDocumentCode(data);

  return {
    id: data.id,
    label: userLabel || fallbackLabel,
    internal_code: userCode || fallbackCode || ((raw.internal_code as string) ?? data.internal_code),
    file_type: (raw.file_type as string) ?? data.file_type ?? "pdf",
    category: userCategory || normalizeCategory(undefined, fallbackLabel),
    example_url: (raw.example_url as string | null) ?? data.example_url ?? null,
    translation_needed: normalizeTranslationNeeded(
      (raw.translation_needed as string) ?? data.translation_needed,
    ),
    required: userRequired ?? getStandardDocumentRequired(data),
    auto_rename_pattern:
      (raw.auto_rename_pattern as string) ?? data.auto_rename_pattern,
    notes: userNotes,
    ocr_keywords: (raw.ocr_keywords as string | null) ?? data.ocr_keywords ?? null,
    ocr_pattern: (raw.ocr_pattern as string | null) ?? data.ocr_pattern ?? null,
    created_at: (raw.created_at as string) ?? data.created_at,
    updated_at: (raw.updated_at as string) ?? data.updated_at,
  };
};

const toApiTranslationNeeded = (
  value?: TranslationNeededValue,
): "YES" | "NO" | undefined =>
  value ? (value.toUpperCase() as "YES" | "NO") : undefined;

const useBackendApi = true;

const toApiCreatePayload = (payload: DocumentPayloadCreateModel) =>
  useBackendApi
    ? {
        label: payload.label,
        internal_code: payload.internal_code,
        file_type: payload.file_type,
        category: payload.category,
        example_url: payload.example_url ?? null,
        translation_needed: toApiTranslationNeeded(payload.translation_needed),
        required: payload.required,
        auto_rename_pattern: payload.auto_rename_pattern ?? "",
        notes: payload.notes ?? "",
        ocr_keywords: payload.ocr_keywords ?? null,
        ocr_pattern: payload.ocr_pattern ?? null,
      }
    : payload;

const toApiUpdatePayload = (payload: DocumentPayloadUpdateModel) => {
  if (!useBackendApi) return payload;

  const out: Record<string, unknown> = {};
  if (payload.label !== undefined) out.label = payload.label;
  if (payload.internal_code !== undefined)
    out.internal_code = payload.internal_code;
  if (payload.file_type !== undefined) out.file_type = payload.file_type;
  if (payload.category !== undefined) out.category = payload.category;
  if (payload.example_url !== undefined) out.example_url = payload.example_url;
  if (payload.translation_needed !== undefined)
    out.translation_needed = toApiTranslationNeeded(payload.translation_needed);
  if (payload.required !== undefined) out.required = payload.required;
  if (payload.auto_rename_pattern !== undefined)
    out.auto_rename_pattern = payload.auto_rename_pattern;
  if (payload.notes !== undefined) out.notes = payload.notes ?? "";
  if (payload.ocr_keywords !== undefined)
    out.ocr_keywords = payload.ocr_keywords ?? null;
  if (payload.ocr_pattern !== undefined)
    out.ocr_pattern = payload.ocr_pattern ?? null;
  return out;
};

const documentsUrl = "/api/documents";
const entity = "document";
const queryKey = "documents";

export const useDocuments = ({ queryString }: { queryString?: string }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${documentsUrl}?${queryString}` : documentsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as DocumentDataModel[];
      const items = Array.isArray(payload) ? payload : [];
      return items.map(normalizeDocument);
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: DocumentPayloadCreateModel) =>
      api.post(documentsUrl, toApiCreatePayload(payload)),
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
      api.delete(`${documentsUrl}/${id}`),
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

export const useDocument = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  // Query data berdasarkan ID
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${documentsUrl}/${id}`);
      const payload = (result.data?.result ?? result.data) as DocumentDataModel;
      return normalizeDocument(payload);
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: DocumentPayloadUpdateModel;
    }) => api.put(`${documentsUrl}/${id}`, toApiUpdatePayload(payload)),
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

export const useDocumentsTranslation = ({
  queryString,
}: {
  queryString?: string;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString
        ? `${documentsUrl}/translations-required?${queryString}`
        : `${documentsUrl}/translations-required`;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as DocumentDataModel[];
      const items = Array.isArray(payload) ? payload : [];
      return items.map(normalizeDocument);
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: DocumentPayloadCreateModel) =>
      api.post(documentsUrl, toApiCreatePayload(payload)),
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
      api.delete(`${documentsUrl}/${id}`),
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
