"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const InformationCountryManagementContent = lazy(
  () => import("./content/index"),
);
export default function InformationCountryManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <InformationCountryManagementContent />
    </Suspense>
  );
}
