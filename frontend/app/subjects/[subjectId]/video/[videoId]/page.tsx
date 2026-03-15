"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useVideoStore } from "@/store/videoStore";
import { useSidebarStore } from "@/store/sidebarStore";
import apiClient from "@/lib/apiClient";
import { VideoPlayer } from "@/components/Video/VideoPlayer";
import { VideoProgressBar } from "@/components/Video/VideoProgressBar";
import { VideoMeta } from "@/components/Video/VideoMeta";
import { VideoNotes } from "@/components/Video/VideoNotes";
import { VideoSummary } from "@/components/Video/VideoSummary";
import { Spinner } from "@/components/common/Spinner";
import { Alert } from "@/components/common/Alert";

export default function VideoPage() {
  const { videoId, subjectId } = useParams() as { videoId: string; subjectId: string };
  const { setVideo } = useVideoStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [videoData, setVideoData] = useState<any>(null);
  const [startPos, setStartPos] = useState(0);
  const [playerRef, setPlayerRef] = useState<any>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true);
      setError("");
      try {
        const [vidRes, progRes] = await Promise.all([
          apiClient.get(`/videos/${videoId}`),
          apiClient.get(`/progress/videos/${videoId}`)
        ]);
        
        const video = vidRes.data;
        if (video.locked) {
          setError(video.unlock_reason || "Video is locked");
        } else {
          setVideoData(video);
          setVideo(video);
          setStartPos(progRes.data.last_position_seconds || 0);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load video");
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId, setVideo]);

  if (loading) return <div className="h-full flex items-center justify-center"><Spinner /></div>;

  if (error) return (
    <div className="p-8 max-w-4xl mx-auto mt-10">
      <Alert message={error} type="error" />
    </div>
  );

  if (!videoData) return <div className="p-8">Video not available</div>;

  return (
    <div className="max-w-7xl mx-auto w-full flex flex-col min-h-full">
      <VideoProgressBar />
      <div className="flex-1 p-6 md:p-8 lg:p-10 overflow-y-auto flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0">
          <VideoPlayer
            videoId={videoId}
            youtubeUrl={videoData.youtube_url}
            startPositionSeconds={startPos}
            isCompleted={videoData.is_completed}
            nextVideoId={videoData.next_video_id}
            subjectId={subjectId}
            onPlayerReady={(p) => setPlayerRef(p)}
          />
          <VideoMeta />
          <VideoSummary videoId={videoId} />
        </div>
        
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 mt-8 lg:mt-0 lg:ml-8 h-[600px] lg:h-auto lg:max-h-[85vh]">
          <VideoNotes videoId={videoId} playerRef={playerRef} />
        </div>
      </div>
    </div>
  );
}
