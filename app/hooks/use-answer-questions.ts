import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import type {
  AnswerQuestionDataModel,
  AnswerQuestionPayloadCreateModel,
  AnswerQuestionPayloadUpdateModel,
} from "../models/question";

const answerQuestionsUrl = "/api/answer-questions";
const entity = "answer question";
const queryKey = "answer-questions";

export const useAnswerQuestions = ({
  queryString,
  enabled = true,
  withNotification = true,
}: {
  queryString?: string;
  enabled?: boolean;
  withNotification?: boolean;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();
  const maybeNotify = withNotification ? notify : () => {};

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString
        ? `${answerQuestionsUrl}?${queryString}`
        : answerQuestionsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as AnswerQuestionDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: AnswerQuestionPayloadCreateModel) =>
      api.post(answerQuestionsUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      maybeNotify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) =>
      api.delete(`${answerQuestionsUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      maybeNotify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "deleted" });
    },
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id: updateId,
      payload,
    }: {
      id: string | number;
      payload: AnswerQuestionPayloadUpdateModel;
    }) => api.put(`${answerQuestionsUrl}/${updateId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      maybeNotify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "updated" });
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

export const useAnswerQuestion = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${answerQuestionsUrl}/${id}`);
      return (result.data?.result ?? result.data) as AnswerQuestionDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id: updateId,
      payload,
    }: {
      id: string | number;
      payload: AnswerQuestionPayloadUpdateModel;
    }) => api.put(`${answerQuestionsUrl}/${updateId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
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
