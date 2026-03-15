import { Router, Response } from "express";
import { pool } from "../../config/db";
import { AuthenticatedRequest, authenticate } from "../../middleware/authMiddleware";
import PDFDocument from "pdfkit";

const router = Router();

// GET /api/certificates - List all certificates the user has claimed/completed
router.get("/", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const [certs]: any = await pool.query(`
      SELECT c.id, c.subject_id, s.title as subject_title, c.issued_at
      FROM certificates c
      JOIN subjects s ON c.subject_id = s.id
      WHERE c.user_id = ?
      ORDER BY c.issued_at DESC
    `, [userId]);

    res.json(certs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching certificates List" });
  }
});

// GET /api/certificates/:subjectId - Generate and stream PDF certificate
router.get("/:subjectId", authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { subjectId } = req.params;
    const userId = req.user?.id;

    // 1. Double check completion percentage
    const [stats]: any = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM videos v JOIN sections sec ON v.section_id = sec.id WHERE sec.subject_id = ?) as total_videos,
        (SELECT COUNT(*) FROM video_progress vp JOIN videos v ON vp.video_id = v.id JOIN sections sec ON v.section_id = sec.id WHERE vp.user_id = ? AND vp.is_completed = 1 AND sec.subject_id = ?) as completed_videos,
        s.title as subject_title,
        u.name as user_name
      FROM subjects s 
      JOIN users u ON u.id = ?
      WHERE s.id = ?
    `, [subjectId, userId, subjectId, userId, subjectId]);

    if (stats.length === 0) {
      res.status(404).json({ message: "Subject not found" });
      return;
    }

    const { total_videos, completed_videos, subject_title, user_name } = stats[0];

    if (total_videos === 0 || total_videos > completed_videos) {
      res.status(403).json({ message: "Course not fully completed yet. Keep studying!" });
      return;
    }

    // 2. Insert into certificates table for logs if not already exists
    const [existing]: any = await pool.query("SELECT id FROM certificates WHERE user_id = ? AND subject_id = ?", [userId, subjectId]);
    if (existing.length === 0) {
      await pool.query("INSERT INTO certificates (user_id, subject_id) VALUES (?, ?)", [userId, subjectId]);
    }

    // 3. Generate PDF 
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });

    // Set headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate-${subject_title.replace(/\s+/g, '-')}.pdf"`);

    doc.pipe(res);

    // DRAWING THE CERTIFICATE
    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).lineWidth(4).stroke("#4f46e5");
    doc.rect(28, 28, doc.page.width - 56, doc.page.height - 56).lineWidth(1).stroke("#e0e7ff");

    // Header Content
    doc.y = 100;
    doc.fontSize(40).fillColor("#1e1b4b").font('Helvetica-Bold').text('CERTIFICATE', { align: 'center' });
    doc.fontSize(16).fillColor("#6366f1").font('Helvetica').text('OF COMPLETION', { align: 'center', characterSpacing: 4 });

    doc.moveDown(2);
    doc.fontSize(16).fillColor("#475569").font('Helvetica').text('This is to certify that', { align: 'center' });
    
    // User Name
    doc.moveDown(1);
    doc.fontSize(36).fillColor("#111827").font('Helvetica-Bold').text(user_name || "Student", { align: 'center' });
    
    // Divider
    doc.moveTo(150, doc.y + 5).lineTo(doc.page.width - 150, doc.y + 5).lineWidth(2).stroke("#e2e8f0");

    doc.moveDown(2);
    doc.fontSize(16).fillColor("#475569").font('Helvetica').text('has successfully completed the course', { align: 'center' });
    
    // Subject Title
    doc.moveDown(0.5);
    doc.fontSize(28).fillColor("#4f46e5").font('Helvetica-Bold').text(subject_title, { align: 'center' });

    // Issued Date
    doc.moveDown(3);
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.fontSize(14).fillColor("#64748b").font('Helvetica').text(`Issued on ${date}`, { align: 'center' });

    // Bottom Logo / Footer placeholder
    doc.moveDown(2);
    doc.fontSize(12).fillColor("#c7d2fe").font('Helvetica-Bold').text('Learning Management System Inc.', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error generating certificate PDF" });
  }
});

export default router;
