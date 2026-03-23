import { useMutation } from "@tanstack/react-query";
import axios from "axios";

const baseUrl = "/internal-api/generate-cv-ai";

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
  template_path?: string;
  template_url?: string;
  template_base64?: string;
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
  meta?: Record<string, unknown>;
};

export type AIGenerateResult = {
  file_url?: string;
  url?: string;
  response?: string;
  message?: string;
  file_base64?: string;
  generated_file_name?: string;
  generated_mime_type?: string;
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

export const useGenerateCvAi = () => {
  const { mutateAsync: onGenerateCvAi, isPending: onGenerateCvAiLoading } =
    useMutation({
      mutationFn: async (payload: AIGeneratePayload) => {
        const res = await axios.post(baseUrl, payload, {
          withCredentials: true,
        });
        return (res.data?.result ?? res.data) as AIGenerateResult;
      },
      onError: (error: unknown) => {
        console.error(
          "[generate-cv-ai] error:",
          extractErrorMessage(error),
          error,
        );
      },
    });

  return {
    onGenerateCvAi,
    onGenerateCvAiLoading,
  };
};
