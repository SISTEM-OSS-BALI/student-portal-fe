import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import type {
  ChatConversation,
  ChatMessage,
  MentionMessage,
} from "../models/chat";

const chatBaseUrl = "/api/chats";

export const useChatConversations = () => {
  const { data, isLoading: fetchLoading, refetch } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const result = await api.get(`${chatBaseUrl}/conversations`);
      const payload = (result.data?.result ?? result.data) as ChatConversation[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  return { data, fetchLoading, refetch };
};

export const useCreateChatConversation = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: {
      type: string;
      title?: string | null;
      member_ids: string[];
    }) => api.post(`${chatBaseUrl}/conversations`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  return { onCreate, onCreateLoading };
};

export const useChatMessages = ({
  conversation_id,
  limit = 50,
  offset = 0,
}: {
  conversation_id?: string;
  limit?: number;
  offset?: number;
}) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: ["chat-messages", conversation_id, limit, offset],
    queryFn: async () => {
      if (!conversation_id) return [] as ChatMessage[];
      const url = `${chatBaseUrl}/conversations/${conversation_id}/messages?limit=${limit}&offset=${offset}`;
      const result = await api.get(url);
      const payload = (result.data?.result ?? result.data) as ChatMessage[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled: Boolean(conversation_id),
  });

  return { data, fetchLoading };
};

export const useChatMentions = ({
  limit = 30,
  offset = 0,
  enabled = true,
  user_id,
}: {
  limit?: number;
  offset?: number;
  enabled?: boolean;
  user_id?: string;
}) => {
  const { data, isLoading: fetchLoading, refetch } = useQuery({
    queryKey: ["chat-mentions", user_id, limit, offset],
    queryFn: async () => {
      const url = `${chatBaseUrl}/mentions?limit=${limit}&offset=${offset}`;
      const result = await api.get(url);
      const payload = (result.data?.result ?? result.data) as MentionMessage[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  return { data, fetchLoading, refetch };
};

export const useMarkMentionRead = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: onMarkRead, isPending } = useMutation({
    mutationFn: async (messageId: string) =>
      api.post(`${chatBaseUrl}/mentions/${messageId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-mentions"] });
    },
  });

  return { onMarkRead, isPending };
};
