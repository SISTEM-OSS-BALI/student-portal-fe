import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import {
  DocumentDataModel,
  DocumentPayloadCreateModel,
  DocumentPayloadUpdateModel,
  TranslationNeededValue,
} from "../models/documents-management";

const normalizeTranslationNeeded = (value?: string): TranslationNeededValue =>
  value?.toLowerCase() === "yes" ? "yes" : "no";

const isApiDocument = (data: DocumentDataModel): data is DocumentDataModel =>
  "internal_code" in data || "auto_rename_pattern" in data;

const normalizeDocument = (data: DocumentDataModel): DocumentDataModel => {
  if (isApiDocument(data)) {
    return {
      id: data.id,
      label: data.label,
      internal_code:
        (data as DocumentDataModel).internal_code ?? data.internal_code,
      file_type: (data as DocumentDataModel).file_type ?? data.file_type,
      category: data.category,
      translation_needed: normalizeTranslationNeeded(
        (data as DocumentDataModel).translation_needed ??
          data.translation_needed,
      ),
      required: data.required,
      auto_rename_pattern:
        (data as DocumentDataModel).auto_rename_pattern ??
        data.auto_rename_pattern,
      notes: data.notes ?? null,
      created_at: (data as DocumentDataModel).created_at ?? data.created_at,
      updated_at: (data as DocumentDataModel).updated_at ?? data.updated_at,
    };
  }

  return data;
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
        translation_needed: toApiTranslationNeeded(payload.translation_needed),
        required: payload.required,
        auto_rename_pattern: payload.auto_rename_pattern ?? "",
        notes: payload.notes ?? "",
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
  if (payload.translation_needed !== undefined)
    out.translation_needed = toApiTranslationNeeded(payload.translation_needed);
  if (payload.required !== undefined) out.required = payload.required;
  if (payload.auto_rename_pattern !== undefined)
    out.auto_rename_pattern = payload.auto_rename_pattern;
  if (payload.notes !== undefined) out.notes = payload.notes ?? "";
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
