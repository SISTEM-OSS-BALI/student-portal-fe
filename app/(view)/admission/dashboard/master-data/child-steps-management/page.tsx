"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const ChildStepsManagementContent = lazy(() => import("./content/index"));

export default function ChildStepsManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <ChildStepsManagementContent />
    </Suspense>
  );
}
