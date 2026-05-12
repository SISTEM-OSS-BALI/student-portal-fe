import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/app/vendor/supabase-client";
import {
  buildUploadSizeErrorMessage,
  isAllowedUploadSize,
} from "@/app/utils/upload";

export type UploadDocumentInput = {
  file: File;
  path: string;
  content_type?: string;
  student_folder_key?: string;
};

export type UploadDocumentResult = {
  url: string;
  path: string;
};

export const useDocumentUpload = () => {
  const { mutateAsync, isPending } = useMutation({
    mutationFn: async ({
      file,
      path,
      content_type,
      student_folder_key,
    }: UploadDocumentInput): Promise<UploadDocumentResult> => {
      if (!isAllowedUploadSize(file)) {
        throw new Error(buildUploadSizeErrorMessage(file?.name));
      }

      const bucket = "student-portal";
      const normalizedStudentFolderKey = String(student_folder_key ?? "")
        .trim()
        .replace(/^\/+|\/+$/g, "")
        .replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const normalizedPath = String(path ?? "").trim().replace(/^\/+/, "");
      const finalPath =
        normalizedStudentFolderKey && !normalizedPath.startsWith("students/")
          ? `students/${normalizedStudentFolderKey}/${normalizedPath}`
          : normalizedPath;

      const { error } = await supabase.storage.from(bucket).upload(finalPath, file, {
        contentType: content_type ?? file.type,
        upsert: true,
      });
      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath);
      return { url: data?.publicUrl ?? "", path: finalPath };
    },
  });

  return {
    uploadDocument: mutateAsync,
    uploading: isPending,
  };
};
