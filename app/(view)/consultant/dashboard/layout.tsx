"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/utils/use-auth";
import { useUser } from "@/app/hooks/use-users";
import ConsultantLayout from "@/app/components/container/layout/consultant";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading, user_name, role, user_id } = useAuth();
  const { data: user } = useUser({ id: user_id });
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!authLoading && isAuthenticated && role !== "CONSULTANT") {
      router.replace("/login");
    }
  }, [isAuthenticated, authLoading, role, router]);

  if (authLoading) return null;
  return (
    <ConsultantLayout 
      username={user_name!}
      userProfilePic={user?.profile_picture_url || undefined}
    >
      {children}
    </ConsultantLayout>
  );
}
