import { Router, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";

const router = Router();

// GET /api/streak
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // Check streak
    const [streak]: any = await pool.query(
      "SELECT current_streak, last_active_date FROM user_streaks WHERE user_id = ?",
      [userId]
    );

    if (streak.length === 0) {
      res.json({ current_streak: 0 });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastActiveStr = streak[0].last_active_date;
    const lastDate = new Date(lastActiveStr);
    const today = new Date(todayStr);
    const diffTime = today.getTime() - lastDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let activeStreak = streak[0].current_streak;

    if (diffDays > 1) {
      // Streak broken. Back to 0. 
      // But let's check if the streak isn't reset in DB yet. 
      // We return 0, the next WATCH or continuous updates resets the row naturally.
      activeStreak = 0;
    }

    res.json({ current_streak: activeStreak });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching streak" });
  }
});

export default router;
