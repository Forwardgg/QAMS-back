// backend/models/CourseOutcome.js
import { pool } from "../config/db.js";

export class CourseOutcome {
  static async create({ courseId, coNumber, description }) {
    const query = `
      INSERT INTO course_outcomes (course_id, co_number, description)
      VALUES ($1, $2, $3)
      RETURNING co_id, course_id, co_number, description;
    `;
    try {
      const values = [courseId, coNumber, description];
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (error) {
      // Handle duplicate CO number within the same course
      if (error.code === "23505") {
        throw new Error("DUPLICATE_CO_NUMBER");
      }
      throw error;
    }
  }
  static async getByCourse(courseId) {
    const query = `
      SELECT co_id, course_id, co_number, description
      FROM course_outcomes
      WHERE course_id = $1
      ORDER BY co_number;
    `;
    const { rows } = await pool.query(query, [courseId]);
    return rows;
  }
  static async getById(coId) {
    const query = `
      SELECT co_id, course_id, co_number, description
      FROM course_outcomes
      WHERE co_id = $1;
    `;
    const { rows } = await pool.query(query, [coId]);
    return rows[0] || null;
  }
  static async update(coId, { coNumber, description }) {
    const updates = [];
    const values = [];
    let idx = 1;

    if (coNumber !== undefined) {
      updates.push(`co_number = $${idx}`);
      values.push(coNumber);
      idx++;
    }
    if (description !== undefined) {
      updates.push(`description = $${idx}`);
      values.push(description);
      idx++;
    }

    if (updates.length === 0) {
      return null; // nothing to update
    }

    values.push(coId);

    const query = `
      UPDATE course_outcomes
      SET ${updates.join(", ")}
      WHERE co_id = $${idx}
      RETURNING co_id, course_id, co_number, description;
    `;

    try {
      const { rows } = await pool.query(query, values);
      return rows[0] || null;
    } catch (error) {
      if (error.code === "23505") {
        throw new Error("DUPLICATE_CO_NUMBER");
      }
      throw error;
    }
  }
  static async delete(coId) {
    const query = `
      DELETE FROM course_outcomes 
      WHERE co_id = $1 
      RETURNING co_id, course_id, co_number, description;
    `;
    const { rows } = await pool.query(query, [coId]);
    return rows[0] || null;
  }
}
