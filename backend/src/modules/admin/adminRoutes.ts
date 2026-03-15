import { Router, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate, authorizeRoles } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles("instructor", "admin"));

// POST /api/admin/courses
router.post("/courses", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, slug, description, thumbnail_url } = req.body;
    const instructor_id = req.user?.id;
    const result: any = await pool.query(
      "INSERT INTO subjects (title, slug, description, thumbnail_url, instructor_id, is_published) VALUES (?, ?, ?, ?, ?, 0)",
      [title, slug, description, thumbnail_url, instructor_id]
    );
    res.status(201).json({ id: result[0].insertId, title, slug, description, thumbnail_url, is_published: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating course" });
  }
});

// PUT /api/admin/courses/:courseId
router.put("/courses/:courseId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, slug, description, thumbnail_url, is_published } = req.body;
    const { courseId } = req.params;
    
    // Check ownership
    if (req.user?.role !== "admin") {
      const [courses]: any = await pool.query("SELECT * FROM subjects WHERE id = ? AND instructor_id = ?", [courseId, req.user?.id]);
      if (courses.length === 0) { res.status(403).json({ message: "Forbidden" }); return; }
    }

    await pool.query(
      "UPDATE subjects SET title = ?, slug = ?, description = ?, thumbnail_url = ?, is_published = ? WHERE id = ?",
      [title, slug, description, thumbnail_url, is_published ? 1 : 0, courseId]
    );
    res.json({ message: "Course updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating course" });
  }
});

// DELETE /api/admin/courses/:courseId
router.delete("/courses/:courseId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    if (req.user?.role !== "admin") {
      const [courses]: any = await pool.query("SELECT * FROM subjects WHERE id = ? AND instructor_id = ?", [courseId, req.user?.id]);
      if (courses.length === 0) { res.status(403).json({ message: "Forbidden" }); return; }
    }
    await pool.query("DELETE FROM subjects WHERE id = ?", [courseId]);
    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting course" });
  }
});

// POST /api/admin/sections
router.post("/sections", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { subject_id, title, order_index } = req.body;
    const result: any = await pool.query(
      "INSERT INTO sections (subject_id, title, order_index) VALUES (?, ?, ?)",
      [subject_id, title, order_index]
    );
    res.status(201).json({ id: result[0].insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating section" });
  }
});

// PUT /api/admin/sections/:sectionId
router.put("/sections/:sectionId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, order_index } = req.body;
    const { sectionId } = req.params;
    await pool.query("UPDATE sections SET title = ?, order_index = ? WHERE id = ?", [title, order_index, sectionId]);
    res.json({ message: "Section updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating section" });
  }
});

// DELETE /api/admin/sections/:sectionId
router.delete("/sections/:sectionId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { sectionId } = req.params;
    await pool.query("DELETE FROM sections WHERE id = ?", [sectionId]);
    res.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting section" });
  }
});

// POST /api/admin/videos
router.post("/videos", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { section_id, title, description, youtube_url, order_index, duration_seconds } = req.body;
    const result: any = await pool.query(
      "INSERT INTO videos (section_id, title, description, youtube_url, order_index, duration_seconds) VALUES (?, ?, ?, ?, ?, ?)",
      [section_id, title, description, youtube_url, order_index, duration_seconds || 0]
    );
    res.status(201).json({ id: result[0].insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating video" });
  }
});

// PUT /api/admin/videos/:videoId
router.put("/videos/:videoId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, youtube_url, order_index, duration_seconds, section_id } = req.body;
    const { videoId } = req.params;
    
    // allow changing section_id or order_index
    let updateQuery = "UPDATE videos SET title = ?, description = ?, youtube_url = ?, order_index = ?, duration_seconds = ?";
    let queryParams = [title, description, youtube_url, order_index, duration_seconds];
    
    if (section_id) {
      updateQuery += ", section_id = ?";
      queryParams.push(section_id);
    }
    
    updateQuery += " WHERE id = ?";
    queryParams.push(videoId);

    await pool.query(updateQuery, queryParams);
    res.json({ message: "Video updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating video" });
  }
});

// DELETE /api/admin/videos/:videoId
router.delete("/videos/:videoId", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    await pool.query("DELETE FROM videos WHERE id = ?", [videoId]);
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting video" });
  }
});

// GET /api/admin/my-courses
router.get("/my-courses", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user?.role === "admin") {
      const [courses]: any = await pool.query("SELECT * FROM subjects ORDER BY created_at DESC");
      res.json(courses);
    } else {
      const [courses]: any = await pool.query("SELECT * FROM subjects WHERE instructor_id = ? ORDER BY created_at DESC", [req.user?.id]);
      res.json(courses);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching courses" });
  }
});

// GET /api/admin/courses/:courseId/full (Includes sections and videos inside)
router.get("/courses/:courseId/full", async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const [courses]: any = await pool.query("SELECT * FROM subjects WHERE id = ?", [courseId]);
    if (courses.length === 0) { res.status(404).json({ message: "Course not found" }); return; }

    const course = courses[0];
    const [sections]: any = await pool.query("SELECT * FROM sections WHERE subject_id = ? ORDER BY order_index ASC", [courseId]);
    const [videos]: any = await pool.query(
      "SELECT * FROM videos WHERE section_id IN (SELECT id FROM sections WHERE subject_id = ?) ORDER BY order_index ASC",
      [courseId]
    );

    const fullSections = sections.map((sec: any) => ({
      ...sec,
      videos: videos.filter((vid: any) => vid.section_id === sec.id)
    }));

    res.json({ ...course, sections: fullSections });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching full course" });
  }
});


export default router;
