"use client";


import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const StagesManagementContent = lazy(() => import("./content/index"));

export default function StagesManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <StagesManagementContent />
    </Suspense>
  );
}
