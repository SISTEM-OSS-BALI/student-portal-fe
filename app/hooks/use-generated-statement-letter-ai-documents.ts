import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import type {
  GeneratedStatementLetterAiDocumentDataModel,
  GeneratedStatementLetterAiDocumentPayloadModel,
  GeneratedStatementLetterAiTemplateDataModel,
} from "../models/statement-letter-ai-approvals";

export type {
  GeneratedStatementLetterAiDocumentDataModel as GeneratedStatementLetterAiDocument,
  GeneratedStatementLetterAiDocumentPayloadModel as GeneratedStatementLetterAiDocumentPayload,
  GeneratedStatementLetterAiTemplateDataModel as GeneratedStatementLetterAiTemplate,
} from "../models/statement-letter-ai-approvals";

const baseUrl = "/api/generate-statement-letter-ai/documents";
const templateUrl = "/api/generate-statement-letter-ai/template";
const queryKey = "generated-statement-letter-ai-documents";

export const useGeneratedStatementLetterAiDocuments = ({
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
        result.data) as GeneratedStatementLetterAiDocumentDataModel[];
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
        result.data) as GeneratedStatementLetterAiTemplateDataModel;
    },
  });

  const { mutateAsync: onUpsert, isPending: onUpsertLoading } = useMutation({
    mutationFn: async (payload: GeneratedStatementLetterAiDocumentPayloadModel) =>
      api.post(baseUrl, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: [queryKey, variables.student_id],
      });
    },
  });

  const { mutateAsync: onSubmitToDirector, isPending: onSubmitToDirectorLoading } =
    useMutation({
      mutationFn: async ({
        id,
        note,
      }: {
        id: string;
        note?: string | null;
      }) => {
        const result = await api.post(`${baseUrl}/${id}/submit-to-director`, {
          note,
        });
        return (result.data?.result ??
          result.data) as GeneratedStatementLetterAiDocumentDataModel;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        queryClient.invalidateQueries({
          queryKey: [queryKey, studentId],
        });
        queryClient.invalidateQueries({
          queryKey: [queryKey, variables.id],
        });
      },
    });

  const {
    mutateAsync: onCancelSubmitToDirector,
    isPending: onCancelSubmitToDirectorLoading,
  } = useMutation({
    mutationFn: async ({
      id,
      note,
    }: {
      id: string;
      note?: string | null;
    }) => {
      const result = await api.post(
        `${baseUrl}/${id}/cancel-submit-to-director`,
        {
          note,
        },
      );
      return (result.data?.result ??
        result.data) as GeneratedStatementLetterAiDocumentDataModel;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: [queryKey, studentId],
      });
      queryClient.invalidateQueries({
        queryKey: [queryKey, variables.id],
      });
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
