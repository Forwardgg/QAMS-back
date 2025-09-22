// CourseController.js
import { pool } from "../config/db.js";

// Helper: generate assessments from L-T-P structure
const generateAssessments = (ltp) => {
  const [l, t, p] = ltp.split("-").map(Number);
  let assessments = [];

  if (l > 0 || t > 0) {
    assessments.push("Sessional Test-I", "Mid-term Test", "Sessional Test-II", "End-term Test");
  }
  if (p > 0 && (l > 0 || t > 0)) {
    assessments.push("End-term Laboratory Test");
  }
  if (l === 0 && t === 0 && p > 0) {
    assessments.push("Mid-term Laboratory Test", "End-term Laboratory Test");
  }
  if (l === 0 && t > 0 && p > 0) {
    assessments.push("End-term Laboratory Test");
  }

  return assessments;
};

export const createCourse = async (req, res) => {
  const { code, title, ltp_structure } = req.body;
  const userId = req.user.user_id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Insert into courses
    const courseResult = await client.query(
      "INSERT INTO courses (code, title, ltp_structure, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [code, title, ltp_structure, userId]
    );
    const course = courseResult.rows[0];

    // Generate assessments based on LTP
    const assessments = generateAssessments(ltp_structure);

    // Insert into logs
    await client.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "ADD_COURSE", `${req.user.role} ${req.user.user_id} created course ${course.code}`]
    );

    await client.query("COMMIT");

    // Respond with course + assessments
    res.status(201).json({ ...course, assessments });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

export const getCourses = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT c.*, u.name as creator_name FROM courses c LEFT JOIN users u ON c.created_by = u.user_id"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// New: Fetch courses + COs + auto-assessments
export const getCoursesWithCOs = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.course_id, c.code, c.title, c.ltp_structure, c.created_at, u.name as creator_name,
              co.co_id, co.co_number, co.description
       FROM courses c
       LEFT JOIN users u ON c.created_by = u.user_id
       LEFT JOIN course_outcomes co ON c.course_id = co.course_id
       ORDER BY c.course_id, co.co_number`
    );

    // Group by course
    const coursesMap = {};
    result.rows.forEach(row => {
      if (!coursesMap[row.course_id]) {
        coursesMap[row.course_id] = {
          course_id: row.course_id,
          code: row.code,
          title: row.title,
          ltp_structure: row.ltp_structure,
          created_at: row.created_at,
          creator_name: row.creator_name,
          assessments: generateAssessments(row.ltp_structure),
          outcomes: []
        };
      }
      if (row.co_id) {
        coursesMap[row.course_id].outcomes.push({
          co_id: row.co_id,
          co_number: row.co_number,
          description: row.description
        });
      }
    });

    res.json(Object.values(coursesMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a course
export const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const { code, title, ltp_structure } = req.body;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `UPDATE courses
       SET code = $1, title = $2, ltp_structure = $3
       WHERE course_id = $4
       RETURNING *`,
      [code, title, ltp_structure, courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Log update
    await pool.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "UPDATE_COURSE", `Updated course ${courseId}`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Course code must be unique" });
    }
    res.status(400).json({ error: err.message });
  }
};

// Delete a course
export const deleteCourse = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      "DELETE FROM courses WHERE course_id = $1 RETURNING *",
      [courseId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Log delete
    await pool.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [userId, "DELETE_COURSE", `Deleted course ${courseId}`]
    );

    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
