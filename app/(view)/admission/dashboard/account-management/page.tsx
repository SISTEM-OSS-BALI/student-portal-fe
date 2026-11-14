import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const AccountManagementContent = lazy(() => import("./content"));

export default function AccountManagementPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <AccountManagementContent />
    </Suspense>
  );
}
