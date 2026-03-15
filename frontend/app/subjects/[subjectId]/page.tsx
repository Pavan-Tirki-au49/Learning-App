"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { AuthGuard } from "@/components/Auth/AuthGuard";
import { Spinner } from "@/components/common/Spinner";
import { Button } from "@/components/common/Button";
import { PlusCircle, PlayCircle, Trophy, Star } from "lucide-react";
import { ReviewSection } from "@/components/Reviews/ReviewSection";

export default function SubjectHome() {
  const router = useRouter();
  const { subjectId } = useParams() as { subjectId: string };
  const [subject, setSubject] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [subRes, progRes, myRes] = await Promise.all([
          apiClient.get(`/subjects/${subjectId}`),
          apiClient.get(`/progress/subjects/${subjectId}`),
          apiClient.get("/enrollments/my-courses")
        ]);
        setSubject(subRes.data);
        setProgress(progRes.data);
        
        const enrolledIds = myRes.data.map((c: any) => c.id);
        setIsEnrolled(enrolledIds.includes(parseInt(subjectId)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, [subjectId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await apiClient.post(`/enroll/${subjectId}`);
      setIsEnrolled(true);
      router.refresh(); // Or optimistically update
    } catch (e) {
      alert("Failed to enroll. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
  if (!subject) return <div className="p-10">Subject not found.</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-6 font-sans">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Cover Image */}
        <div 
          className="w-full md:w-1/3 h-64 bg-slate-100 rounded-2xl shadow-sm border bg-cover bg-center flex-shrink-0"
          style={subject.thumbnail_url ? { backgroundImage: `url(${subject.thumbnail_url})` } : {}}
        >
        </div>
        
        {/* Course Details */}
        <div className="flex-1">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">{subject.title}</h1>
          
          <div className="flex items-center gap-2 mb-4">
            <span className="flex text-amber-400">
              <Star className="w-5 h-5 fill-amber-400" />
            </span>
            <span className="font-bold text-slate-700">{subject.average_rating || "New"}</span>
            <span className="text-slate-500 text-sm">({subject.total_reviews || 0} reviews)</span>
          </div>

          <p className="text-xl text-slate-600 leading-relaxed mb-10">{subject.description}</p>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            {!isEnrolled ? (
              <div className="text-center py-6">
                <h2 className="text-2xl font-bold text-slate-800 mb-4">Ready to start learning?</h2>
                <p className="text-slate-500 mb-8">Enroll now to access all lessons, track your progress, and earn a certificate!</p>
                <button 
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-bold transition-all shadow-md shadow-indigo-200 flex items-center justify-center gap-3 w-full md:w-auto mx-auto text-lg"
                >
                  {enrolling ? <Spinner /> : <><PlusCircle className="w-6 h-6" /> Enroll for Free</>}
                </button>
              </div>
            ) : progress ? (
              <div>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Your Progress</h2>
                <div className="flex items-center justify-between text-sm font-medium text-slate-700 mb-2">
                  <span>{progress.completed_videos} of {progress.total_videos} lessons completed</span>
                  <span className="text-indigo-600">{progress.percent_complete}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-8 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${progress.percent_complete}%` }}
                  ></div>
                </div>

                {progress.last_video_id ? (
                  <Link href={`/subjects/${subjectId}/video/${progress.last_video_id}`}>
                    <Button className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 shadow-md flex items-center gap-2">
                      {progress.percent_complete === 0 ? <><PlayCircle className="w-5 h-5" /> Start Course</> : progress.percent_complete === 100 ? <><Trophy className="w-5 h-5"/> Retake Course</> : <><PlayCircle className="w-5 h-5" /> Resume Course</>}
                    </Button>
                  </Link>
                ) : progress.total_videos > 0 ? (
                  <p className="text-slate-600 italic">Navigate to the sidebar to select your first video.</p>
                ) : (
                  <p className="text-slate-600 italic">This course currently has no content.</p>
                )}
              </div>
            ) : (
              <Spinner />
            )}
          </div>

          <ReviewSection subjectId={subjectId} />
        </div>
      </div>
    </div>
  );
}
