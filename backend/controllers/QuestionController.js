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
