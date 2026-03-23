import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export const useCountDocumentsPage = (
  url?: string,
): {
  count: number | undefined;
  isLoading: boolean;
} => {
  const { data, isLoading } = useQuery({
    queryKey: ["documents-page-count", url],
    queryFn: async () => {
      if (!url) return undefined;
      const result = await api.post("/api/documents/page-count", { url });
      const payload = result.data?.result ?? result.data;
      return typeof payload?.page_count === "number"
        ? payload.page_count
        : undefined;
    },
    enabled: Boolean(url),
  });

  return {
    count: data,
    isLoading,
  };
};
