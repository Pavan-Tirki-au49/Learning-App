import { Router, Request, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

// GET /api/reviews/:subjectId
router.get("/:subjectId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const [reviews]: any = await pool.query(`
      SELECT r.id, r.user_id, r.rating, r.comment, r.created_at, u.name 
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.subject_id = ?
      ORDER BY r.created_at DESC
    `, [subjectId]);

    res.json(reviews);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching reviews" });
  }
});

// POST /api/reviews/:subjectId
router.post("/:subjectId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user?.id;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ message: "Rating must be between 1 and 5" });
      return;
    }

    const [existing]: any = await pool.query(
      "SELECT id FROM reviews WHERE user_id = ? AND subject_id = ?",
      [userId, subjectId]
    );

    if (existing.length > 0) {
      // Update existing
      await pool.query(
        "UPDATE reviews SET rating = ?, comment = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?",
        [rating, comment || "", existing[0].id]
      );
      res.json({ message: "Review updated successfully" });
    } else {
      // Create new
      await pool.query(
        "INSERT INTO reviews (user_id, subject_id, rating, comment) VALUES (?, ?, ?, ?)",
        [userId, subjectId, rating, comment || ""]
      );
      res.status(201).json({ message: "Review created successfully" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error submitting review" });
  }
});

export default router;
