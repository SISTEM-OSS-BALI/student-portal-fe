import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export type GeneratedStatementLetterAiDocument = {
  id: string;
  student_id: string;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  word_file_url?: string | null;
  word_file_path?: string | null;
  word_file_name?: string | null;
  word_file_type?: string | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
};

export type GeneratedStatementLetterAiDocumentPayload = {
  student_id: string;
  file_url: string;
  file_path?: string | null;
  file_name?: string | null;
  file_type?: string | null;
  word_file_url?: string | null;
  word_file_path?: string | null;
  word_file_name?: string | null;
  word_file_type?: string | null;
  status?: string | null;
};

const baseUrl = "/api/generate-statement-letter-ai/documents";
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
        result.data) as GeneratedStatementLetterAiDocument[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled: enabled && Boolean(studentId),
    refetchInterval,
  });

  const { mutateAsync: onUpsert, isPending: onUpsertLoading } = useMutation({
    mutationFn: async (payload: GeneratedStatementLetterAiDocumentPayload) =>
      api.post(baseUrl, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: [queryKey, variables.student_id],
      });
    },
  });

  return {
    data,
    fetchLoading,
    onUpsert,
    onUpsertLoading,
  };
};
