import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import type {
  AnswerSelectedOptionDataModel,
  AnswerSelectedOptionPayloadCreateModel,
} from "../models/question";

const answerSelectedOptionsUrl = "/api/answer-selected-options";
const entity = "answer selected option";
const queryKey = "answer-selected-options";

export const useAnswerSelectedOptions = ({
  queryString,
}: {
  queryString?: string;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString
        ? `${answerSelectedOptionsUrl}?${queryString}`
        : answerSelectedOptionsUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as AnswerSelectedOptionDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: AnswerSelectedOptionPayloadCreateModel) =>
      api.post(answerSelectedOptionsUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async ({
      answer_id,
      option_id,
    }: {
      answer_id: string | number;
      option_id: string | number;
    }) => api.delete(`${answerSelectedOptionsUrl}/${answer_id}/${option_id}`),
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
    onDelete,
    onDeleteLoading,
  };
};

export const useAnswerSelectedOption = ({
  answer_id,
  option_id,
}: {
  answer_id: string | number;
  option_id: string | number;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, answer_id, option_id],
    queryFn: async () => {
      const result = await api.get(
        `${answerSelectedOptionsUrl}/${answer_id}/${option_id}`,
      );
      return (result.data?.result ??
        result.data) as AnswerSelectedOptionDataModel;
    },
    enabled: Boolean(answer_id) && Boolean(option_id),
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async () =>
      api.delete(`${answerSelectedOptionsUrl}/${answer_id}/${option_id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: [entity, answer_id, option_id],
      });
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
    },
  });

  return {
    data,
    fetchLoading,
    onDelete,
    onDeleteLoading,
  };
};
