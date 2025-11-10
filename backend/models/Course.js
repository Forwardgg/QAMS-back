// backend/models/Course.js
import { pool } from "../config/db.js";

export class Course {
  static async create({ code, title, l, t, p, createdBy }) {
    const query = `
      INSERT INTO courses (code, title, l, t, p, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING course_id, code, title, l, t, p, created_by, created_at;
    `;
    const values = [code, title, l, t, p, createdBy];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  static async getAll() {
    const query = `
      SELECT c.course_id, c.code, c.title, c.l, c.t, c.p,
             c.created_by, u.name AS created_by_name, c.created_at
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.user_id
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
  static async getById(courseId) {
    const query = `
      SELECT c.course_id, c.code, c.title, c.l, c.t, c.p,
             c.created_by, u.name AS created_by_name, c.created_at
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.user_id
      WHERE c.course_id = $1;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows[0];
  }
  static async update(courseId, { code, title, l, t, p }) {
  const query = `
    UPDATE courses
    SET code = $1, title = $2, l = $3, t = $4, p = $5
    WHERE course_id = $6
    RETURNING course_id, code, title, l, t, p, created_by, created_at, updated_at;
  `;
  const values = [code, title, l, t, p, courseId];
  const { rows } = await pool.query(query, values);
  return rows[0] || null; // explicit null if not found
}
static async delete(courseId) {
  const query = `
    DELETE FROM courses
    WHERE course_id = $1
    RETURNING course_id, code, title, created_by, created_at;
  `;
  const { rows } = await pool.query(query, [courseId]);
  return rows[0] || null; // null if not found
}
  static async getByCreator(userId) {
    const query = `
      SELECT c.course_id, c.code, c.title, c.l, c.t, c.p,
             c.created_by, u.name AS created_by_name, c.created_at
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.user_id
      WHERE c.created_by = $1
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows;
  }
  static async getByCode(code) {
    const query = `
      SELECT c.course_id, c.code, c.title, c.l, c.t, c.p,
             c.created_by, u.name AS created_by_name, c.created_at
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.user_id
      WHERE c.code = $1;
    `;
    const { rows } = await pool.query(query, [code]);
    return rows[0]; // since code is UNIQUE
  }
  static async searchByTitle(title) {
    const query = `
      SELECT c.course_id, c.code, c.title, c.l, c.t, c.p,
             c.created_by, u.name AS created_by_name, c.created_at
      FROM courses c
      LEFT JOIN users u ON c.created_by = u.user_id
      WHERE c.title ILIKE $1
      ORDER BY c.created_at DESC;
    `;
    const { rows } = await pool.query(query, [`%${title}%`]);
    return rows;
  }
}
