// backend/models/QuestionPaper.js
import { pool } from "../config/db.js";

export class QuestionPaper {
  static async create({
    courseId,
    instructorId,
    title,
    examType,
    semester,
    academicYear,
    fullMarks,
    duration
  }) {
    const query = `
      INSERT INTO question_papers
        (course_id, instructor_id, title, exam_type, semester, academic_year, full_marks, duration)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING paper_id, course_id, instructor_id, title, status, version,
                exam_type, semester, academic_year, full_marks, duration,
                created_at, updated_at;
    `;
    const values = [courseId, instructorId, title, examType, semester, academicYear, fullMarks, duration];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  static async getAll(limit = 50, offset = 0) {
    const query = `
      SELECT p.*, c.code as course_code, c.title as course_title, u.name as instructor_name
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.instructor_id = u.user_id
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2;
    `;
    const { rows } = await pool.query(query, [limit, offset]);
    return rows;
  }
  static async getById(paperId) {
    const query = `
      SELECT p.*, c.code as course_code, c.title as course_title, u.name as instructor_name
      FROM question_papers p
      LEFT JOIN courses c ON p.course_id = c.course_id
      LEFT JOIN users u ON p.instructor_id = u.user_id
      WHERE p.paper_id = $1;
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows[0];
  }
  static async update(paperId, { title, examType, semester, academicYear, fullMarks, duration, status }) {
    const allowedStatuses = ["draft", "submitted", "approved", "rejected"];
    if (status && !allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${allowedStatuses.join(", ")}`);
    }

    const query = `
      UPDATE question_papers
      SET title = COALESCE($1, title),
          exam_type = COALESCE($2, exam_type),
          semester = COALESCE($3, semester),
          academic_year = COALESCE($4, academic_year),
          full_marks = COALESCE($5, full_marks),
          duration = COALESCE($6, duration),
          status = COALESCE($7, status),
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $8
      RETURNING paper_id, course_id, instructor_id, title, status, version,
                exam_type, semester, academic_year, full_marks, duration,
                created_at, updated_at;
    `;
    const values = [title, examType, semester, academicYear, fullMarks, duration, status, paperId];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) throw new Error("Paper not found");
    return rows[0];
  }
  static async delete(paperId) {
    const query = `
      DELETE FROM question_papers WHERE paper_id = $1 RETURNING paper_id;
    `;
    const { rows } = await pool.query(query, [paperId]);
    if (rows.length === 0) throw new Error("Paper not found");
    return rows[0];
  }
  // moderation workflow
  static async submit(paperId) {
    return this._setStatus(paperId, "submitted");
  }
  static async approve(paperId) {
    return this._setStatus(paperId, "approved");
  }
  static async reject(paperId) {
    return this._setStatus(paperId, "rejected");
  }
  // Private helper for status update
  static async _setStatus(paperId, status) {
    const query = `
      UPDATE question_papers
      SET status = $1,
          version = version + 1,
          updated_at = CURRENT_TIMESTAMP
      WHERE paper_id = $2
      RETURNING paper_id, course_id, instructor_id, title, status, version,
                exam_type, semester, academic_year, full_marks, duration,
                created_at, updated_at;
    `;
    const { rows } = await pool.query(query, [status, paperId]);

    if (rows.length === 0) throw new Error("Paper not found");
    return rows[0];
  }
}
