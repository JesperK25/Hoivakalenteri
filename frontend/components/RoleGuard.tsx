"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, Role } from "@/lib/auth";

export default function RoleGuard({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== role) {
      router.replace("/kalenteri");
    }
  }, [loading, user, role, router]);

  if (loading || !user || user.role !== role) {
    return (
      <main className="flex-1 flex items-center justify-center text-ink-500">
        Ladataan...
      </main>
    );
  }

  return <>{children}</>;
}
