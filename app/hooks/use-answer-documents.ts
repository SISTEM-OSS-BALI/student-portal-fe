import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import type {
  AnswerDocumentDataModel,
  AnswerDocumentPayloadCreateModel,
  AnswerDocumentPayloadUpdateModel,
} from "../models/question";

const answerDocumentsUrl = "/api/answer-documents";
const queryKey = "answer-documents";

export const useAnswerDocuments = ({
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
        ? `${answerDocumentsUrl}?${queryString}`
        : answerDocumentsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as AnswerDocumentDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: AnswerDocumentPayloadCreateModel[]) =>
      api.post(answerDocumentsUrl, payload),
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
      payload: AnswerDocumentPayloadUpdateModel;
    }) => api.put(`${answerDocumentsUrl}/${id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["answer-document", variables.id],
      });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) =>
      api.delete(`${answerDocumentsUrl}/${id}`),
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

export const useAnswerDocument = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: ["answer-document", id],
    queryFn: async () => {
      const result = await api.get(`${answerDocumentsUrl}/${id}`);
      return (result.data?.result ??
        result.data) as AnswerDocumentDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async (payload: AnswerDocumentPayloadUpdateModel) =>
      api.put(`${answerDocumentsUrl}/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["answer-document", id] });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async () => api.delete(`${answerDocumentsUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["answer-document", id] });
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
