"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Plus, Trash2, Save, ArrowLeft, Loader2, Video as VideoIcon } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/common/Spinner";
import { Alert } from "@/components/common/Alert";

export default function CourseEditorPage() {
  const { courseId } = useParams() as { courseId: string };
  const router = useRouter();
  
  const [course, setCourse] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [newSectionTitle, setNewSectionTitle] = useState("");

  const fetchCourseData = async () => {
    try {
      const { data } = await apiClient.get(`/admin/courses/${courseId}/full`);
      setCourse({
        title: data.title,
        slug: data.slug,
        description: data.description,
        thumbnail_url: data.thumbnail_url,
        is_published: !!data.is_published,
      });
      setSections(data.sections || []);
    } catch (e: any) {
      setError("Failed to fetch course details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourseData();
  }, [courseId]);

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put(`/admin/courses/${courseId}`, course);
      alert("Course details updated!");
    } catch (err) {
      alert("Failed to update course.");
    } finally {
      setSaving(false);
    }
  };

  const addSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      const order_index = sections.length + 1;
      const { data } = await apiClient.post("/admin/sections", {
        subject_id: courseId,
        title: newSectionTitle,
        order_index
      });
      setSections([...sections, { id: data.id, title: newSectionTitle, order_index, videos: [] }]);
      setNewSectionTitle("");
    } catch (e) {
      alert("Failed to add section.");
    }
  };

  const deleteSection = async (sectionId: number) => {
    if (!confirm("Delete this section and all its videos?")) return;
    try {
      await apiClient.delete(`/admin/sections/${sectionId}`);
      setSections(sections.filter(s => s.id !== sectionId));
    } catch (e) {
      alert("Failed to delete section.");
    }
  };

  const addVideo = async (sectionId: number) => {
    const title = prompt("Video Title:");
    if (!title) return;
    const youtube_url = prompt("YouTube Video URL (e.g. https://www.youtube.com/watch?v=XXXX):");
    if (!youtube_url) return;
    
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    const order_index = sections[sectionIndex].videos.length + 1;

    try {
      const { data } = await apiClient.post("/admin/videos", {
        section_id: sectionId,
        title,
        description: "",
        youtube_url,
        order_index,
        duration_seconds: 0
      });

      const newSections = [...sections];
      newSections[sectionIndex].videos.push({
        id: data.id,
        section_id: sectionId,
        title,
        youtube_url,
        order_index
      });
      setSections(newSections);
    } catch (e) {
      alert("Failed to add video.");
    }
  };

  const deleteVideo = async (sectionId: number, videoId: number) => {
    if (!confirm("Remove this video?")) return;
    try {
      await apiClient.delete(`/admin/videos/${videoId}`);
      const newSections = [...sections];
      const sectionIndex = newSections.findIndex(s => s.id === sectionId);
      newSections[sectionIndex].videos = newSections[sectionIndex].videos.filter((v: any) => v.id !== videoId);
      setSections(newSections);
    } catch (e) {
      alert("Failed to delete video.");
    }
  };

  const onDragEnd = async (result: DropResult, sectionId: number) => {
    if (!result.destination) return;
    
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    const newVideos = Array.from(sections[sectionIndex].videos);
    const [reorderedItem] = newVideos.splice(result.source.index, 1);
    newVideos.splice(result.destination.index, 0, reorderedItem);

    // Optmistic UI Update
    const updatedVideos = newVideos.map((vid: any, idx) => ({ ...vid, order_index: idx + 1 }));
    const newSections = [...sections];
    newSections[sectionIndex].videos = updatedVideos;
    setSections(newSections);

    // Persist API order sequentially to avoid race conditions
    try {
      await Promise.all(
        updatedVideos.map((vid: any) =>
          apiClient.put(`/admin/videos/${vid.id}`, {
            title: vid.title,
            description: vid.description,
            youtube_url: vid.youtube_url,
            order_index: vid.order_index,
            duration_seconds: vid.duration_seconds
          })
        )
      );
    } catch (e) {
      alert("Failed to save new order.");
      fetchCourseData(); // revert
    }
  };

  if (loading) return <div className="text-center p-12"><Spinner /></div>;
  if (!course) return <div className="text-center p-12 text-red-500">{error}</div>;

  return (
    <div className="max-w-5xl mx-auto font-sans pb-24">
      <Link href="/dashboard/courses" className="text-slate-500 hover:text-indigo-600 flex items-center gap-2 mb-6 font-medium transition-colors">
        <ArrowLeft className="w-5 h-5" /> Back to Dashboard
      </Link>
      
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Edit Course: {course.title}</h1>
          <p className="text-slate-500 mt-1">Manage metadata, sections, and video lessons via drag-and-drop</p>
        </div>
      </div>

      {/* Meta Editor */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Course Details</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-600">Published Status:</span>
            <button 
              onClick={() => setCourse({ ...course, is_published: !course.is_published })}
              className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors shadow-sm ${course.is_published ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
            >
              {course.is_published ? "Unpublish" : "Go Live"}
            </button>
          </div>
        </div>
        
        <form onSubmit={handleUpdateCourse} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Course Title</label>
              <input type="text" required className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border shadow-sm text-slate-900" value={course.title} onChange={e => setCourse({...course, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Course Slug</label>
              <input type="text" required className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border shadow-sm text-slate-900" value={course.slug} onChange={e => setCourse({...course, slug: e.target.value})} />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Thumbnail URL</label>
            <input type="url" className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border shadow-sm text-slate-900" value={course.thumbnail_url || ""} onChange={e => setCourse({...course, thumbnail_url: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Description</label>
            <textarea rows={3} className="w-full border-slate-300 rounded-lg p-3 bg-slate-50 border shadow-sm text-slate-900" value={course.description || ""} onChange={e => setCourse({...course, description: e.target.value})}></textarea>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold transition-colors flex items-center shadow-md">
              {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Metadata
            </button>
          </div>
        </form>
      </div>

      {/* Curriculum Manager */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 mb-6 tracking-tight">Curriculum</h2>
        <div className="space-y-8">
          {sections.map((section, sectionIdx) => (
            <div key={section.id} className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                  <span className="text-slate-400 font-medium">Chapter {sectionIdx + 1}:</span>
                  {section.title}
                </h3>
                 <div className="flex gap-2">
                  <button onClick={() => addVideo(section.id)} className="bg-white border border-slate-200 text-slate-700 text-sm px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Lesson
                  </button>
                  <button onClick={() => deleteSection(section.id)} className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 bg-white">
                <DragDropContext onDragEnd={(res) => onDragEnd(res, section.id)}>
                  <Droppable droppableId={`section-${section.id}`}>
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[50px]">
                        {section.videos.length === 0 && (
                          <div className="text-center text-slate-400 py-4 text-sm font-medium border-2 border-dashed border-slate-100 rounded-lg">No lessons added yet.</div>
                        )}
                        {section.videos.map((video: any, index: number) => (
                          <Draggable key={video.id.toString()} draggableId={video.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm transition-all group ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500 rotate-1' : 'hover:border-indigo-300'}`}
                              >
                                <div className="flex items-center gap-4 flex-1">
                                  <div {...provided.dragHandleProps} className="text-slate-400 cursor-grab active:cursor-grabbing hover:text-indigo-600 p-1">
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors flex items-center gap-2">
                                      <VideoIcon className="w-4 h-4 text-slate-400" />
                                      {video.title}
                                    </p>
                                    <a href={video.youtube_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:underline">{video.youtube_url}</a>
                                  </div>
                                </div>
                                <button onClick={() => deleteVideo(section.id, video.id)} className="text-slate-400 p-2 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
          ))}

          {/* New Section Adder */}
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
            <h3 className="text-lg font-bold text-slate-700 mb-4">Add New Section</h3>
            <div className="flex max-w-md mx-auto gap-3">
              <input 
                type="text" 
                value={newSectionTitle} 
                onChange={e => setNewSectionTitle(e.target.value)} 
                placeholder="e.g. Introduction & Setup" 
                className="flex-1 border-slate-300 rounded-lg p-2.5 bg-slate-50 border outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button 
                onClick={addSection} 
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-6 py-2.5 rounded-lg font-bold transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
