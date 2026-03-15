import { create } from "zustand";

interface VideoState {
  currentVideo: any | null;
  subjectId: string | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isCompleted: boolean;
  nextVideo: any | null;
  prevVideo: any | null;
  setVideo: (video: any) => void;
  setProgress: (time: number, isCompleted?: boolean) => void;
  setPlayState: (isPlaying: boolean) => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  currentVideo: null,
  subjectId: null,
  currentTime: 0,
  duration: 0,
  isPlaying: false,
  isCompleted: false,
  nextVideo: null,
  prevVideo: null,
  setVideo: (video) => set({
    currentVideo: video,
    subjectId: video.subject_id,
    duration: video.duration_seconds,
    nextVideo: video.next_video_id,
    prevVideo: video.previous_video_id,
    isCompleted: video.is_completed || false,
  }),
  setProgress: (time, isCompleted = false) => set((state) => ({ 
    currentTime: time, 
    isCompleted: state.isCompleted || isCompleted 
  })),
  setPlayState: (isPlaying) => set({ isPlaying }),
}));
