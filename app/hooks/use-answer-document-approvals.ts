import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import type {
  AnswerDocumentApprovalsDataModel,
  AnswerDocumentApprovalsPayloadCreateModel,
  AnswerDocumentApprovalsPayloadUpdateModel,
} from "../models/answer-document-approvals";

const answerDocumentApprovalsUrl = "/api/answer-document-approvals";
const entity = "answer document approval";
const queryKey = "answer-document-approvals";

export const useAnswerDocumentApprovals = ({
  queryString,
  enabled = true,
}: {
  queryString?: string;
  enabled?: boolean;
} = {}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString
        ? `${answerDocumentApprovalsUrl}?${queryString}`
        : answerDocumentApprovalsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as AnswerDocumentApprovalsDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: AnswerDocumentApprovalsPayloadCreateModel) => {
      const result = await api.post(answerDocumentApprovalsUrl, payload);
      return (result.data?.result ??
        result.data) as AnswerDocumentApprovalsDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: AnswerDocumentApprovalsPayloadUpdateModel;
    }) => {
      const result = await api.put(`${answerDocumentApprovalsUrl}/${id}`, payload);
      return (result.data?.result ??
        result.data) as AnswerDocumentApprovalsDataModel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) =>
      api.delete(`${answerDocumentApprovalsUrl}/${id}`),
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
    onUpdate,
    onUpdateLoading,
    onDelete,
    onDeleteLoading,
  };
};

export const useAnswerDocumentApproval = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${answerDocumentApprovalsUrl}/${id}`);
      return (result.data?.result ??
        result.data) as AnswerDocumentApprovalsDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async (payload: AnswerDocumentApprovalsPayloadUpdateModel) => {
      const result = await api.put(`${answerDocumentApprovalsUrl}/${id}`, payload);
      return (result.data?.result ??
        result.data) as AnswerDocumentApprovalsDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async () => api.delete(`${answerDocumentApprovalsUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, id] });
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
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
