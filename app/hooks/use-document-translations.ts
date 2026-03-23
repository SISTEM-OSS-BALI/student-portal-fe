import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import type {
  DocumentTranslationDataModel,
  DocumentTranslationPayloadCreateModel,
  DocumentTranslationPayloadUpdateModel,
} from "../models/document-translations";

const documentTranslationsUrl = "/api/document-translations";
const queryKey = "document-translations";

export const useDocumentTranslations = ({
  queryString,
  enabled = true,
}: {
  queryString?: string;
  enabled?: boolean;
} = {}) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString
        ? `${documentTranslationsUrl}?${queryString}`
        : documentTranslationsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as DocumentTranslationDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: DocumentTranslationPayloadCreateModel) => {
      const result = await api.post(documentTranslationsUrl, payload);
      return (result.data?.result ??
        result.data) as DocumentTranslationDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: DocumentTranslationPayloadUpdateModel;
    }) => {
      const result = await api.put(`${documentTranslationsUrl}/${id}`, payload);
      return (result.data?.result ??
        result.data) as DocumentTranslationDataModel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["document-translation", variables.id],
      });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) =>
      api.delete(`${documentTranslationsUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
  });

  return {
    data,
    fetchLoading,
    onCreate,
    onCreateLoading,
    onUpdate,
    onUpdateLoading,
    onDelete,
    onDeleteLoading,
  };
};

export const useDocumentTranslation = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: ["document-translation", id],
    queryFn: async () => {
      const result = await api.get(`${documentTranslationsUrl}/${id}`);
      return (result.data?.result ??
        result.data) as DocumentTranslationDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async (payload: DocumentTranslationPayloadUpdateModel) => {
      const result = await api.put(`${documentTranslationsUrl}/${id}`, payload);
      return (result.data?.result ??
        result.data) as DocumentTranslationDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["document-translation", id],
      });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async () => api.delete(`${documentTranslationsUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["document-translation", id],
      });
    },
  });

  return {
    data,
    fetchLoading,
    onUpdate,
    onUpdateLoading,
    onDelete,
    onDeleteLoading,
  };
};
