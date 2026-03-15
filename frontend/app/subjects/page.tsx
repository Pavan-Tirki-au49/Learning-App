"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { Spinner } from "@/components/common/Spinner";
import { BookOpen, CheckCircle, PlusCircle } from "lucide-react";

export default function SubjectsPage() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [myCourses, setMyCourses] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingId, setEnrollingId] = useState<number | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [subRes, myRes] = await Promise.all([
          apiClient.get("/subjects"),
          apiClient.get("/enrollments/my-courses")
        ]);
        setSubjects(subRes.data);
        setMyCourses(myRes.data.map((c: any) => c.id));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const handleAction = async (e: React.MouseEvent, subId: number, isEnrolled: boolean) => {
    e.preventDefault();
    if (isEnrolled) {
      router.push(`/subjects/${subId}`);
      return;
    }
    
    // Enroll
    setEnrollingId(subId);
    try {
      await apiClient.post(`/enroll/${subId}`);
      setMyCourses([...myCourses, subId]);
      router.push(`/subjects/${subId}`);
    } catch (e) {
      alert("Failed to enroll. Please try again.");
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full font-sans">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Available Courses</h1>
          <p className="mt-2 text-slate-600">Explore and enroll in our comprehensive courses to level up your skills.</p>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : subjects.length === 0 ? (
          <div className="bg-white border rounded-2xl p-16 text-center text-slate-500">
            No active courses found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub: any) => {
              const isEnrolled = myCourses.includes(sub.id);
              
              return (
                <div key={sub.id} className="group flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <div 
                    className="h-44 bg-slate-100 flex items-center justify-center bg-cover bg-center border-b relative"
                    style={sub.thumbnail_url ? { backgroundImage: `url(${sub.thumbnail_url})` } : {}}
                  >
                    {!sub.thumbnail_url && <BookOpen className="w-16 h-16 text-slate-300 relative z-10" />}
                    <div className="absolute inset-0 bg-transparent group-hover:bg-black/10 transition-colors"></div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-xl font-bold text-slate-900 mb-2 truncate group-hover:text-indigo-600 transition-colors">{sub.title}</h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-6 flex-1">{sub.description}</p>
                    
                    <button 
                      onClick={(e) => handleAction(e, sub.id, isEnrolled)}
                      disabled={enrollingId === sub.id}
                      className={`w-full py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 ${
                        isEnrolled 
                          ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100' 
                          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200'
                      }`}
                    >
                      {enrollingId === sub.id ? (
                        <Spinner />
                      ) : isEnrolled ? (
                        <><CheckCircle className="w-5 h-5" /> Continue Learning</>
                      ) : (
                        <><PlusCircle className="w-5 h-5" /> Enroll Now</>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
