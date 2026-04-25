const sanitizePreviewFileName = (value?: string | null) => {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "document";
  return trimmed.replace(/[\r\n"]/g, "_");
};

export const buildFilePreviewUrl = (
  sourceUrl?: string | null,
  fileName?: string | null,
  contentType?: string | null,
) => {
  if (!sourceUrl) return "";

  const params = new URLSearchParams({
    url: sourceUrl,
    file_name: sanitizePreviewFileName(fileName),
  });

  if (contentType) {
    params.set("content_type", contentType);
  }

  return `/api/file-preview?${params.toString()}`;
};
