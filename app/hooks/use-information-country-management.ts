import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

import { useMainNotification } from "../components/common/notification";
import { InformationCountryDataModel, InformationCountryPayloadCreateModel, InformationCountryPayloadUpdateModel } from "../models/information-country-management";


const baseUrl = "/api/information-countries";

const entity = "information-country";
const queryKey = "information-countries";

export const useInformationCountries = ({
  queryString,
  enabled = true,
}: {
  queryString?: string;
  enabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, queryString],
    queryFn: async () => {
      const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;
      const result = await api.get(url);
      const payload = (result.data?.result ??
        result.data) as InformationCountryDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled,
  });

  const { mutateAsync: onCreate, isPending: onCreateLoading } = useMutation({
    mutationFn: async (payload: InformationCountryPayloadCreateModel) =>
      api.post(baseUrl, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "created" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "created" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (id: string | number) => api.delete(`${baseUrl}/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
    },
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id: updateId,
      payload,
    }: {
      id: string | number;
      payload: InformationCountryPayloadUpdateModel;
    }) => api.put(`${baseUrl}/${updateId}`, payload),
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
    onCreate,
    onCreateLoading,
    onDelete,
    onDeleteLoading,
    onUpdate,
    onUpdateLoading,
  };
};

export const useInformationCountry = ({ id }: { id: string | number }) => {
  const queryClient = useQueryClient();
  const notify = useMainNotification();

  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, id],
    queryFn: async () => {
      const result = await api.get(`${baseUrl}/${id}`);
      return (result.data?.result ??
        result.data) as InformationCountryDataModel;
    },
    enabled: Boolean(id),
  });

  const { mutateAsync: onUpdate, isPending: onUpdateLoading } = useMutation({
    mutationFn: async ({
      id: updateId,
      payload,
    }: {
      id: string | number;
      payload: InformationCountryPayloadUpdateModel;
    }) => api.put(`${baseUrl}/${updateId}`, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, variables.id] });
      notify({ type: "success", entity, action: "updated" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "updated" });
    },
  });

  const { mutateAsync: onDelete, isPending: onDeleteLoading } = useMutation({
    mutationFn: async (deleteId: string | number) =>
      api.delete(`${baseUrl}/${deleteId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      queryClient.invalidateQueries({ queryKey: [entity, id] });
      notify({ type: "success", entity, action: "deleted" });
    },
    onError: () => {
      notify({ type: "error", entity, action: "deleted" });
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

export const useInformationCountryBySlug = ({
  slug,
  enabled = true,
}: {
  slug?: string;
  enabled?: boolean;
}) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [entity, "slug", slug],
    queryFn: async () => {
      const result = await api.get(`${baseUrl}/slug/${slug}`);
      return (result.data?.result ??
        result.data) as InformationCountryDataModel;
    },
    enabled: enabled && Boolean(slug),
  });

  return {
    data,
    fetchLoading,
  };
};

export const useInformationCountriesByCountry = ({
  countryId,
  enabled = true,
}: {
  countryId?: string | number;
  enabled?: boolean;
}) => {
  const { data, isLoading: fetchLoading } = useQuery({
    queryKey: [queryKey, "country", countryId],
    queryFn: async () => {
      const result = await api.get(`${baseUrl}/country/${countryId}`);
      const payload = (result.data?.result ??
        result.data) as InformationCountryDataModel[];
      return Array.isArray(payload) ? payload : [];
    },
    enabled: enabled && Boolean(countryId),
  });

  return {
    data,
    fetchLoading,
  };
};
