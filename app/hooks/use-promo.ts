import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { useMainNotification } from "../components/common/notification";
import type {
  PromoDataModel,
  PromoPayloadCreateModel,
  PromoPayloadUpdateModel,
} from "../models/promo";

const promosUrl = "/api/promos";
const queryKey = "promos";
const entity = "promo";

export const usePromos = ({
  queryString,
  enabled = true,
}: {
  queryString?: string;
  enabled?: boolean;
} = {}) => {
  const {
    data,
    isLoading: fetchLoading,
    refetch,
  } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${promosUrl}?${queryString}` : promosUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data?.data ??
        result.data) as PromoDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  return { data, fetchLoading, refetch };
};

export const useCreatePromo = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: PromoPayloadCreateModel) =>
      api.post(promosUrl, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  return { onCreate, onCreateLoading };
};

export const useUpdatePromo = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: PromoPayloadUpdateModel;
    }) => api.put(`${promosUrl}/${id}`, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      await queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  return { onUpdate, onUpdateLoading };
};

export const useDeletePromo = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) => api.delete(`${promosUrl}/${id}`),
    onSuccess: async (_, id) => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      await queryClient.invalidateQueries({ queryKey: [entity, id] });
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
    },
  });

  return { onDelete, onDeleteLoading };
};

