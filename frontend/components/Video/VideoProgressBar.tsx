"use client";
import React from "react";
import { useVideoStore } from "@/store/videoStore";

export const VideoProgressBar = () => {
  const { currentTime, duration } = useVideoStore();
  
  if (duration <= 0) return null;
  const progress = Math.min((currentTime / duration) * 100, 100);

  return (
    <div className="w-full h-1.5 bg-slate-200 mt-0">
      <div 
        className="h-full bg-indigo-600 transition-all duration-1000 ease-linear"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};
