"use client";

import LoadingSplash from "@/app/components/common/loading";

import { Suspense, lazy } from "react";

const ChatContent = lazy(() => import("./ChatComponent"));

export default function Chat() {
  return (
    <div>
      <Suspense fallback={<LoadingSplash />}>
        <ChatContent />
      </Suspense>
    </div>
  );
}
