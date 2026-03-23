"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const StepsManagementContentLazy = lazy(() => import("./content/index"));

export default function StepsManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <StepsManagementContentLazy />
    </Suspense>
  );
}
