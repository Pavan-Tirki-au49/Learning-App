"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardIndex() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/courses");
  }, [router]);

  return <div className="text-slate-500 animate-pulse">Redirecting to courses dashboard...</div>;
}
