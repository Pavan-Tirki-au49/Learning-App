import { Router, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

// GET /api/users/resume
router.get("/resume", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // We want the most recently updated video_progress for this user
    const [lastWatched]: any = await pool.query(`
      SELECT vp.video_id, vp.last_position_seconds, sec.subject_id
      FROM video_progress vp
      JOIN videos v ON vp.video_id = v.id
      JOIN sections sec ON v.section_id = sec.id
      WHERE vp.user_id = ?
      ORDER BY vp.updated_at DESC
      LIMIT 1
    `, [userId]);

    if (lastWatched.length === 0) {
      res.json(null);
      return;
    }

    res.json({
      last_subject_id: lastWatched[0].subject_id,
      last_video_id: lastWatched[0].video_id,
      last_position_seconds: lastWatched[0].last_position_seconds
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching resume data" });
  }
});

export default router;
