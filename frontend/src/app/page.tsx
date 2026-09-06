"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && user) {
      router.replace(user.role === "MENTOR" ? "/mentor" : "/aspirant");
    }
  }, [status, user, router]);

  return (
    <main className="flex flex-1 items-center justify-center">
      <p className="font-data text-sm text-ink-soft">Loading…</p>
    </main>
  );
}
