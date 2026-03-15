"use client";
import React from "react";
import { CheckCircle, Lock, PlayCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const SectionItem = ({ section, subjectId }: { section: any, subjectId: string }) => {
  const pathname = usePathname();

  return (
    <div className="mb-4">
      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 px-2">
        {section.title}
      </h3>
      <div className="space-y-1">
        {section.videos?.map((video: any) => {
          const isActive = pathname.includes(`/video/${video.id}`);
          const isLocked = video.locked;

          return (
            <Link
              key={video.id}
              href={isLocked ? "#" : `/subjects/${subjectId}/video/${video.id}`}
              className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${
                isActive ? "bg-indigo-50 text-indigo-700" : isLocked ? "text-slate-400 cursor-not-allowed opacity-60" : "text-slate-700 hover:bg-slate-100"
              }`}
              onClick={(e) => isLocked && e.preventDefault()}
            >
              <div className="mt-0.5 shrink-0">
                {isLocked ? (
                  <Lock className="w-4 h-4" />
                ) : video.is_completed ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 text-sm font-medium leading-tight">
                {video.title}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
