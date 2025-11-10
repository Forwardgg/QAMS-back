// backend/models/PaperQuestion.js
import { pool } from "../config/db.js";

export class PaperQuestion {
  // Add a single question to a paper
  static async add({ paperId, questionId, sequence, marks, section }) {
    // Prevent duplicates
    const exists = await this.exists(paperId, questionId);
    if (exists) {
      throw new Error("Question already exists in this paper");
    }

    const query = `
      INSERT INTO paper_questions (paper_id, question_id, sequence, marks, section)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, paper_id, question_id, sequence, marks, section;
    `;
    const values = [paperId, questionId, sequence, marks, section];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  // Get all questions in a paper (with joins for display)
  static async getByPaper(paperId) {
    const query = `
      SELECT pq.*, q.content, q.question_type, co.co_number, co.description as co_description
      FROM paper_questions pq
      LEFT JOIN questions q ON pq.question_id = q.question_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE pq.paper_id = $1
      ORDER BY pq.sequence ASC;
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }
  // Get one mapping by ID (with joins)
  static async getById(id) {
    const query = `
      SELECT pq.*, q.content, q.question_type, co.co_number, co.description as co_description
      FROM paper_questions pq
      LEFT JOIN questions q ON pq.question_id = q.question_id
      LEFT JOIN course_outcomes co ON q.co_id = co.co_id
      WHERE pq.id = $1;
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }
  // Update mapping (marks/sequence/section)
  static async update(id, { sequence, marks, section }) {
    const query = `
      UPDATE paper_questions
      SET sequence = COALESCE($1, sequence),
          marks = COALESCE($2, marks),
          section = COALESCE($3, section)
      WHERE id = $4
      RETURNING id, paper_id, question_id, sequence, marks, section;
    `;
    const values = [sequence, marks, section, id];
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) throw new Error("PaperQuestion not found");
    return rows[0];
  }
  // Remove mapping
  static async remove(id) {
    const query = `
      DELETE FROM paper_questions WHERE id = $1 RETURNING id;
    `;
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) throw new Error("PaperQuestion not found");
    return rows[0];
  }
  // Check if question already exists in a paper
  static async exists(paperId, questionId) {
    const query = `
      SELECT 1 FROM paper_questions
      WHERE paper_id = $1 AND question_id = $2
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [paperId, questionId]);
    return rows.length > 0;
  }
  // Reorder all questions in a paper (compact sequence 1..N)
  static async reorder(paperId) {
    const questions = await this.getByPaper(paperId);
    let seq = 1;
    for (const q of questions) {
      await pool.query(
        `UPDATE paper_questions SET sequence = $1 WHERE id = $2`,
        [seq++, q.id]
      );
    }
    return this.getByPaper(paperId);
  }
  // Bulk add questions to a paper in a transaction
  static async bulkAdd(paperId, questions = []) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return [];
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const inserted = [];
      for (const q of questions) {
        // Check duplicates
        const { rows: dupCheck } = await client.query(
          `SELECT 1 FROM paper_questions WHERE paper_id = $1 AND question_id = $2 LIMIT 1;`,
          [paperId, q.questionId]
        );
        if (dupCheck.length > 0) {
          throw new Error(`Question ${q.questionId} already exists in this paper`);
        }

        const query = `
          INSERT INTO paper_questions (paper_id, question_id, sequence, marks, section)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, paper_id, question_id, sequence, marks, section;
        `;
        const values = [paperId, q.questionId, q.sequence, q.marks, q.section];
        const { rows } = await client.query(query, values);
        inserted.push(rows[0]);
      }

      await client.query("COMMIT");
      return inserted;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
}
