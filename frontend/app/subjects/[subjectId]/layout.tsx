"use client";
import React from "react";
import { SubjectSidebar } from "@/components/Sidebar/SubjectSidebar";
import { AuthGuard } from "@/components/Auth/AuthGuard";

import { useParams } from "next/navigation";

export default function SubjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  
  return (
    <AuthGuard>
      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden bg-white">
        <SubjectSidebar subjectId={params?.subjectId as string} />
        <main className="flex-1 overflow-y-auto bg-slate-50 relative">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
