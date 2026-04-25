"use client";

import LoadingSplash from "@/app/components/common/loading";
import { Suspense, lazy } from "react";

const CountryDocumentComponent = lazy(
  () => import("./CountryDocumentComponent"),
);

export default function UploadCountryDocument() {
  return (
    <Suspense fallback={<LoadingSplash />}>
      <CountryDocumentComponent />
    </Suspense>
  );
}
