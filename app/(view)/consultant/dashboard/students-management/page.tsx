"use client";

import { Suspense } from "react";
import LoadingSplash from "@/app/components/common/loading";
import StudentsManagementContent from "@/app/(view)/admission/dashboard/students-management/content";

export default function ConsultantStudentsManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash label="Loading pipeline..." />}>
      <StudentsManagementContent
        detailBasePath="/consultant/dashboard/students-management/detail"
        title="Student Pipeline"
        subtitle="Pantau dan kelola progres siswa dampingan"
        addNewText="Add Student"
        consultantOnly={true}
      />
    </Suspense>
  );
}
