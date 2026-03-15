import { Router, Request, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

// GET /api/notes/:videoId
router.get("/:videoId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.id;

    const [notes]: any = await pool.query(
      "SELECT id, timestamp_seconds, content, created_at FROM notes WHERE user_id = ? AND video_id = ? ORDER BY timestamp_seconds ASC",
      [userId, videoId]
    );

    res.json(notes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching notes" });
  }
});

// POST /api/notes/:videoId
router.post("/:videoId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { videoId } = req.params;
    const { timestamp_seconds, content } = req.body;
    const userId = req.user?.id;

    if (!content) {
      res.status(400).json({ message: "Note content is required" });
      return;
    }

    const result: any = await pool.query(
      "INSERT INTO notes (user_id, video_id, timestamp_seconds, content) VALUES (?, ?, ?, ?)",
      [userId, videoId, Math.floor(timestamp_seconds) || 0, content]
    );

    res.status(201).json({ id: result[0].insertId, message: "Note saved successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating note" });
  }
});

// DELETE /api/notes/:noteId
router.delete("/:noteId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { noteId } = req.params;
    const userId = req.user?.id;

    const [existing]: any = await pool.query("SELECT * FROM notes WHERE id = ? AND user_id = ?", [noteId, userId]);
    
    if (existing.length === 0) {
      res.status(404).json({ message: "Note not found or unauthorized" });
      return;
    }

    await pool.query("DELETE FROM notes WHERE id = ?", [noteId]);
    res.json({ message: "Note deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting note" });
  }
});

export default router;
