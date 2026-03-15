import { Router, Request, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";
import { getSubtitles } from "youtube-captions-scraper";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

router.get("/:videoId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const videoId = req.params.videoId;
    const userId = req.user?.id;

    const [videos]: any = await pool.query(
      `SELECT v.id, v.title, v.description, v.youtube_url, v.duration_seconds, v.section_id, s.title as section_title, s.subject_id, sub.title as subject_title 
       FROM videos v
       JOIN sections s ON v.section_id = s.id
       JOIN subjects sub ON s.subject_id = sub.id
       WHERE v.id = ?`,
      [videoId]
    );

    if (videos.length === 0) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    const video = videos[0];
    const subjectId = video.subject_id;

    // To figure out previous, next, and lock status, we need the ordered list
    const [allVideos]: any = await pool.query(
      `SELECT v.id, COALESCE(vp.is_completed, 0) as is_completed 
       FROM videos v
       JOIN sections sec ON v.section_id = sec.id
       LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.user_id = ?
       WHERE sec.subject_id = ?
       ORDER BY sec.order_index ASC, v.order_index ASC`,
      [userId, subjectId]
    );

    const videoIndex = allVideos.findIndex((v: any) => v.id === Number(videoId));

    const prevVideo = videoIndex > 0 ? allVideos[videoIndex - 1] : null;
    const nextVideo = videoIndex < allVideos.length - 1 ? allVideos[videoIndex + 1] : null;

    let locked = false;
    let unlockReason = "";

    if (videoIndex > 0 && !prevVideo.is_completed) {
      locked = true;
      unlockReason = "Previous video must be completed to unlock.";
    }

    res.json({
      ...video,
      previous_video_id: prevVideo ? prevVideo.id : null,
      next_video_id: nextVideo ? nextVideo.id : null,
      locked,
      unlock_reason: unlockReason
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:videoId/summary", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;

    const [videos]: any = await pool.query(
      "SELECT youtube_url FROM videos WHERE id = ?",
      [videoId]
    );

    if (videos.length === 0) {
      res.status(404).json({ message: "Video not found" });
      return;
    }

    const { youtube_url } = videos[0];
    
    // Extract ID
    const match = youtube_url.match(/[?&]v=([^&]+)/) || youtube_url.match(/embed\/([^?&]+)/) || youtube_url.match(/youtu\.be\/([^?&]+)/);
    const ytId = match ? match[1] : youtube_url;

    let transcriptText = "";
    try {
      const subtitles = await getSubtitles({
        videoID: ytId,
        lang: 'en'
      });
      transcriptText = subtitles.map((t: any) => t.text).join(" ");
    } catch (err) {
      // YouTube Transcript fails if captions are disabled
      res.json({
        summary: "No automated transcript available for this video from YouTube. Summary generation cannot proceed.",
        key_points: ["Check that captions are enabled on the YouTube host to activate AI generation."]
      });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.json({
        summary: `[MOCK AI SUMMARY] (To activate actual AI summaries, add GEMINI_API_KEY to your .env file). ${transcriptText.substring(0, 150)}...`,
        key_points: [
          "Points from transcript parsed successfully.",
          "Automatic transcript processing successfully fetched from origin structure.",
          "Fallback layouts trigger standard loading layouts."
        ]
      });
      return;
    }

    const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = ai.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an expert educational content summarizer.
      Analyze the following lecture transcript and generate a summary and exactly 4 or 5 key points.
      Return the response in JSON format matching this EXACT structure:
      {
        "summary": "Short paragraph summarizing the main takeaway",
        "key_points": ["Point 1", "Point 2", "Point 3"]
      }
      Transcript: ${transcriptText}
    `;

    const result = await model.generateContent(prompt);
    const aiText = result.response.text();
    
    res.json(JSON.parse(aiText));

  } catch (error) {
    console.error("AI Summary generation failed:", error);
    res.status(500).json({ message: "Error generating AI summary" });
  }
});

export default router;
