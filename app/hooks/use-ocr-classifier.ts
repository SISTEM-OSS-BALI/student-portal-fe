import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  OCRClassifyPayload,
  OCRClassifyResultModel,
} from "../models/ocr";

export const useOCRClassifier = () => {
  // Classify via JSON (URL or answer_document_id)
  const {
    mutateAsync: classifyDocument,
    isPending: isClassifyingUrl,
    error: classifyUrlError,
  } = useMutation({
    mutationFn: async (
      payload: OCRClassifyPayload,
    ): Promise<OCRClassifyResultModel> => {
      const response = await api.post("/api/ocr/classify", payload);
      return response.data?.result ?? response.data;
    },
  });

  // Classify direct File upload (multipart/form-data)
  const {
    mutateAsync: classifyFile,
    isPending: isClassifyingFile,
    error: classifyFileError,
  } = useMutation({
    mutationFn: async ({
      file,
      expected_code,
      expected_label,
      use_ai,
    }: {
      file: File;
      expected_code?: string;
      expected_label?: string;
      use_ai?: boolean;
    }): Promise<OCRClassifyResultModel> => {
      const formData = new FormData();
      formData.append("file", file);
      if (expected_code) formData.append("expected_code", expected_code);
      if (expected_label) formData.append("expected_label", expected_label);
      if (use_ai) formData.append("use_ai", "true");

      const response = await api.post("/api/ocr/classify", formData);
      return response.data?.result ?? response.data;
    },
  });

  // Classify an existing answer document by its DB ID
  const {
    mutateAsync: classifyAnswerDocument,
    isPending: isClassifyingAnswer,
    error: classifyAnswerError,
  } = useMutation({
    mutationFn: async (
      answerDocumentId: string,
    ): Promise<OCRClassifyResultModel> => {
      const response = await api.get(`/api/ocr/classify/answer/${answerDocumentId}`);
      return response.data?.result ?? response.data;
    },
  });

  // Generate dynamic keywords using AI
  const {
    mutateAsync: generateKeywords,
    isPending: isGeneratingKeywords,
    error: generateKeywordsError,
  } = useMutation({
    mutationFn: async ({
      file,
      url,
      text,
      label,
    }: {
      file?: File;
      url?: string;
      text?: string;
      label?: string;
    }): Promise<{
      keywords: string[];
      raw_text_snippet: string;
      source: string;
      processed_at: string;
    }> => {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        if (label) formData.append("label", label);
        if (text) formData.append("text", text);
        if (url) formData.append("url", url);
        const response = await api.post("/api/ocr/generate-keywords", formData);
        return response.data?.result ?? response.data;
      }

      const response = await api.post("/api/ocr/generate-keywords", {
        label,
        url,
        text,
      });
      return response.data?.result ?? response.data;
    },
  });

  return {
    classifyDocument,
    classifyFile,
    classifyAnswerDocument,
    generateKeywords,
    isGeneratingKeywords,
    isLoading: isClassifyingUrl || isClassifyingFile || isClassifyingAnswer || isGeneratingKeywords,
    error: classifyUrlError || classifyFileError || classifyAnswerError || generateKeywordsError,
  };
};
