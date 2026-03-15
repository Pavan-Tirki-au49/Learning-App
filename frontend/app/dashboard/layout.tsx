"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookAIcon, Users, Settings } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { AuthGuard } from "@/components/Auth/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user && user.role !== "instructor" && user.role !== "admin") {
      router.push("/subjects");
    }
  }, [user, router]);

  if (!mounted) return null;

  return (
    <AuthGuard>
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-white">
        <aside className="w-64 border-r bg-slate-50 flex flex-col h-full font-sans shadow-inner">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold text-slate-800">Dashboard</h2>
            <p className="text-sm text-slate-500 capitalize">{user?.role} Portal</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            <Link 
              href="/dashboard/courses" 
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${pathname.startsWith('/dashboard/course') ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
            >
              <BookAIcon className="w-5 h-5" />
              My Courses
            </Link>
            {user?.role === "admin" && (
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 cursor-not-allowed opacity-50">
                <Users className="w-5 h-5" />
                Users (WIP)
              </button>
            )}
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 cursor-not-allowed opacity-50">
              <Settings className="w-5 h-5" />
              Settings
            </button>
          </nav>
        </aside>
        <main className="flex-1 overflow-y-auto bg-slate-50 relative p-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
