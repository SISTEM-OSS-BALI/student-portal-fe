"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const DashboardContent = lazy(
  () => import("@/app/(view)/admission/dashboard/home/content/index"),
);

export default function ConsultantDashboardHomePage() {
  return (
    <Suspense fallback={<LoadingSplash label="Memuat Consultant Operations..." />}>
      <DashboardContent
        isConsultant={true}
        title="Consultant Operations"
        subtitle="Pantau pipeline dan progres berkas siswa dampingan"
        pipelinePath="/consultant/dashboard/students-management"
        detailBasePath="/consultant/dashboard/students-management/detail"
      />
    </Suspense>
  );
}
