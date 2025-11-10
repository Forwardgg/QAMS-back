import { pool } from "../config/db.js";

export class QuestionMedia {
  // Create media entry for a question
  static async create({ questionId, mediaUrl, caption = "" }) {
    const query = `
      INSERT INTO question_media (question_id, media_url, caption)
      VALUES ($1, $2, $3)
      RETURNING id, question_id, media_url, caption;
    `;
    const values = [questionId, mediaUrl, caption];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  // Get all media attached to a question
  static async getByQuestion(questionId) {
    const query = `
      SELECT id, question_id, media_url, caption
      FROM question_media
      WHERE question_id = $1
      ORDER BY id;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }
  // Update media (if needed)
  static async update(id, { mediaUrl, caption }) {
    const query = `
      UPDATE question_media
      SET media_url = $1, caption = $2
      WHERE id = $3
      RETURNING id, question_id, media_url, caption;
    `;
    const { rows } = await pool.query(query, [mediaUrl, caption, id]);
    return rows[0];
  }
  // Delete a media record
  static async delete(id) {
    const query = `
      DELETE FROM question_media
      WHERE id = $1
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
  // Delete all media for a given question
  static async deleteByQuestion(questionId) {
    const query = `
      DELETE FROM question_media
      WHERE question_id = $1
      RETURNING id;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }
}
