import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import type {
  SponsorLetterAiApprovalDataModel,
  SponsorLetterAiApprovalPayloadCreateModel,
  SponsorLetterAiApprovalPayloadUpdateModel,
} from "../models/sponsor-letter-ai-approvals";

const sponsorLetterAiApprovalsUrl = "/api/sponsor-letter-ai-approvals";
const entity = "sponsor letter approval";
const queryKey = "sponsor-letter-ai-approvals";

export const useSponsorLetterAiApprovals = ({ queryString, enabled = true }: { queryString?: string; enabled?: boolean } = {}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${sponsorLetterAiApprovalsUrl}?${queryString}` : sponsorLetterAiApprovalsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ?? result.data) as SponsorLetterAiApprovalDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });
  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: SponsorLetterAiApprovalPayloadCreateModel) => {
      const result = await api.post(sponsorLetterAiApprovalsUrl, payload);
      return (result.data?.result ?? result.data) as SponsorLetterAiApprovalDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["generated-sponsor-letter-ai-documents"] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => notify({ type: "error", entity, action: "created" }),
  });
  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({ id, payload }: { id: string | number; payload: SponsorLetterAiApprovalPayloadUpdateModel }) => {
      const result = await api.put(`${sponsorLetterAiApprovalsUrl}/${id}`, payload);
      return (result.data?.result ?? result.data) as SponsorLetterAiApprovalDataModel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      queryClient.invalidateQueries({ queryKey: ["generated-sponsor-letter-ai-documents"] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => notify({ type: "error", entity, action: "updated" }),
  });
  return { data, fetchLoading, onCreate, onCreateLoading, onUpdate, onUpdateLoading };
};

export const useSponsorLetterAiApproval = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${sponsorLetterAiApprovalsUrl}/${id}`);
      return (result.data?.result ?? result.data) as SponsorLetterAiApprovalDataModel;
    },
    enabled: Boolean(id),
  });
  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async (payload: SponsorLetterAiApprovalPayloadUpdateModel) => {
      const result = await api.put(`${sponsorLetterAiApprovalsUrl}/${id}`, payload);
      return (result.data?.result ?? result.data) as SponsorLetterAiApprovalDataModel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, id] });
      queryClient.invalidateQueries({ queryKey: ["generated-sponsor-letter-ai-documents"] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => notify({ type: "error", entity, action: "updated" }),
  });
  return { data, fetchLoading, onUpdate, onUpdateLoading };
};
