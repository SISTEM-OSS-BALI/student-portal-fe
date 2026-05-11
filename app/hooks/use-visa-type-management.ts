import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import {
  VisaTypeManagementDataModel,
  VisaTypeManagementPayloadCreateModel,
  VisaTypeManagementPayloadUpdateModel,
} from "../models/visa-type-management";

const visaTypesUrl = "/api/visa-types";

const entity = "visa-type";
const queryKey = "visa-types";

export const useVisaTypes = ({
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
      const url = queryString ? `${visaTypesUrl}?${queryString}` : visaTypesUrl;
      const result = await api.get(url);

      const payload = (result.data?.result ??
        result.data?.data ??
        result.data) as VisaTypeManagementDataModel[];

      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  return { data, fetchLoading, refetch };
};

export const useVisaType = ({
  id,
  enabled = true,
}: {
  id?: string | number;
  enabled?: boolean;
}) => {
  const {
    data,
    isLoading: fetchLoading,
    refetch,
  } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${visaTypesUrl}/${id}`);

      return (result.data?.result ??
        result.data?.data ??
        result.data) as VisaTypeManagementDataModel;
    },
    enabled: Boolean(id) && enabled,
  });

  return { data, fetchLoading, refetch };
};

export const useCreateVisaType = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: VisaTypeManagementPayloadCreateModel) =>
      api.post(visaTypesUrl, payload),
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

export const useUpdateVisaType = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: VisaTypeManagementPayloadUpdateModel;
    }) => api.put(`${visaTypesUrl}/${id}`, payload),
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

export const useDeleteVisaType = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) =>
      api.delete(`${visaTypesUrl}/${id}`),
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
