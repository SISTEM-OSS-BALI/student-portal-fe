import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import { useAuth } from "../utils/use-auth";
import {
  PatchDocumentsConsentPayload,
  PatchStatementLetterPayload,
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
} = {}) => {
  const { data, isLoading: fetchLoading, refetch, isError, error } = useQuery({
    queryKey: queryString ? [queryKey, queryString] : [queryKey],
    queryFn: async () => {
      try {
        const url = queryString ? `${usersUrl}?${queryString}` : usersUrl;
        const result = await api.get(url);
        const payload = (result.data?.result ?? result.data) as UserDataModel[];
        return Array.isArray(payload) ? payload : [];
      } catch (err) {
        console.error("Gagal mengambil data users:", err);
        throw err;
      }
    },
    enabled,
  });

  return { data, fetchLoading, refetch, isError, error };
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
  consultant,
}: {
  enabled?: boolean;
  consultant?: string;
} = {}) => {
  const {
    data,
    isLoading: fetchLoading,
    refetch,
  } = useQuery({
    queryKey: ["user-role-students", consultant],
    queryFn: async () => {
      const url = consultant
        ? `${usersUrl}/role-students?consultant=${encodeURIComponent(consultant)}`
        : `${usersUrl}/role-students`;
      const result = await api.get(url);
      const payload = (result.data?.result ?? result.data) as UserDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  return { data, fetchLoading, refetch };
};

export const useUserRoleStudent = useUserRoleStudents;

function extractUserErrorMessage(error: any, defaultFallback: string): string {
  const serverMsg =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    (typeof error?.response?.data?.error === "string"
      ? error.response.data.error
      : null) ||
    error?.message;

  const lower = String(serverMsg ?? "").toLowerCase();
  if (
    lower.includes("email") &&
    (lower.includes("already") ||
      lower.includes("unique") ||
      lower.includes("duplicate") ||
      lower.includes("exists") ||
      lower.includes("terdaftar"))
  ) {
    return "Email sudah terdaftar. Silakan gunakan alamat email lain yang belum digunakan.";
  }

  return serverMsg || defaultFallback;
}

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
    onError: (error: any) => {
      const description = extractUserErrorMessage(
        error,
        `Oops! Something went wrong with ${entity.toLowerCase()}. Unable to created at this time. Please try again later or contact support if the issue persists`,
      );
      notify({ type: "error", entity, action: "created", description });
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
    onError: (error: any) => {
      const description = extractUserErrorMessage(
        error,
        `Oops! Something went wrong with ${entity.toLowerCase()}. Unable to updated at this time. Please try again later or contact support if the issue persists`,
      );
      notify({ type: "error", entity, action: "updated", description });
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

export const usePatchStatementLetter = () => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string | number;
      payload: PatchStatementLetterPayload;
    }) => api.patch(`${usersUrl}/${id}/statement-letter`, payload),
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
