"use client";

import { Suspense } from "react";
import LoadingSplash from "@/app/components/common/loading";
import StudentsManagementContent from "@/app/(view)/admission/dashboard/students-management/content";

export default function DirectorStudentsManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash label="Loading students management..." />}>
      <StudentsManagementContent
        detailBasePath="/director/dashboard/students-management/detail"
        title="Student Pipeline"
        subtitle="Pantau progres pipeline siswa dan pengajuan visa"
        readOnly={true}
        hideAddNew={true}
      />
    </Suspense>
  );
}
