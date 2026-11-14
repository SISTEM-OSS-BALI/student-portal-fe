"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/utils/use-auth";
import Login from "./(view)/(auth)/login/page";
import LoadingSplash from "@/app/components/common/loading";

export default function Home() {
  const { isAuthenticated, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (isAuthenticated && role) {
      const upperRole = role.toUpperCase();
      switch (upperRole) {
        case "ADMISSION":
          router.replace("/admission/dashboard/home");
          break;
        case "CONSULTANT":
          router.replace("/consultant/dashboard/students-management");
          break;
        case "DIRECTOR":
          router.replace("/director/dashboard/home");
          break;
        case "STUDENT":
          router.replace("/student/dashboard/home");
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, role, loading, router]);

  if (loading || isAuthenticated) {
    return <LoadingSplash />;
  }

  return <Login />;
}
