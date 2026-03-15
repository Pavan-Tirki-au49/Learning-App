"use client";
import React, { useEffect, useRef } from "react";
import YouTube from "react-youtube";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import { useSidebarStore } from "@/store/sidebarStore";
import { useVideoStore } from "@/store/videoStore";

export const VideoPlayer = ({
  videoId,
  youtubeUrl,
  startPositionSeconds,
  isCompleted,
  nextVideoId,
  subjectId,
  onPlayerReady
}: {
  videoId: string;
  youtubeUrl: string;
  startPositionSeconds: number;
  isCompleted: boolean;
  nextVideoId: string | null;
  subjectId: string;
  onPlayerReady?: (player: any) => void;
}) => {
  const router = useRouter();
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const { markVideoCompleted } = useSidebarStore();
  const { setProgress, setPlayState } = useVideoStore();

  const extractYTId = (url: string) => {
    const match = url.match(/[?&]v=([^&]+)/) || url.match(/embed\/([^?&]+)/) || url.match(/youtu\.be\/([^?&]+)/);
    return match ? match[1] : url;
  };
  const ytId = extractYTId(youtubeUrl);

  const saveProgress = async (time: number, completed = false) => {
    try {
      await apiClient.post(`/progress/videos/${videoId}`, {
        last_position_seconds: Math.floor(time),
        is_completed: completed,
      });
      if (completed) {
        markVideoCompleted(Number(videoId));
      }
    } catch (err) {
      console.error("Failed to save progress", err);
    }
  };

  const onReady = (e: any) => {
    playerRef.current = e.target;
    if (onPlayerReady) {
      onPlayerReady(e.target);
    }
    if (startPositionSeconds > 0) {
      e.target.seekTo(startPositionSeconds);
    }
  };

  const onStateChange = (e: any) => {
    if (e.data === YouTube.PlayerState.PLAYING) {
      setPlayState(true);
      intervalRef.current = setInterval(async () => {
        if (!playerRef.current) return;
        const time = await playerRef.current.getCurrentTime();
        setProgress(time);
        saveProgress(time, false);
      }, 5000); // every 5 seconds
    } else {
      setPlayState(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (e.data === YouTube.PlayerState.ENDED) {
        handleCompletion();
      }
    }
  };

  const handleCompletion = () => {
    setProgress(playerRef.current?.getCurrentTime() || 0, true);
    saveProgress(playerRef.current?.getCurrentTime() || 0, true);
    if (nextVideoId) {
      router.push(`/subjects/${subjectId}/video/${nextVideoId}`);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      // save before unmount
      if (playerRef.current) {
        const time = playerRef.current.getCurrentTime();
        if (time > 0) saveProgress(time, false);
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
      <YouTube
        videoId={ytId}
        onReady={onReady}
        onStateChange={onStateChange}
        opts={{
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
          },
        }}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
};
