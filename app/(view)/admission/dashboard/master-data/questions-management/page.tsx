"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const QuestionsManagementContent = lazy(() => import("./content/index"));

export default function QuestionManagement() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <QuestionsManagementContent />
    </Suspense>
  );
}
