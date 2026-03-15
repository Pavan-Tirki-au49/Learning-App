"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import Link from "next/link";
import { Plus, Edit3, Trash2 } from "lucide-react";

export default function CoursesDashboard() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await apiClient.get("/admin/my-courses");
      setCourses(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: number) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;
    try {
      await apiClient.delete(`/admin/courses/${id}`);
      setCourses(courses.filter((c) => c.id !== id));
    } catch (e) {
      console.error(e);
      alert("Failed to delete course.");
    }
  };

  if (loading) return <div className="text-slate-500">Loading courses...</div>;

  return (
    <div className="max-w-5xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Courses Manager</h1>
          <p className="text-slate-500 mt-1">Manage your course catalogue and modules</p>
        </div>
        <Link 
          href="/dashboard/create-course"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center font-bold tracking-tight transition-colors shadow-md shadow-indigo-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center shadow-sm">
          <p className="text-slate-500 text-lg">You have not created any courses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white border rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col group">
              <div 
                className="h-40 bg-cover bg-center border-b bg-slate-100 flex items-center justify-center relative"
                style={course.thumbnail_url ? { backgroundImage: `url(${course.thumbnail_url})` } : {}}
              >
                {!course.thumbnail_url && <span className="text-slate-400 font-medium">No Image</span>}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <Link href={`/dashboard/course/${course.id}/edit`} className="bg-white text-indigo-600 p-2 rounded-full hover:bg-slate-100 transition-colors shadow-lg">
                    <Edit3 className="w-5 h-5" />
                  </Link>
                  <button onClick={() => deleteCourse(course.id)} className="bg-white text-red-600 p-2 rounded-full hover:bg-slate-100 transition-colors shadow-lg">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col bg-white">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-2 leading-tight">{course.title}</h3>
                </div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">{course.description || "No description provided."}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {course.is_published ? "Published" : "Draft"}
                  </span>
                  <Link href={`/dashboard/course/${course.id}/edit`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800">
                    Edit Content
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
