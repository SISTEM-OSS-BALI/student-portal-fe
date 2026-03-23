"use client";

import { Suspense, lazy } from "react";
import LoadingSplash from "@/app/components/common/loading";

const StagesManagementDetailContent = lazy(() => import("./content/index"));

export default function StagesManagementDetailPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <StagesManagementDetailContent />
    </Suspense>
  );
}
