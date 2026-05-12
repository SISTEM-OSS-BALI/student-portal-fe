"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const PromoContent = lazy(() => import("./content"));

export default function PromoPage() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <PromoContent />
    </Suspense>
  );
}

