import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const VisaTypeManagementContent = lazy(() => import("./content"));

export default function VisaTypeManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <VisaTypeManagementContent />
    </Suspense>
  );
}
