import { pool } from "../config/db.js";

// Add a new CO to a course
export const addCO = async (req, res) => {
  const { courseId } = req.params;
  const { co_number, description } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO course_outcomes (course_id, co_number, description) VALUES ($1, $2, $3) RETURNING *",
      [courseId, co_number, description]
    );

    // Log the CO creation
    await pool.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [req.user.user_id, "ADD_CO", `Added ${co_number} to course ${courseId}`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all COs for a course
export const getCOsByCourse = async (req, res) => {
  const { courseId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM course_outcomes WHERE course_id = $1",
      [courseId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
