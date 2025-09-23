// controllers/exportController.js
import { pool } from "../config/db.js";
import { buildCoursePDF } from "../services/pdfService.js";

export const exportCoursePDF = async (req, res) => {
  const { courseId } = req.params;
  try {
    // Get course
    const cRes = await pool.query(
      "SELECT c.*, u.name as creator_name FROM courses c LEFT JOIN users u ON c.created_by=u.user_id WHERE c.course_id=$1",
      [courseId]
    );
    if (!cRes.rows.length) return res.status(404).json({ error: "Course not found" });
    const course = cRes.rows[0];

    // Get COs
    const coRes = await pool.query("SELECT * FROM course_outcomes WHERE course_id=$1", [courseId]);
    course.outcomes = coRes.rows;

    // Get questions
    const qRes = await pool.query(
      `SELECT q.*, co.co_number
       FROM questions q
       LEFT JOIN course_outcomes co ON q.co_id=co.co_id
       WHERE q.course_id=$1`,
      [courseId]
    );
    const questions = [];
    for (const q of qRes.rows) {
      if (q.question_type === "mcq") {
        const opts = await pool.query("SELECT option_text, is_correct FROM options WHERE question_id=$1", [q.question_id]);
        q.options = opts.rows;
      }
      questions.push(q);
    }

    // Generate PDF
    const pdfBytes = await buildCoursePDF(course, questions, {
      generatedBy: req.user?.name || "System",
      generatedAt: new Date().toLocaleString()
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=course_${courseId}_questions.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
