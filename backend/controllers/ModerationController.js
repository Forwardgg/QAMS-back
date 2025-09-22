import { pool } from "../config/db.js";

// Add a moderation entry (review a question)
export const reviewQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { status, comments } = req.body;
  const moderatorId = req.user.user_id;

  try {
    // Ensure question exists
    const qCheck = await pool.query("SELECT * FROM questions WHERE question_id = $1", [questionId]);
    if (qCheck.rows.length === 0) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Insert moderation entry
    const result = await pool.query(
      `INSERT INTO moderation (question_id, moderator_id, status, comments)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [questionId, moderatorId, status, comments]
    );
    const moderation = result.rows[0];

    // Log action
    await pool.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [moderatorId, "MODERATION", `Reviewed question ${questionId} → ${status}`]
    );

    res.status(201).json(moderation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all moderations for a question
export const getModerationByQuestion = async (req, res) => {
  const { questionId } = req.params;
  try {
    const result = await pool.query(
      `SELECT m.*, u.name as moderator_name
       FROM moderation m
       LEFT JOIN users u ON m.moderator_id = u.user_id
       WHERE m.question_id = $1
       ORDER BY m.reviewed_at DESC`,
      [questionId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all moderation actions by a moderator
export const getModerationByModerator = async (req, res) => {
  const { moderatorId } = req.params;
  try {
    const result = await pool.query(
      `SELECT m.*, q.content as question_text, c.code as course_code
       FROM moderation m
       LEFT JOIN questions q ON m.question_id = q.question_id
       LEFT JOIN courses c ON q.course_id = c.course_id
       WHERE m.moderator_id = $1
       ORDER BY m.reviewed_at DESC`,
      [moderatorId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
