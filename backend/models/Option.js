// backend/models/Option.js
import { pool } from "../config/db.js";

export class Option {
  static async create({ questionId, optionText, isCorrect = false }) {
    const query = `
      INSERT INTO options (question_id, option_text, is_correct)
      VALUES ($1, $2, $3)
      RETURNING option_id, question_id, option_text, is_correct;
    `;
    const values = [questionId, optionText, isCorrect];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  static async getByQuestion(questionId) {
    const query = `
      SELECT option_id, question_id, option_text, is_correct
      FROM options
      WHERE question_id = $1
      ORDER BY option_id;
    `;
    const { rows } = await pool.query(query, [questionId]);
    return rows;
  }
  static async update(optionId, { optionText, isCorrect }) {
    const query = `
      UPDATE options
      SET option_text = $1, is_correct = $2
      WHERE option_id = $3
      RETURNING option_id, question_id, option_text, is_correct;
    `;
    const values = [optionText, isCorrect, optionId];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  static async delete(optionId) {
    const query = `
      DELETE FROM options WHERE option_id = $1 RETURNING option_id;
    `;
    const { rows } = await pool.query(query, [optionId]);
    return rows[0];
  }
  static async deleteByQuestion(questionId) {
  const query = `DELETE FROM options WHERE question_id = $1 RETURNING option_id;`;
  const { rows } = await pool.query(query, [questionId]);
  return rows;
}
}
