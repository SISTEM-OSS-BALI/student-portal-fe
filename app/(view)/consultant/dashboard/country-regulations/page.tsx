"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConsultantCountryRegulationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/consultant/dashboard/home");
  }, [router]);

  return null;
}
