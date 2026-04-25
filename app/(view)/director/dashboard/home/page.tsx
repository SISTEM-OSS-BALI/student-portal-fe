"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const DashboardContent = lazy(() => import("./content/index"));

export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <DashboardContent />
    </Suspense>
  );
}
