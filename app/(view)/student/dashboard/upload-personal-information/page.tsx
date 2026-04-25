"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const UploadDocumentsContent = lazy(() => import("./content/index"));

export default function UploadDocuments() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <UploadDocumentsContent />
    </Suspense>
  );
}
