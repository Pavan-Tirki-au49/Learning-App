"use client";
import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import { BookOpen, PlayCircle, Trophy, Compass } from "lucide-react";
import { Spinner } from "@/components/common/Spinner";
import { Alert } from "@/components/common/Alert";

interface EnrolledCourse {
  id: number;
  title: string;
  slug: string;
  thumbnail_url: string;
  total_videos: number;
  completed_videos: number;
  percent_complete: number;
}

export default function MyCoursesPage() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await apiClient.get("/enrollments/my-courses");
        setCourses(data);
      } catch (err) {
        setError("Failed to load your courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          My Learning
        </h1>
        <p className="text-slate-500 mt-2">Welcome back, {user?.name}! Pick up where you left off.</p>
      </div>

      {error ? (
        <Alert type="error" message={error} />
      ) : courses.length === 0 ? (
        <div className="bg-white border text-center rounded-2xl p-16 shadow-sm">
          <Compass className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">You haven't enrolled in any courses yet</h2>
          <p className="text-slate-500 mb-6">Explore our catalog and find something exciting to learn today.</p>
          <Link href="/subjects" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div 
                className="h-44 bg-slate-100 flex items-center justify-center bg-cover bg-center border-b"
                style={course.thumbnail_url ? { backgroundImage: `url(${course.thumbnail_url})` } : {}}
              >
                {!course.thumbnail_url && <BookOpen className="w-10 h-10 text-slate-300" />}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-900 line-clamp-2 mb-4">
                  {course.title}
                </h3>
                
                <div className="mt-auto">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-indigo-600">{course.percent_complete}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${course.percent_complete === 100 ? 'bg-green-500' : 'bg-indigo-600'}`}
                      style={{ width: `${course.percent_complete}%` }}
                    ></div>
                  </div>
                  
                  <Link
                    href={`/subjects/${course.id}`}
                    className={`w-full py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors ${
                      course.percent_complete === 100 
                        ? 'bg-green-50 text-green-700 hover:bg-green-100'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    }`}
                  >
                    {course.percent_complete === 100 ? (
                      <><Trophy className="w-5 h-5" /> Completed</>
                    ) : (
                      <><PlayCircle className="w-5 h-5" /> Continue Learning</>
                    )}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
