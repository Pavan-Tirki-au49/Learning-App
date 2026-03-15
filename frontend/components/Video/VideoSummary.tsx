"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { Spinner } from "../common/Spinner";
import { Sparkles, CheckCircle2 } from "lucide-react";

interface SummaryData {
  summary: string;
  key_points: string[];
}

export const VideoSummary = ({ videoId }: { videoId: string }) => {
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError("");
      try {
        const { data: summaryRes } = await apiClient.get(`/videos/${videoId}/summary`);
        setData(summaryRes);
      } catch (err: any) {
        console.error("Summary fetch error", err);
        setError("Failed to generate AI summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [videoId]);

  if (loading) {
    return (
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6 flex justify-center items-center gap-3 text-slate-500 font-medium">
        <Spinner />
        <span className="animate-pulse">Generating AI Summary...</span>
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 p-6 rounded-2xl border border-slate-200 mt-6 shadow-sm font-sans">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
          <Sparkles className="w-4 h-4 fill-white" />
        </div>
        <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Lesson Summary</h3>
      </div>

      <div className="space-y-4">
        <p className="text-slate-700 leading-relaxed text-sm md:text-base font-medium">
          {data.summary}
        </p>

        {data.key_points && data.key_points.length > 0 && (
          <div>
            <h4 className="font-bold text-slate-800 text-sm mb-3 uppercase tracking-wider">Key Takeaways</h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.key_points.map((point, index) => (
                <li key={index} className="flex items-start gap-2.5 bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm font-medium leading-tight">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
