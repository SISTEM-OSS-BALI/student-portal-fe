import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import type {
  StatementLetterAiApprovalDataModel,
  StatementLetterAiApprovalPayloadCreateModel,
  StatementLetterAiApprovalPayloadUpdateModel,
} from "../models/statement-letter-ai-approvals";

const statementLetterAiApprovalsUrl = "/api/statement-letter-ai-approvals";
const entity = "statement letter approval";
const queryKey = "statement-letter-ai-approvals";

export const useStatementLetterAiApprovals = ({
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
        ? `${statementLetterAiApprovalsUrl}?${queryString}`
        : statementLetterAiApprovalsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as StatementLetterAiApprovalDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: StatementLetterAiApprovalPayloadCreateModel) => {
      const result = await api.post(statementLetterAiApprovalsUrl, payload);
      return (result.data?.result ??
        result.data) as StatementLetterAiApprovalDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["generated-statement-letter-ai-documents"],
      });
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
      payload: StatementLetterAiApprovalPayloadUpdateModel;
    }) => {
      const result = await api.put(`${statementLetterAiApprovalsUrl}/${id}`, payload);
      return (result.data?.result ??
        result.data) as StatementLetterAiApprovalDataModel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["generated-statement-letter-ai-documents"],
      });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  return {
    data,
    fetchLoading,
    onCreate,
    onCreateLoading,
    onUpdate,
    onUpdateLoading,
  };
};

export const useStatementLetterAiApproval = ({
  id,
}: {
  id: string | number;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${statementLetterAiApprovalsUrl}/${id}`);
      return (result.data?.result ??
        result.data) as StatementLetterAiApprovalDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async (payload: StatementLetterAiApprovalPayloadUpdateModel) => {
      const result = await api.put(`${statementLetterAiApprovalsUrl}/${id}`, payload);
      return (result.data?.result ??
        result.data) as StatementLetterAiApprovalDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, id] });
      queryClient.invalidateQueries({
        queryKey: ["generated-statement-letter-ai-documents"],
      });
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
