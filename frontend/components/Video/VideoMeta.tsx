"use client";
import React from "react";
import { useVideoStore } from "@/store/videoStore";
import { CheckCircle } from "lucide-react";

export const VideoMeta = () => {
  const { currentVideo, isCompleted } = useVideoStore();

  if (!currentVideo) return null;

  return (
    <div className="mt-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{currentVideo.title}</h1>
          <p className="text-slate-500 mt-1 font-medium">{currentVideo.subject_title} • {currentVideo.section_title}</p>
        </div>
        {isCompleted && (
          <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full font-medium text-sm">
            <CheckCircle className="w-4 h-4" />
            Completed
          </div>
        )}
      </div>
      <div className="mt-6 prose prose-slate max-w-none">
        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{currentVideo.description}</p>
      </div>
    </div>
  );
};
