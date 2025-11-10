// backend/backend/models/Question.js
import { pool } from "../config/db.js";

export class Question {
  static async create({ courseId, authorId, questionType, content, coId }) {
    const query = `
      INSERT INTO questions (course_id, author_id, question_type, content, co_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING question_id, course_id, author_id, question_type, content, co_id, created_at, is_active;
    `;
    const values = [courseId, authorId, questionType, content, coId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByCourse(courseId) {
    const query = `
      SELECT q.*, u.name as author_name, c.code as course_code, co.co_number
      FROM questions q
      LEFT JOIN users u ON q.author_id = u.user_id
      LEFT JOIN courses c ON q.course_id = c.course_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE q.course_id = $1 AND q.is_active = true
      ORDER BY q.created_at DESC;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows;
  }

  static async getById(questionId) {
    const query = `
      SELECT q.*, u.name as author_name, c.code as course_code, co.co_number
      FROM questions q
      LEFT JOIN users u ON q.author_id = u.user_id
      LEFT JOIN courses c ON q.course_id = c.course_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE q.question_id = $1;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows[0];
  }

  static async update(questionId, { content, coId }) {
    const query = `
      UPDATE questions
      SET content = $1, co_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE question_id = $3
      RETURNING question_id, course_id, author_id, question_type, content, co_id, updated_at, is_active;
    `;
    const values = [content, coId, questionId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async softDelete(questionId) {
    const query = `
      UPDATE questions
      SET is_active = false
      WHERE question_id = $1
      RETURNING question_id, is_active;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows[0];
  }
}
