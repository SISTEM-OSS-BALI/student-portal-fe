"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/utils/use-auth";
import AdmissionLayout from "@/app/components/container/layout/admission";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user_name } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login");
  }, [loading, isAuthenticated, router]);

  if (loading) return null;
  return <AdmissionLayout username={user_name!}>{children}</AdmissionLayout>;
}
