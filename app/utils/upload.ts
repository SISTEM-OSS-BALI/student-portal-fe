export const MAX_UPLOAD_SIZE_MB = 5;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export function isAllowedUploadSize(file?: File | null): boolean {
  if (!file || typeof file.size !== "number") return false;
  return file.size <= MAX_UPLOAD_SIZE_BYTES;
}

export function buildUploadSizeErrorMessage(fileName?: string): string {
  const name = String(fileName ?? "File").trim() || "File";
  return `${name} melebihi batas ${MAX_UPLOAD_SIZE_MB} MB.`;
}

