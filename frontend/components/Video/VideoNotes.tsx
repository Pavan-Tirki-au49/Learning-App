"use client";
import React, { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "../common/Button";
import { Clock, Plus, Trash2, Bookmark } from "lucide-react";

interface Note {
  id: number;
  timestamp_seconds: number;
  content: string;
  created_at: string;
}

export const VideoNotes = ({
  videoId,
  playerRef,
}: {
  videoId: string;
  playerRef: any;
}) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchNotes = async () => {
    try {
      const { data } = await apiClient.get(`/notes/${videoId}`);
      setNotes(data);
    } catch (err) {
      console.error("Failed to load notes", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [videoId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setAdding(true);
    try {
      // Get current player timestamp
      let currentTime = 0;
      if (playerRef) {
        currentTime = await playerRef.getCurrentTime();
      }

      await apiClient.post(`/notes/${videoId}`, {
        timestamp_seconds: currentTime,
        content: newNote,
      });
      setNewNote("");
      await fetchNotes(); // Re-fetch all to get updated list
    } catch (err) {
      alert("Failed to add note.");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (noteId: number) => {
    if (!confirm("Delete this note?")) return;
    try {
      await apiClient.delete(`/notes/${noteId}`);
      setNotes(notes.filter((n) => n.id !== noteId));
    } catch (err) {
      alert("Failed to delete note");
    }
  };

  const handleJumpToTime = (seconds: number) => {
    if (playerRef) {
      playerRef.seekTo(seconds, true);
      playerRef.playVideo();
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.floor(totalSeconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden flex flex-col h-full font-sans">
      <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Bookmark className="w-5 h-5 text-indigo-600" />
        My Notes
      </h3>

      <form onSubmit={handleAddNote} className="mb-6 flex gap-3 relative">
        <input
          type="text"
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note at current time..."
          className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-inner outline-none transition-all"
        />
        <button
          type="submit"
          disabled={adding}
          className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white rounded-lg px-3 flex items-center justify-center hover:bg-indigo-700 transition shadow-sm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {loading ? (
          <p className="text-slate-400 text-sm text-center py-4">Loading notes...</p>
        ) : notes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 flex flex-col items-center">
            <Bookmark className="w-8 h-8 opacity-20 mb-2" />
            <p className="text-sm font-medium">No notes taken yet for this lesson</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl p-4 transition-all"
            >
              <div className="flex justify-between items-start">
                <button
                  onClick={() => handleJumpToTime(note.timestamp_seconds)}
                  className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md mb-2 flex items-center gap-1.5 hover:bg-indigo-200 transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {formatTime(note.timestamp_seconds)}
                </button>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-slate-700 font-medium text-sm leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
