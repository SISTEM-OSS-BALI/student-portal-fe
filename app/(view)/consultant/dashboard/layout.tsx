"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/utils/use-auth";
import ConsultantLayout from "@/app/components/container/layout/consultant";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user_name, role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!loading && isAuthenticated && role !== "CONSULTANT") {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, role, router]);

  if (loading) return null;
  return <ConsultantLayout username={user_name!}>{children}</ConsultantLayout>;
}
