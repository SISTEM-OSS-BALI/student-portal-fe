import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import type {
  StudentCampusApplicationDataModel,
  StudentCampusApplicationPayloadCreateModel,
  StudentCampusApplicationPayloadUpdateModel,
} from "../models/student-campus-application";

const applicationsUrl = "/api/student-campus-applications";
const entity = "campus-application";
const queryKey = "student-campus-applications";

export const useStudentCampusApplications = ({
  userId,
  enabled = true,
}: {
  userId?: string;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, userId],
    queryFn: async () => {
      if (!userId) return [];
      const result = await api.get(`${applicationsUrl}?user_id=${userId}`);
      const payload = (result.data?.result ??
        result.data) as StudentCampusApplicationDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled: Boolean(userId && enabled),
  });

  const invalidateAllRelated = () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] });
    queryClient.invalidateQueries({ queryKey: ["user"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: StudentCampusApplicationPayloadCreateModel) =>
      api.post(applicationsUrl, payload),
    onSuccess: () => {
      invalidateAllRelated();
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: StudentCampusApplicationPayloadUpdateModel;
    }) => api.put(`${applicationsUrl}/${id}`, payload),
    onSuccess: () => {
      invalidateAllRelated();
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  const { mutateAsync: onSetPrimary, isPending: onSetPrimaryLoading } =
    useMutation({
      mutationFn: async (id: string) =>
        api.post(`${applicationsUrl}/${id}/set-primary`),
      onSuccess: () => {
        invalidateAllRelated();
        notify({ type: "success", entity, action: "updated" });
      },
      onError: () => {
        notify({ type: "error", entity, action: "updated" });
      },
    });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string) => api.delete(`${applicationsUrl}/${id}`),
    onSuccess: () => {
      invalidateAllRelated();
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
    },
  });

  return {
    data: data ?? [],
    fetchLoading,
    onCreate,
    onCreateLoading,
    onUpdate,
    onUpdateLoading,
    onSetPrimary,
    onSetPrimaryLoading,
    onDelete,
    onDeleteLoading,
  };
};
