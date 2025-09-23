// controllers/reportController.js
import { pool } from "../config/db.js";
import { PDFDocument, StandardFonts } from "pdf-lib";

export const exportCourseReport = async (req, res) => {
  const { courseId } = req.params;
  try {
    // Fetch course
    const courseRes = await pool.query(
      "SELECT code, title, ltp_structure FROM courses WHERE course_id=$1",
      [courseId]
    );
    if (!courseRes.rows.length) return res.status(404).json({ error: "Course not found" });
    const course = courseRes.rows[0];

    // Fetch COs
    const coRes = await pool.query("SELECT * FROM course_outcomes WHERE course_id=$1", [courseId]);

    // Fetch Questions with moderation
    const qRes = await pool.query(
      `SELECT q.question_id, q.content, q.co_id,
              m.status, m.comments, m.reviewed_at, u.name as moderator_name
       FROM questions q
       LEFT JOIN moderation m ON q.question_id=m.question_id
       LEFT JOIN users u ON m.moderator_id=u.user_id
       WHERE q.course_id=$1`,
      [courseId]
    );

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    let y = 780;

    const write = (text, { f = font, size = 12 } = {}) => {
      page.drawText(text, { x: 50, y, font: f, size });
      y -= 20;
    };

    // Header
    write(`Course Report: ${course.code} – ${course.title}`, { f: bold, size: 16 });
    write(`LTP: ${course.ltp_structure}`);

    // CO Coverage
    write("Course Outcomes Coverage:", { f: bold, size: 14 });
    for (const co of coRes.rows) {
      const related = qRes.rows.filter(q => q.co_id === co.co_id);
      const total = related.length;
      const approved = related.filter(q => q.status === "approved").length;
      const rejected = related.filter(q => q.status === "rejected").length;
      const pending = related.filter(q => q.status === "pending" || !q.status).length;
      write(`${co.co_number}: ${co.description}`);
      write(`   Total Qs: ${total}, Approved: ${approved}, Rejected: ${rejected}, Pending: ${pending}`, { size: 10 });
    }

    y -= 10;
    write("Moderation Logs:", { f: bold, size: 14 });
    qRes.rows.forEach(q => {
      if (q.status) {
        write(`Q${q.question_id}: ${q.status.toUpperCase()} by ${q.moderator_name} (${q.comments || "No comments"}) on ${q.reviewed_at}`, { size: 10 });
      }
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=course_${courseId}_report.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
