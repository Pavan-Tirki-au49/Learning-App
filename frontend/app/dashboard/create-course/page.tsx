"use client";
import React, { useState } from "react";
import apiClient from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { Alert } from "@/components/common/Alert";

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ title: "", slug: "", description: "", thumbnail_url: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // auto slug
    if (e.target.name === "title" && !formData.slug) {
      setFormData((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await apiClient.post("/admin/courses", formData);
      router.push(`/dashboard/course/${data.id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create course");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto font-sans">
      <Link href="/dashboard/courses" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </Link>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Create a New Course</h1>
          <p className="text-slate-500 mt-2">Start a new educational journey. Fill out the course metadata below.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && <Alert type="error" message={error} />}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block font-semibold text-slate-700">Course Title <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                id="title" 
                name="title"
                required
                className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm text-slate-900" 
                placeholder="e.g. Master React in 10 Days"
                value={formData.title} 
                onChange={handleChange} 
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="slug" className="block font-semibold text-slate-700">Course Slug <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                id="slug" 
                name="slug"
                required
                className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm text-slate-900" 
                placeholder="e.g. master-react-10-days"
                value={formData.slug} 
                onChange={handleChange} 
              />
              <p className="text-xs text-slate-500">Unique URL identifier. e.g. /subjects/master-react</p>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="thumbnail_url" className="block font-semibold text-slate-700">Cover Image URL</label>
            <input 
              type="url" 
              id="thumbnail_url" 
              name="thumbnail_url"
              className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm text-slate-900" 
              placeholder="https://example.com/image.jpg"
              value={formData.thumbnail_url} 
              onChange={handleChange} 
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="block font-semibold text-slate-700">Course Description</label>
            <textarea 
              id="description" 
              name="description"
              rows={4}
              className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors shadow-sm text-slate-900 resize-y" 
              placeholder="Provide a comprehensive summary of what students will learn..."
              value={formData.description} 
              onChange={handleChange} 
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 w-full md:w-auto font-bold rounded-lg shadow-md shadow-indigo-200 tracking-tight transition-all flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? "Creating..." : "Save and Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
