import { Router, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

// POST /api/enroll/:subjectId
router.post("/enroll/:subjectId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const userId = req.user?.id;

    const [existing]: any = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND subject_id = ?",
      [userId, subjectId]
    );

    if (existing.length > 0) {
      res.status(400).json({ message: "Already enrolled in this course" });
      return;
    }

    await pool.query(
      "INSERT INTO enrollments (user_id, subject_id) VALUES (?, ?)",
      [userId, subjectId]
    );

    res.status(201).json({ message: "Successfully enrolled in course!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error enrolling in course" });
  }
});

// GET /api/enrollments/my-courses
router.get("/enrollments/my-courses", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    
    // We want to return the subjects the user is enrolled in, potentially with progress
    const [courses]: any = await pool.query(`
      SELECT s.*, 
        (SELECT COUNT(*) FROM videos v JOIN sections sec ON v.section_id = sec.id WHERE sec.subject_id = s.id) as total_videos,
        (SELECT COUNT(*) FROM video_progress vp JOIN videos v ON vp.video_id = v.id JOIN sections sec ON v.section_id = sec.id WHERE vp.user_id = ? AND vp.is_completed = 1 AND sec.subject_id = s.id) as completed_videos
      FROM subjects s
      JOIN enrollments e ON s.id = e.subject_id
      WHERE e.user_id = ?
      ORDER BY e.created_at DESC
    `, [userId, userId]);

    const mapped = courses.map((c: any) => ({
      ...c,
      percent_complete: c.total_videos > 0 ? Math.round((c.completed_videos / c.total_videos) * 100) : 0
    }));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching enrolled courses" });
  }
});

export default router;
