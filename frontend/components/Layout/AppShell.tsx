"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from "@/store/authStore";
import { LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const AppShell = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={mounted && isAuthenticated ? "/subjects" : "/"} className="flex items-center gap-2 text-indigo-600 font-bold text-xl tracking-tight">
            <BookOpen className="w-6 h-6" />
            <span>LMS</span>
          </Link>
          <nav className="flex items-center gap-6">
            {mounted && isAuthenticated ? (
              <>
                <Link href="/subjects" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Courses</Link>
                <Link href="/my-courses" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">My Learning</Link>
                <Link href="/profile" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Profile</Link>
                {(user?.role === "instructor" || user?.role === "admin") && (
                  <Link href="/dashboard" className="text-indigo-600 font-bold hover:text-indigo-800 transition-colors">Dashboard</Link>
                )}
                <div className="flex items-center gap-4 border-l pl-6">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    {user?.name}
                  </span>
                  <button onClick={handleLogout} title="Logout" className="text-slate-400 hover:text-red-500 transition-colors">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              mounted && (
                <div className="flex items-center gap-4">
                  <Link href="/auth/login" className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">Login</Link>
                  <Link href="/auth/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">Register</Link>
                </div>
              )
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  );
};
