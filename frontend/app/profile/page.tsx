"use client";
import React, { useEffect, useState } from "react";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/apiClient";
import { Spinner } from "@/components/common/Spinner";
import { BookOpen, Clock, PlayCircle, Award, Compass, Search } from "lucide-react";
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LabelList, Cell
} from 'recharts';

interface ProfileDashboard {
  enrolled_courses: number;
  completed_courses: number;
  total_watch_time: number;
  last_course: { id: number; title: string; thumbnail_url: string; } | null;
  last_video: { id: number; title: string; } | null;
  courses_progress: { id: number; name: string; percent: number; }[];
}

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [dashboard, setDashboard] = useState<ProfileDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await apiClient.get('/profile/dashboard');
        setDashboard(data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // Format seconds to text
  const formatTime = (totalSeconds: number) => {
    if (!totalSeconds) return "0 mins";
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins} mins`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <Spinner />
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 font-sans w-full">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-indigo-600 flex justify-center items-center text-white text-3xl font-extrabold shadow-lg shadow-indigo-200">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Learning Analytics</h1>
              <p className="text-slate-500 font-medium">{user?.name} · {user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profile/certificates" className="bg-slate-900 border rounded-xl px-5 py-3 font-bold text-white hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400"/> Certificates
            </Link>
            <Link href="/my-courses" className="bg-white border rounded-xl px-5 py-3 font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors shadow-sm flex items-center gap-2">
              <Search className="w-5 h-5"/> Catalog
            </Link>
          </div>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Enrolled</p>
              <h2 className="text-3xl font-extrabold text-slate-900">{dashboard?.enrolled_courses || 0} <span className="text-lg font-medium text-slate-400">Courses</span></h2>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Completed</p>
              <h2 className="text-3xl font-extrabold text-slate-900">{dashboard?.completed_courses || 0} <span className="text-lg font-medium text-slate-400">Courses</span></h2>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Watch Time</p>
              <h2 className="text-3xl font-extrabold text-slate-900">{formatTime(dashboard?.total_watch_time || 0)}</h2>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Progress Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-500" />
              Course Completion Rates
            </h3>
            {dashboard?.courses_progress && dashboard.courses_progress.length > 0 ? (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboard.courses_progress} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 13, fontWeight: 500 }} domain={[0, 100]} />
                    <RechartsTooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number) => [`${value}%`, 'Completed']}
                    />
                    <Bar dataKey="percent" radius={[6, 6, 0, 0]} maxBarSize={60}>
                      {dashboard.courses_progress.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.percent === 100 ? '#22c55e' : '#4f46e5'} opacity={0.9} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-slate-400 italic font-medium">
                Not enough data to display progress graph.
              </div>
            )}
          </div>

          {/* Jump Back In */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <PlayCircle className="w-6 h-6 text-emerald-500" />
              Jump Back In
            </h3>
            
            {dashboard?.last_course ? (
              <div className="flex flex-col flex-1">
                <div 
                  className="h-32 rounded-xl bg-slate-100 bg-cover bg-center mb-5 border shadow-sm relative overflow-hidden"
                  style={dashboard.last_course.thumbnail_url ? { backgroundImage: `url(${dashboard.last_course.thumbnail_url})` } : {}}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="font-bold text-white leading-tight drop-shadow-md line-clamp-2">{dashboard.last_course.title}</h4>
                  </div>
                </div>
                
                <div className="mb-6 flex-1">
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Up Next</p>
                  <p className="font-bold text-slate-800 line-clamp-2 leading-relaxed">{dashboard.last_video?.title || 'Course Home'}</p>
                </div>

                <Link
                  href={`/subjects/${dashboard.last_course.id}${dashboard.last_video ? `/video/${dashboard.last_video.id}` : ''}`}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-200 transition-colors flex justify-center items-center gap-2"
                >
                  <PlayCircle className="w-5 h-5"/>
                  Resume Learning
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-500 font-medium mb-6">You haven't watched any videos yet.</p>
                <Link href="/subjects" className="text-indigo-600 font-bold hover:text-indigo-800">
                  Explore Courses &rarr;
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
