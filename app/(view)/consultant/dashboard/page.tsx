"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConsultantDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/consultant/dashboard/students-management");
  }, [router]);

  return null;
}
