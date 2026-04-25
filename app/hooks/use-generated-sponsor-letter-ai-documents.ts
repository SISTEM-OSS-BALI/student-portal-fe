import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import type {
  GeneratedSponsorLetterAiDocumentDataModel,
  GeneratedSponsorLetterAiDocumentPayloadModel,
  GeneratedSponsorLetterAiTemplateDataModel,
} from "../models/sponsor-letter-ai-approvals";

export type {
  GeneratedSponsorLetterAiDocumentDataModel as GeneratedSponsorLetterAiDocument,
  GeneratedSponsorLetterAiDocumentPayloadModel as GeneratedSponsorLetterAiDocumentPayload,
  GeneratedSponsorLetterAiTemplateDataModel as GeneratedSponsorLetterAiTemplate,
} from "../models/sponsor-letter-ai-approvals";

const baseUrl = "/api/generate-sponsor-letter-ai/documents";
const templateUrl = "/api/generate-sponsor-letter-ai/template";
const queryKey = "generated-sponsor-letter-ai-documents";

export const useGeneratedSponsorLetterAiDocuments = ({
  studentId,
  enabled = true,
  refetchInterval,
}: {
  studentId?: string;
  enabled?: boolean;
  refetchInterval?: number;
}) => {
  const queryClient = useQueryClient();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, studentId],
    queryFn: async () => {
      const result = await api.get(`${baseUrl}?student_id=${studentId}`);
      const payload = (result.data?.result ??
        result.data) as GeneratedSponsorLetterAiDocumentDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled: enabled && Boolean(studentId),
    refetchInterval,
  });

  const { data: templateData, isLoading: templateLoading } = useQuery({
    queryKey: [queryKey, "template"],
    queryFn: async () => {
      const result = await api.get(templateUrl);
      return (result.data?.result ??
        result.data) as GeneratedSponsorLetterAiTemplateDataModel;
    },
  });

  const { mutateAsync: onUpsert, isPending: onUpsertLoading } = useMutation({
    mutationFn: async (payload: GeneratedSponsorLetterAiDocumentPayloadModel) =>
      api.post(baseUrl, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [queryKey, variables.student_id] });
    },
  });

  const { mutateAsync: onSubmitToDirector, isPending: onSubmitToDirectorLoading } = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string | null }) => {
      const result = await api.post(`${baseUrl}/${id}/submit-to-director`, { note });
      return (result.data?.result ?? result.data) as GeneratedSponsorLetterAiDocumentDataModel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [queryKey, studentId] });
      queryClient.invalidateQueries({ queryKey: [queryKey, variables.id] });
    },
  });

  const { mutateAsync: onCancelSubmitToDirector, isPending: onCancelSubmitToDirectorLoading } = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string | null }) => {
      const result = await api.post(
        `${baseUrl}/${id}/cancel-submit-to-director`,
        { note },
      );
      return (result.data?.result ?? result.data) as GeneratedSponsorLetterAiDocumentDataModel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [queryKey, studentId] });
      queryClient.invalidateQueries({ queryKey: [queryKey, variables.id] });
    },
  });

  return {
    data,
    fetchLoading,
    templateData,
    templateLoading,
    onUpsert,
    onUpsertLoading,
    onSubmitToDirector,
    onSubmitToDirectorLoading,
    onCancelSubmitToDirector,
    onCancelSubmitToDirectorLoading,
  };
};
