"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Spinner } from "../common/Spinner";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!_hasHydrated) return; // Wait until store is hydrated from storage
    if (!isAuthenticated) {
      router.push("/auth/login");
    }
  }, [_hasHydrated, isAuthenticated, router]);

  if (!_hasHydrated) return <div className="min-h-screen flex items-center justify-center"><Spinner /></div>;
  if (!isAuthenticated) return null;

  return <>{children}</>;
};
