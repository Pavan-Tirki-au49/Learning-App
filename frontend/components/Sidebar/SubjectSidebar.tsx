"use client";
import React, { useEffect } from "react";
import { useSidebarStore } from "@/store/sidebarStore";
import { SectionItem } from "./SectionItem";
import { Spinner } from "../common/Spinner";
import { Lock } from "lucide-react";

export const SubjectSidebar = ({ subjectId }: { subjectId: string }) => {
  const { tree, loading, error, fetchTree } = useSidebarStore();

  useEffect(() => {
    fetchTree(subjectId);
  }, [subjectId, fetchTree]);

  if (loading) {
    return (
      <div className="w-80 border-r bg-white h-[calc(100vh-4rem)] flex items-center justify-center p-6 shrink-0">
        <Spinner />
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="w-80 border-r bg-slate-50 h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 shrink-0 text-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-2">Course Locked</h3>
        <p className="text-sm text-slate-500">You must unlock or enroll in this course to view the full lesson structure.</p>
      </div>
    );
  }

  return (
    <div className="w-80 border-r bg-white overflow-y-auto shrink-0 flex flex-col h-[calc(100vh-4rem)]">
      <div className="p-4 border-b bg-slate-50 sticky top-0 z-10">
        <h2 className="font-bold text-lg text-slate-900 line-clamp-2">{tree.title}</h2>
      </div>
      <div className="p-4 flex-1">
        {tree.sections.map((section: any) => (
          <SectionItem key={section.id} section={section} subjectId={subjectId} />
        ))}
      </div>
    </div>
  );
};
