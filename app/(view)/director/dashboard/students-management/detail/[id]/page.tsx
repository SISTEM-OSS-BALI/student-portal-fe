"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const StudentDetailContent = lazy(() => import("./content"));

export default function DetailStudentPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <StudentDetailContent />
    </Suspense>
  );
}
