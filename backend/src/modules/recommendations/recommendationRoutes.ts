import { Router, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// GET /api/recommendations
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    // 1. Get subjects the user is enrolled in
    const [enrolled]: any = await pool.query(`
      SELECT s.id, s.title, s.description 
      FROM subjects s
      JOIN enrollments e ON s.id = e.subject_id
      WHERE e.user_id = ?
    `, [userId]);

    const enrolledIds = enrolled.map((s: any) => s.id);

    // 2. Get subjects NOT enrolled in 
    const [available]: any = await pool.query(`
      SELECT s.id, s.title, s.description, s.thumbnail_url,
        (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE subject_id = s.id) as average_rating,
        (SELECT COUNT(*) FROM reviews WHERE subject_id = s.id) as total_reviews
      FROM subjects s
      WHERE s.is_published = TRUE AND s.id NOT IN (${enrolledIds.length > 0 ? enrolledIds.join(",") : "0"})
    `);

    if (available.length === 0) {
      res.json([]);
      return;
    }

    if (!process.env.GEMINI_API_KEY || enrolled.length === 0) {
      // Fallback: Recommend top rated subjects, or just the first few available
      const recommended = available
        .sort((a: any, b: any) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 3);
      
      res.json(recommended);
      return;
    }

    // AI recommendation path
    try {
      const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = ai.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        You are a Student Course Recommendation system.
        Based on the user's completed/enrolled courses, recommend up to 3 similar courses from the available list.
        
        Courses Enrolled:
        ${JSON.stringify(enrolled.map((c: any) => ({ id: c.id, title: c.title, description: c.description })))}

        Available Catalog to Recommend:
        ${JSON.stringify(available.map((c: any) => ({ id: c.id, title: c.title, description: c.description })))}

        Return a JSON array containing the recommended subject IDs ONLY.
        Format: [id1, id2, id3]
      `;

      const result = await model.generateContent(prompt);
      const recommendedIds = JSON.parse(result.response.text());

      if (Array.isArray(recommendedIds)) {
        const recommended = available.filter((c: any) => recommendedIds.includes(c.id));
        res.json(recommended.length > 0 ? recommended : available.slice(0, 3));
      } else {
        res.json(available.slice(0, 3));
      }

    } catch (aiErr) {
      console.error("AI Recommendation failed:", aiErr);
      res.json(available.slice(0, 3));
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching recommendations" });
  }
});

export default router;
