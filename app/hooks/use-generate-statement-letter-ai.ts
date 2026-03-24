import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const baseUrl = "/internal-api/generate-statement-letter-ai";

export type AIGenerateAnswer = {
  answer_id?: string;
  question_id?: string;
  question: string;
  value: string;
  input_type?: string;
  base_id?: string;
  base_name?: string;
  selected_option_ids?: string[];
};

export type AIGeneratePayload = {
  student_id: string;
  student_name?: string;
  student_country?: string;
  campus_name?: string;
  degree?: string;
  checklist_path?: string;
  checklist_url?: string;
  answers: AIGenerateAnswer[];
  sections?: Array<{
    key: string;
    label: string;
    items: Array<{
      id: string;
      question: string;
      answer: string;
      inputType?: string;
    }>;
  }>;
  meta?: {
    letter_status?: string;
    submitted_at?: string;
    admission_at?: string;
    [key: string]: unknown;
  };
};

export type AIGenerateResult = {
  model?: string;
  response?: string;
  done?: boolean;
  done_reason?: string;
  file_base64?: string;
  generated_file_name?: string;
  generated_mime_type?: string;
  checklist_version?: string;
  checklist_items?: string[];
  checklist_source?: string;
  missing_indicators?: string[];
  [key: string]: unknown;
};

const extractErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return "Failed to generate AI result";
  }

  const data = error.response?.data;
  return (
    data?.error?.details ||
    data?.error?.message ||
    data?.details ||
    data?.message ||
    error.message ||
    "Failed to generate AI result"
  );
};

export const useGenerateStatementLetterAi = () => {
  const {
    mutateAsync: onGenerateStatementLetterAi,
    isPending: onGenerateStatementLetterAiLoading,
  } = useMutation({
      mutationFn: async (payload: AIGeneratePayload) => {
        const res = await axios.post(baseUrl, payload, {
          withCredentials: true,
        });
        return (res.data?.result ?? res.data) as AIGenerateResult;
      },
      onError: (error: unknown) => {
        console.error(
          "[generate-statement-letter-ai] error:",
          extractErrorMessage(error),
          error,
        );
      },
    });

  return {
    onGenerateStatementLetterAi,
    onGenerateStatementLetterAiLoading,
  };
};
