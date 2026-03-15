import { Router, Request, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.get("/", async (req: Request, res: Response): Promise<void> => {
  try {
    const [subjects]: any = await pool.query(
      `SELECT id, title, slug, description, thumbnail_url, is_published, created_at,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE subject_id = subjects.id) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE subject_id = subjects.id) as total_reviews
       FROM subjects WHERE is_published = TRUE`
    );
    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:subjectId", async (req: Request, res: Response): Promise<void> => {
  try {
    const subjectId = req.params.subjectId;
    const [subjects]: any = await pool.query(
      `SELECT id, title, slug, description, thumbnail_url, is_published, created_at,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE subject_id = subjects.id) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE subject_id = subjects.id) as total_reviews
       FROM subjects WHERE id = ? AND is_published = TRUE`,
      [subjectId]
    );

    if (subjects.length === 0) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }

    res.json(subjects[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:subjectId/tree", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const subjectId = req.params.subjectId;
    const userId = req.user?.id;

    const [subjects]: any = await pool.query("SELECT id, title FROM subjects WHERE id = ?", [subjectId]);
    if (subjects.length === 0) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }

    const [enrollment]: any = await pool.query(
      "SELECT id FROM enrollments WHERE user_id = ? AND subject_id = ?",
      [userId, subjectId]
    );
    if (enrollment.length === 0) {
      res.status(403).json({ message: "Not enrolled" });
      return;
    }

    const [sections]: any = await pool.query(
      "SELECT id, title, order_index FROM sections WHERE subject_id = ? ORDER BY order_index ASC",
      [subjectId]
    );

    const [videos]: any = await pool.query(
      `SELECT v.id, v.section_id, v.title, v.order_index, COALESCE(vp.is_completed, 0) as is_completed 
       FROM videos v
       LEFT JOIN video_progress vp ON v.id = vp.video_id AND vp.user_id = ?
       WHERE v.section_id IN (SELECT id FROM sections WHERE subject_id = ?)
       ORDER BY v.order_index ASC`,
      [userId, subjectId]
    );

    const sectionsWithVideos = sections.map((sec: any) => ({
      ...sec,
      videos: videos.filter((v: any) => v.section_id === sec.id)
    }));

    // Calculate locking
    const tree = {
      id: subjects[0].id,
      title: subjects[0].title,
      sections: sectionsWithVideos
    };

    // Flatten logic for locking
    let flattenedVideos: any[] = [];
    for (const sec of tree.sections) {
      for (const v of sec.videos) {
        flattenedVideos.push(v);
      }
    }

    for (let i = 0; i < flattenedVideos.length; i++) {
      const v = flattenedVideos[i];
      if (i === 0) {
        v.locked = false;
      } else {
        const prev = flattenedVideos[i - 1];
        v.locked = !prev.is_completed;
      }
      v.is_completed = Boolean(v.is_completed);
    }

    res.json(tree);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
