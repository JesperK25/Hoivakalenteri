"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/kalenteri" : "/login");
  }, [loading, user, router]);

  return (
    <main className="flex-1 flex items-center justify-center text-gray-500">
      Ladataan...
    </main>
  );
}
