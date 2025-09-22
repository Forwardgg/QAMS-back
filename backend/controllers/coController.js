// coController.js
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

// Update a CO
export const updateCO = async (req, res) => {
  const { coId } = req.params;
  const { co_number, description } = req.body;

  try {
    const result = await pool.query(
      `UPDATE course_outcomes
       SET co_number = $1, description = $2
       WHERE co_id = $3
       RETURNING *`,
      [co_number, description, coId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "CO not found" });
    }

    // Log update
    await pool.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [req.user.user_id, "UPDATE_CO", `Updated CO ${coId}`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "CO number must be unique per course" });
    }
    res.status(400).json({ error: err.message });
  }
};

// Delete a CO
export const deleteCO = async (req, res) => {
  const { coId } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM course_outcomes WHERE co_id = $1 RETURNING *",
      [coId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "CO not found" });
    }

    // Log delete
    await pool.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [req.user.user_id, "DELETE_CO", `Deleted CO ${coId}`]
    );

    res.json({ message: "CO deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get single CO by ID
export const getCOById = async (req, res) => {
  const { coId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM course_outcomes WHERE co_id = $1",
      [coId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "CO not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
