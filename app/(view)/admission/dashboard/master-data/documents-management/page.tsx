"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const Documents = lazy(() => import("./content/index"));

export default function DocumentsManagement() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <Documents />
    </Suspense>
  );
}
