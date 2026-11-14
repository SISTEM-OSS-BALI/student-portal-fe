"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/utils/use-auth";
import { useUser } from "@/app/hooks/use-users";
import StudentLayout from "@/app/components/container/layout/student";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading: authLoading, user_name, user_id, role } = useAuth();
  const { data: user, fetchLoading: userLoading } = useUser({ id: user_id });
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    const currentRole = (role ?? user?.role ?? "").toUpperCase();
    if (!currentRole) return;

    if (currentRole === "ADMISSION") {
      router.replace("/admission/dashboard/home");
      return;
    }

    if (currentRole === "CONSULTANT") {
      router.replace("/consultant/dashboard/students-management");
      return;
    }
  }, [authLoading, isAuthenticated, role, user?.role, router]);

  if (authLoading || userLoading) return null;

  const currentRole = (role ?? user?.role ?? "").toUpperCase();
  if (currentRole === "ADMISSION" || currentRole === "CONSULTANT") {
    return null;
  }

  return (
    <StudentLayout 
      username={user_name!} 
      userProfilePic={user?.profile_picture_url || undefined}
    >
      {children}
    </StudentLayout>
  );
}
