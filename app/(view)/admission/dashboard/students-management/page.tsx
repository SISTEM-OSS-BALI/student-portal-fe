"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const StudentsManagementContent = lazy(() => import("./content/index"));

export default function StudentsManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <StudentsManagementContent />
    </Suspense>
  );
}
