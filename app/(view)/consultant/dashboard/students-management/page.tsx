"use client";

import LoadingSplash from "@/app/components/common/loading";
import StudentsManagementContent from "@/app/(view)/director/dashboard/students-management/content";
import { Suspense } from "react";

export default function ConsultantStudentsManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <StudentsManagementContent
        detailBasePath="/consultant/dashboard/students-management/detail"
        readOnly
        title="Student Pipeline Management"
        description="Pantau progres student berdasarkan status, negara tujuan, visa, dan jenjang pendidikan tanpa mengubah data."
      />
    </Suspense>
  );
}
