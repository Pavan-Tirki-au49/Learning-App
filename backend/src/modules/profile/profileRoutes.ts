import { Router, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.get("/dashboard", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // 1. Total Enrolled
    const [enrollments]: any = await pool.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE user_id = ?",
      [userId]
    );
    const enrolled_courses = enrollments[0].count;

    // 2. Total Watch Time (summing duration of completed videos or last_position for incomplete)
    // Using a simplistic approach: sum of duration_seconds for all is_completed videos
    const [watchTimeRes]: any = await pool.query(`
      SELECT SUM(v.duration_seconds) as total_time
      FROM video_progress vp
      JOIN videos v ON vp.video_id = v.id
      WHERE vp.user_id = ? AND vp.is_completed = 1
    `, [userId]);
    const total_watch_time = watchTimeRes[0].total_time || 0;

    // 3. Last Watched Course and Video
    const [lastWatchedRes]: any = await pool.query(`
      SELECT s.id as subject_id, s.title as subject_title, s.thumbnail_url, v.id as video_id, v.title as video_title
      FROM video_progress vp
      JOIN videos v ON vp.video_id = v.id
      JOIN sections sec ON v.section_id = sec.id
      JOIN subjects s ON sec.subject_id = s.id
      WHERE vp.user_id = ?
      ORDER BY vp.updated_at DESC
      LIMIT 1
    `, [userId]);
    
    let last_course = null;
    let last_video = null;
    if (lastWatchedRes.length > 0) {
      last_course = {
        id: lastWatchedRes[0].subject_id,
        title: lastWatchedRes[0].subject_title,
        thumbnail_url: lastWatchedRes[0].thumbnail_url
      };
      last_video = {
        id: lastWatchedRes[0].video_id,
        title: lastWatchedRes[0].video_title
      };
    }

    // 4. Completed Courses (Where completed_videos == total_videos)
    const [coursesStats]: any = await pool.query(`
      SELECT s.id, 
        (SELECT COUNT(*) FROM videos v JOIN sections sec ON v.section_id = sec.id WHERE sec.subject_id = s.id) as total_videos,
        (SELECT COUNT(*) FROM video_progress vp JOIN videos v ON vp.video_id = v.id JOIN sections sec ON v.section_id = sec.id WHERE vp.user_id = ? AND vp.is_completed = 1 AND sec.subject_id = s.id) as completed_videos
      FROM subjects s
      JOIN enrollments e ON s.id = e.subject_id
      WHERE e.user_id = ?
    `, [userId, userId]);

    let completed_courses = 0;
    const enrolled_subjects_stats = coursesStats.map((c: any) => {
      const isComplete = c.total_videos > 0 && c.total_videos === c.completed_videos;
      if (isComplete) completed_courses++;
      return {
        id: c.id,
        name: `Course ${c.id}`, // for chart (will be replaced by subject title if joined, but keeping small footprint)
        percent: c.total_videos > 0 ? Math.round((c.completed_videos / c.total_videos) * 100) : 0
      };
    });

    res.json({
      enrolled_courses,
      completed_courses,
      total_watch_time,
      last_course,
      last_video,
      courses_progress: enrolled_subjects_stats // for recharts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching profile dashboard" });
  }
});

export default router;
