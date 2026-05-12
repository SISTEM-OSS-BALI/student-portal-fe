import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const PromoManagementContent = lazy(() => import("./content"));

export default function PromoManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <PromoManagementContent />
    </Suspense>
  );
}

