import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import { useAuth } from "../utils/use-auth";
import {
  PatchDocumentsConsentPayload,
  UserDataModel,
  UserLoginModel,
  UserPayloadCreateModel,
  UserPayloadUpdateModel,
} from "../models/user";

const usersUrl = "/api/users";

const entity = "user";
const queryKey = "users";

export const useUsers = ({
  queryString,
  enabled = true,
}: {
  queryString?: string;
  enabled?: boolean;
}) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${usersUrl}?${queryString}` : usersUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ?? result.data) as UserDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  return { data, fetchLoading };
};

export const useUser = ({ id }: { id?: string | number }) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${usersUrl}/${id}`);
      return (result.data?.result ?? result.data) as UserDataModel;
    },
    enabled: Boolean(id),
  });

  return { data, fetchLoading };
};

export const useUserRoleStudents = ({
  enabled = true,
}: {
  enabled?: boolean;
} = {}) => {
  const {
    data,
    isLoading: fetchLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-role-students"],
    queryFn: async () => {
      const result = await api.get(`${usersUrl}/role-students`);
      const payload = (result.data?.result ?? result.data) as UserDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  return { data, fetchLoading, refetch };
};

export const useUserRoleStudent = useUserRoleStudents;

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: UserPayloadCreateModel) =>
      api.post(usersUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["user-role-students"] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  return { onCreate, onCreateLoading };
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: UserPayloadUpdateModel;
    }) => api.put(`${usersUrl}/${id}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["user-role-students"] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  return { onUpdate, onUpdateLoading };
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) => api.delete(`${usersUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["user-role-students"] });
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
    },
  });

  return { onDelete, onDeleteLoading };
};

export const useLogin = () => {
  const { login } = useAuth();
  const notify = useMainNotification();

  const { mutateAsync: onLogin, isPending: onLoginLoading } = useMutation({
    mutationFn: async (payload: UserLoginModel) => {
      const response = await api.post("/api/auth/login", payload);
      return response.data;
    },
    onSuccess: (response) => {
      const user = response?.user as
        | { id?: string; name?: string; role?: string }
        | undefined;
      if (user) {
        login({ id: user.id, name: user.name, role: user.role });
      } else {
        notify({ type: "error", entity, action: "login" });
      }
    },
    onError: () => {
      notify({ type: "error", entity, action: "login" });
    },
  });

  return { onLogin, onLoginLoading };
};

export const usePatchQuotaTranslation = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onPatch, isPending: onPatchLoading } = useMutation({
    mutationFn: async ({
      id,
      quota,
    }: {
      id: string | number;
      quota: number;
    }) =>
      api.patch(`${usersUrl}/${id}/translation-quota`, {
        translation_quota: quota,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["user-role-students"] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "patched" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "patched" });
    },
  });

  return { onPatch, onPatchLoading };
};

export const useUpdateVisaStatusUser = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      visa_status,
    }: {
      id: string | number;
      visa_status: string;
    }) =>
      api.patch(`${usersUrl}/${id}/visa-status`, {
        visa_status,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["user-role-students"] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  return { onUpdate, onUpdateLoading };
};


export const useUpdateStudentStatusUser = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      student_status,
    }: {
      id: string | number;
      student_status: string;
    }) =>
      api.patch(`${usersUrl}/${id}/student-status`, {
        student_status,
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: ["user-role-students"] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  return { onUpdate, onUpdateLoading };
};

export const usePatchDocumentConsent = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: PatchDocumentsConsentPayload;
    }) => api.patch(`${usersUrl}/${id}/document-consent`, payload),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: [queryKey] });
      await queryClient.invalidateQueries({ queryKey: ["user-role-students"] });
      await queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  return { onUpdate, onUpdateLoading };
};
