"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/apiClient";
import { Spinner } from "@/components/common/Spinner";
import { PlayCircle, Award, Compass, Search, BookOpen, Sparkles } from "lucide-react";

interface ResumeData {
  last_subject_id: number;
  last_video_id: number;
  last_position_seconds: number;
  subject_title?: string;
  video_title?: string;
}

export default function Home() {
  const { user } = useAuthStore();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [extraData, setExtraData] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [resResume, resProfile, resRecs, resStreak] = await Promise.all([
          apiClient.get("/users/resume"),
          apiClient.get("/profile/dashboard").catch(() => null), // Safe fallback
          apiClient.get("/recommendations").catch(() => ({ data: [] })),
          apiClient.get("/streak").catch(() => ({ data: { current_streak: 0 } }))
        ]);
        
        setResume(resResume.data);
        if (resProfile) setExtraData(resProfile.data);
        setRecommendations(resRecs.data);
        setStreak(resStreak.data.current_streak || 0);

        // If we have resume data, fetch titles for better UI
        if (resResume.data) {
          const { data: subject } = await apiClient.get(`/subjects/${resResume.data.last_subject_id}`);
          const { data: video } = await apiClient.get(`/videos/${resResume.data.last_video_id}`);
          setResume(prev => prev ? {
            ...prev,
            subject_title: subject.title,
            video_title: video.title
          } : null);
        }
      } catch (err) {
        console.error("Error loaded home dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (!user) {
    // If absolutely not logged in, wait or show landing. But layouts might auto-guard or we rely on Zustand
    // We can show a landing page hero
    return (
      <div className="bg-slate-950 text-white min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 text-center font-sans">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-6">
          Learn without limits.
        </h1>
        <p className="text-slate-400 max-w-2xl text-xl mb-10">
          Start your learning journey today with expert-led courses on everything from technology to business.
        </p>
        <div className="flex gap-4">
          <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8 py-4 rounded-xl shadow-lg transition-transform hover:scale-105">
            Log In to Study
          </Link>
          <Link href="/register" className="bg-white text-slate-900 font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-slate-50 transition-transform hover:scale-105">
            Join for Free
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center"><Spinner /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-1">Welcome back, {user.name}!</h1>
            {streak > 0 && (
              <div className="flex items-center gap-1 bg-amber-50 text-amber-600 font-black text-sm px-3 py-1.5 rounded-full border border-amber-200 shadow-sm animate-bounce">
                🔥 {streak} Day Streak
              </div>
            )}
          </div>
          <p className="text-slate-500 font-medium">Pick up right where you left off or explore new courses.</p>
        </div>
      </div>

      {/* Continue Learning Banner */}
      {resume ? (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xl shadow-indigo-50/20 mb-12 flex flex-col md:flex-row group transition-all duration-300 hover:shadow-2xl hover:border-indigo-100">
          <div className="md:w-2/5 bg-gradient-to-br from-indigo-600 to-indigo-900 p-10 flex flex-col justify-between text-white relative">
            <div className="z-10">
              <span className="bg-indigo-500/30 text-indigo-100 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-400/20">
                Continue Learning
              </span>
              <h2 className="text-2xl font-black mt-4 leading-tight">
                {resume.subject_title || "Current Course"}
              </h2>
              <p className="opacity-80 mt-2 text-sm">
                Next up: {resume.video_title || "Next Lesson"}
              </p>
            </div>
            
            <Link 
              href={`/subjects/${resume.last_subject_id}/video/${resume.last_video_id}`}
              className="mt-10 md:mt-0 font-bold bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3.5 rounded-xl shadow-md flex items-center justify-center gap-2 max-w-xs transition-transform group-hover:scale-105 active:scale-95"
            >
              <PlayCircle className="w-5 h-5" /> Resume Player
            </Link>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors duration-500"></div>
          </div>
          <div className="p-10 flex-1 flex flex-col justify-center bg-slate-50">
            <h3 className="font-extrabold text-xl text-slate-800 mb-4">Course Progress Overview</h3>
            {extraData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border flex items-center gap-3 shadow-sm">
                  <Award className="w-10 h-10 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{extraData.completed_courses}</h4>
                    <p className="text-slate-400 text-xs font-medium uppercase">Completed</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl border flex items-center gap-3 shadow-sm">
                  <Compass className="w-10 h-10 text-indigo-500" />
                  <div>
                    <h4 className="font-bold text-slate-800 text-lg">{extraData.enrolled_courses}</h4>
                    <p className="text-slate-400 text-xs font-medium uppercase">Active Courses</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm font-medium">Enrolled in courses can quickly watch analytics dashboards.</p>
            )}
            <Link href="/my-courses" className="mt-6 text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline">
              View All Enrolled Courses &rarr;
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-10 border border-indigo-100 flex flex-col items-center justify-center text-center mb-12">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-md mb-4">
            <BookOpen className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Start Your First Lesson!</h2>
          <p className="text-slate-600 max-w-md mb-6">Choose from of dozens catalog classes completely designed to accelerate your growth metrics.</p>
          <Link href="/subjects" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl shadow-md flex items-center gap-2">
            <Search className="w-5 h-5"/> Browse catalog
          </Link>
        </div>
      )}

      {/* Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="mb-12">
          <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
            Recommended for you
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recommendations.map((sub: any) => (
              <Link href={`/subjects/${sub.id}`} key={sub.id} className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col">
                <div 
                  className="h-40 bg-slate-100 bg-cover bg-center flex items-center justify-center relative"
                  style={sub.thumbnail_url ? { backgroundImage: `url(${sub.thumbnail_url})` } : {}}
                >
                  {!sub.thumbnail_url && <BookOpen className="w-12 h-12 text-slate-300" />}
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                      {sub.title}
                    </h4>
                    <p className="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">{sub.description}</p>
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                    <span>⭐ {sub.average_rating || "0.0"}</span>
                    <span>({sub.total_reviews || 0} reviews)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions / Navigation shortcuts */}
      <h3 className="text-lg font-extrabold text-slate-900 mb-4">Quick Navigation</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/subjects" className="bg-white border hover:shadow-md transition-shadow p-5 rounded-2xl flex flex-col items-center text-center">
          <Compass className="w-8 h-8 text-blue-500 mb-2" />
          <span className="font-bold text-slate-800 text-sm">Course Catalog</span>
        </Link>
        <Link href="/my-courses" className="bg-white border hover:shadow-md transition-shadow p-5 rounded-2xl flex flex-col items-center text-center">
          <BookOpen className="w-8 h-8 text-purple-500 mb-2" />
          <span className="font-bold text-slate-800 text-sm">My Learnings</span>
        </Link>
        <Link href="/profile" className="bg-white border hover:shadow-md transition-shadow p-5 rounded-2xl flex flex-col items-center text-center">
          <Award className="w-8 h-8 text-amber-500 mb-2" />
          <span className="font-bold text-slate-800 text-sm">Analytics</span>
        </Link>
        <Link href="/subjects" className="bg-white border hover:shadow-md transition-shadow p-5 rounded-2xl flex flex-col items-center text-center">
          <PlayCircle className="w-8 h-8 text-emerald-500 mb-2" />
          <span className="font-bold text-slate-800 text-sm">Play Ground</span>
        </Link>
      </div>
    </div>
  );
}
