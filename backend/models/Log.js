// backend/models/Log.js
import { pool } from "../config/db.js";

export class Log {
  static async create({ userId, action, details }) {
    const query = `
      INSERT INTO logs (user_id, action, details)
      VALUES ($1, $2, $3)
      RETURNING log_id, user_id, action, details, created_at;
    `;
    const values = [userId, action, details];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  static async getAll(limit = 50) {
    const query = `
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.user_id
      ORDER BY l.created_at DESC
      LIMIT $1;
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  }
  static async getByUser(userId, limit = 50) {
    const query = `
      SELECT l.*, u.name as user_name, u.role as user_role
      FROM logs l
      LEFT JOIN users u ON l.user_id = u.user_id
      WHERE l.user_id = $1
      ORDER BY l.created_at DESC
      LIMIT $2;
    `;
    const { rows } = await pool.query(query, [userId, limit]);
    return rows;
  }
  static async delete(logId) {
    const query = `
      DELETE FROM logs WHERE log_id = $1 RETURNING log_id;
    `;
    const { rows } = await pool.query(query, [logId]);
    return rows[0];
  }
}
