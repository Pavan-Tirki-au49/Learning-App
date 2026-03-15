import { Router, Request, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.get("/subjects/:subjectId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const subjectId = req.params.subjectId;
    const userId = req.user?.id;

    const [allVideos]: any = await pool.query(
      `SELECT v.id, COALESCE(vp.is_completed, 0) as is_completed, COALESCE(vp.last_position_seconds, 0) as last_pos
       FROM videos v
       JOIN sections sec ON v.section_id = sec.id
       LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.user_id = ?
       WHERE sec.subject_id = ?
       ORDER BY sec.order_index ASC, v.order_index ASC`,
      [userId, subjectId]
    );

    if (allVideos.length === 0) {
      res.json({
        total_videos: 0,
        completed_videos: 0,
        percent_complete: 0,
        last_video_id: null,
        last_position_seconds: 0
      });
      return;
    }

    let completedCount = 0;
    let lastVideoId = allVideos[0].id;
    let lastPos = allVideos[0].last_pos;

    for (let i = 0; i < allVideos.length; i++) {
      if (allVideos[i].is_completed) completedCount++;
      // If we seek the active video
      if (!allVideos[i].is_completed && (i === 0 || allVideos[i - 1].is_completed)) {
        lastVideoId = allVideos[i].id;
        lastPos = allVideos[i].last_pos;
      }
    }

    res.json({
      total_videos: allVideos.length,
      completed_videos: completedCount,
      percent_complete: Math.round((completedCount / allVideos.length) * 100),
      last_video_id: lastVideoId,
      last_position_seconds: lastPos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/videos/:videoId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const videoId = req.params.videoId;
    const userId = req.user?.id;

    const [progress]: any = await pool.query(
      "SELECT last_position_seconds, is_completed FROM video_progress WHERE user_id = ? AND video_id = ?",
      [userId, videoId]
    );

    if (progress.length === 0) {
      res.json({ last_position_seconds: 0, is_completed: false });
      return;
    }

    // Must return boolean
    res.json({
      last_position_seconds: progress[0].last_position_seconds,
      is_completed: Boolean(progress[0].is_completed)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/videos/:videoId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const videoId = req.params.videoId;
    const userId = req.user?.id;
    const { last_position_seconds, is_completed } = req.body;

    const [existing]: any = await pool.query(
      "SELECT id FROM video_progress WHERE user_id = ? AND video_id = ?",
      [userId, videoId]
    );

    if (existing.length > 0) {
      await pool.query(
        "UPDATE video_progress SET last_position_seconds = ?, is_completed = ?, completed_at = CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE completed_at END WHERE user_id = ? AND video_id = ?",
        [last_position_seconds, is_completed ? 1 : 0, is_completed ? 1 : 0, userId, videoId]
      );
    } else {
      await pool.query(
        "INSERT INTO video_progress (user_id, video_id, last_position_seconds, is_completed, completed_at) VALUES (?, ?, ?, ?, CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)",
        [userId, videoId, last_position_seconds, is_completed ? 1 : 0, is_completed ? 1 : 0]
      );
    }

    // --- Learning Streak Update ---
    try {
      const todayStr = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"
      const [streakRecord]: any = await pool.query("SELECT current_streak, last_active_date FROM user_streaks WHERE user_id = ?", [userId]);
      
      if (streakRecord.length === 0) {
        await pool.query("INSERT INTO user_streaks (user_id, current_streak, last_active_date) VALUES (?, 1, ?)", [userId, todayStr]);
      } else {
        const lastActiveStr = streakRecord[0].last_active_date;
        if (lastActiveStr !== todayStr) {
          const lastDate = new Date(lastActiveStr);
          const today = new Date(todayStr);
          const diffTime = today.getTime() - lastDate.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            await pool.query("UPDATE user_streaks SET current_streak = current_streak + 1, last_active_date = ? WHERE user_id = ?", [todayStr, userId]);
          } else if (diffDays > 1) {
            await pool.query("UPDATE user_streaks SET current_streak = 1, last_active_date = ? WHERE user_id = ?", [todayStr, userId]);
          }
        }
      }
    } catch (streakErr) {
      console.error("Streak tracking failed:", streakErr);
      // Fail silently to not block video progress saving
    }

    res.json({ message: "Progress saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
