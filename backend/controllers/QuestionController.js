// QuestionController.js
import { pool } from "../config/db.js";

// Add a subjective question
export const addSubjective = async (req, res) => {
  const { course_id, content, co_id } = req.body;
  const userId = req.user.user_id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO questions (course_id, author_id, question_type, content, co_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [course_id, userId, "subjective", content, co_id]
    );
    const question = result.rows[0];

    // Log the action
    await client.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "ADD_QUESTION", `${req.user.role} ${userId} added subjective Q${question.question_id}`]
    );

    await client.query("COMMIT");
    res.status(201).json(question);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Add an MCQ with options
export const addMCQ = async (req, res) => {
  const { course_id, content, co_id, options } = req.body; 
  // options = [{ text: "Stack", is_correct: false }, { text: "Queue", is_correct: true }]

  const userId = req.user.user_id;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insert question
    const result = await client.query(
      `INSERT INTO questions (course_id, author_id, question_type, content, co_id) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [course_id, userId, "mcq", content, co_id]
    );
    const question = result.rows[0];

    // Insert options
    for (const opt of options) {
      await client.query(
        `INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)`,
        [question.question_id, opt.text, opt.is_correct]
      );
    }

    // Log the action
    await client.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "ADD_QUESTION", `${req.user.role} ${userId} added MCQ Q${question.question_id}`]
    );

    await client.query("COMMIT");
    res.status(201).json({ ...question, options });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Get all questions by course
export const getQuestionsByCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    const result = await pool.query(
      `SELECT q.*, co.co_number, co.description AS co_description, u.name AS author_name
       FROM questions q
       LEFT JOIN course_outcomes co ON q.co_id = co.co_id
       LEFT JOIN users u ON q.author_id = u.user_id
       WHERE q.course_id = $1
       ORDER BY q.created_at DESC`,
      [courseId]
    );

    // Attach options if MCQ
    const questions = await Promise.all(
      result.rows.map(async (q) => {
        if (q.question_type === "mcq") {
          const opts = await pool.query(
            "SELECT option_id, option_text, is_correct FROM options WHERE question_id = $1",
            [q.question_id]
          );
          return { ...q, options: opts.rows };
        }
        return q;
      })
    );

    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ✅ New: Get questions by Course Outcome (CO)
export const getQuestionsByCO = async (req, res) => {
  const { coId } = req.params;

  try {
    const result = await pool.query(
      `SELECT q.*, c.code AS course_code, c.title AS course_title,
              co.co_number, co.description AS co_description, u.name AS author_name
       FROM questions q
       LEFT JOIN courses c ON q.course_id = c.course_id
       LEFT JOIN course_outcomes co ON q.co_id = co.co_id
       LEFT JOIN users u ON q.author_id = u.user_id
       WHERE q.co_id = $1
       ORDER BY q.created_at DESC`,
      [coId]
    );

    const questions = await Promise.all(
      result.rows.map(async (q) => {
        if (q.question_type === "mcq") {
          const opts = await pool.query(
            "SELECT option_id, option_text, is_correct FROM options WHERE question_id = $1",
            [q.question_id]
          );
          return { ...q, options: opts.rows };
        }
        return q;
      })
    );

    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Edit a question (only by owner)
// Edit a question (with versioning)
export const editQuestion = async (req, res) => {
  const { questionId } = req.params;
  const { content, options } = req.body;
  const userId = req.user.user_id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Fetch existing question
    const check = await client.query(
      "SELECT * FROM questions WHERE question_id = $1",
      [questionId]
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Question not found" });
    }
    const existing = check.rows[0];

    if (existing.author_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Not authorized to edit this question" });
    }

    // Fetch existing options if MCQ
    let currentOptions = [];
    if (existing.question_type === "mcq") {
      const optRes = await client.query(
        "SELECT option_text, is_correct FROM options WHERE question_id=$1",
        [questionId]
      );
      currentOptions = optRes.rows;
    }

    // Insert snapshot into question_versions
    await client.query(
      `INSERT INTO question_versions (question_id, content, options, edited_by) 
       VALUES ($1, $2, $3, $4)`,
      [questionId, existing.content, JSON.stringify(currentOptions), userId]
    );

    // Update main question
    const updated = await client.query(
      "UPDATE questions SET content = $1, updated_at = NOW() WHERE question_id = $2 RETURNING *",
      [content, questionId]
    );
    const question = updated.rows[0];

    // If MCQ, replace options
    if (question.question_type === "mcq" && Array.isArray(options)) {
      await client.query("DELETE FROM options WHERE question_id = $1", [questionId]);
      for (const opt of options) {
        await client.query(
          "INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)",
          [questionId, opt.text, opt.is_correct]
        );
      }
    }

    // Log
    await client.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "EDIT_QUESTION", `User ${userId} edited question ${questionId}`]
    );

    await client.query("COMMIT");
    res.json({ ...question, options: options || [] });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

// Get version history of a question
export const getQuestionVersions = async (req, res) => {
  const { questionId } = req.params;

  try {
    const result = await pool.query(
      `SELECT v.*, u.name as edited_by_name
       FROM question_versions v
       LEFT JOIN users u ON v.edited_by = u.user_id
       WHERE v.question_id = $1
       ORDER BY v.created_at DESC`,
      [questionId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a question (only by owner)
export const deleteQuestion = async (req, res) => {
  const { questionId } = req.params;
  const userId = req.user.user_id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verify question exists and belongs to user
    const check = await client.query(
      "SELECT * FROM questions WHERE question_id = $1",
      [questionId]
    );
    if (check.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Question not found" });
    }
    if (check.rows[0].author_id !== userId) {
      await client.query("ROLLBACK");
      return res.status(403).json({ error: "Not authorized to delete this question" });
    }

    // Delete question → cascade deletes options (due to FK ON DELETE CASCADE)
    await client.query("DELETE FROM questions WHERE question_id = $1", [questionId]);

    // Log action
    await client.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "DELETE_QUESTION", `User ${userId} deleted question ${questionId}`]
    );

    await client.query("COMMIT");
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

