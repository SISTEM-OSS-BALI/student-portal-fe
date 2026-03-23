import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/app/vendor/supabase-client";

export type UploadDocumentInput = {
  file: File;
  path: string;
  bucket?: string;
  content_type?: string;
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
      bucket = "student-portal",
      content_type,
    }: UploadDocumentInput): Promise<UploadDocumentResult> => {
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: content_type ?? file.type,
        upsert: true,
      });
      if (error) {
        throw error;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      return { url: data?.publicUrl ?? "", path };
    },
  });

  return {
    uploadDocument: mutateAsync,
    uploading: isPending,
  };
};
