import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import {
  StagesManagementDataModel,
  StagesManagementPayloadCreateModel,
  StagesManagementPayloadUpdateModel,
} from "../models/stages-management";

const stagesUrl = "/api/stages";

const entity = "stage";
const queryKey = "stages-management";

export const useStagesManagement = ({
  queryString,
}: {
  queryString?: string;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${stagesUrl}?${queryString}` : stagesUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as StagesManagementDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: StagesManagementPayloadCreateModel) =>
      api.post(stagesUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) => api.delete(`${stagesUrl}/${id}`),
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

export const useStageManagement = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${stagesUrl}/${id}`);
      return (result.data?.result ??
        result.data) as StagesManagementDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id: updateId,
      payload,
    }: {
      id: string | number;
      payload: StagesManagementPayloadUpdateModel;
    }) => api.put(`${stagesUrl}/${updateId}`, payload),
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
