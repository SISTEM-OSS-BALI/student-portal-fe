"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const QuestionManagementContent = lazy(() => import("./content/index"));

export default function QuestionManagementDetail() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <QuestionManagementContent />
    </Suspense>
  );
}
