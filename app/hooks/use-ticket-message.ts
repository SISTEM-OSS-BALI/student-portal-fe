import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import type {
  TicketMessageDataModel,
  TicketMessagePayloadCreateModel,
  TicketMessagePayloadUpdateModel,
} from "../models/ticket-message";

const baseUrl = "/api/ticket-messages";
const queryKey = "ticket-messages";
const entity = "ticket message";

export const useTicketMessages = ({
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
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as TicketMessageDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: TicketMessagePayloadCreateModel) =>
      api.post(baseUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      maybeNotify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: TicketMessagePayloadUpdateModel;
    }) => api.put(`${baseUrl}/${id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-message", variables.id],
      });
      maybeNotify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "updated" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) => api.delete(`${baseUrl}/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-message", id],
      });
      maybeNotify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "deleted" });
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

const useTicketMessage = ({
  id,
  withNotification = true,
}: {
  id?: string | number;
  withNotification?: boolean;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();
  const maybeNotify = withNotification ? notify : () => {};

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: ["ticket-message", id],
    queryFn: async () => {
      const result = await api.get(`${baseUrl}/${id}`);
      return (result.data?.result ?? result.data) as TicketMessageDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id: updateId,
      payload,
    }: {
      id: string | number;
      payload: TicketMessagePayloadUpdateModel;
    }) => api.put(`${baseUrl}/${updateId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-message", variables.id],
      });
      maybeNotify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "updated" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (deleteId: string | number) =>
      api.delete(`${baseUrl}/${deleteId}`),
    onSuccess: (_, deleteId) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-message", deleteId],
      });
      maybeNotify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "deleted" });
    },
  });

  return {
    data,
    fetchLoading,
    onUpdate,
    onUpdateLoading,
    onDelete,
    onDeleteLoading,
  };
};

export default useTicketMessage;

export const useUpdateStatusTicketMessage = ({
  withNotification = true,
}: {
  withNotification?: boolean;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();
  const maybeNotify = withNotification ? notify : () => {};

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string | number;
      status: string;
    }) => api.put(`${baseUrl}/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-message", variables.id],
      });
      maybeNotify({ type: "success", entity, action: "status updated" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "status updated" });
    },
  });

  return {
    onUpdate,
    onUpdateLoading,
  };
};

export const useDeleteTicketMessageWithConversation = ({
  withNotification = true,
}: {
  withNotification?: boolean;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();
  const maybeNotify = withNotification ? notify : () => {};

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) =>
      api.delete(`${baseUrl}/${id}/with-conversation`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({
        queryKey: ["ticket-message", id],
      });
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
      maybeNotify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      maybeNotify({ type: "error", entity, action: "deleted" });
    },
  });

  return {
    onDelete,
    onDeleteLoading,
  };
};
