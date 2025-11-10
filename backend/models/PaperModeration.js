// backend/models/PaperModeration.js
import { pool } from "../config/db.js";
import { QuestionPaper } from "./QuestionPaper.js";

export class PaperModeration {
  static allowedStatuses = ["pending", "approved", "rejected"];

  /**
   * Create a moderation record (claim).
   * This runs inside a DB transaction and writes the audit log inside the same transaction.
   */
  static async create({ paperId, moderatorId, status = "pending", comments = "" }) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const insertQuery = `
        INSERT INTO paper_moderation (paper_id, moderator_id, status, comments, reviewed_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING id, paper_id, moderator_id, status, comments, reviewed_at;
      `;
      const { rows } = await client.query(insertQuery, [paperId, moderatorId, status, comments]);
      const record = rows[0];

      // Recalculate paper status considering both paper-level and question-level moderation.
      await this.updatePaperStatus(paperId, client);

      // Insert log inside same transaction (atomic)
      const logQuery = `
        INSERT INTO logs (user_id, action, details)
        VALUES ($1, $2, $3)
      `;
      await client.query(logQuery, [moderatorId, "CLAIM_PAPER", JSON.stringify({ paperId, comments })]);

      await client.query("COMMIT");
      return record;
    } catch (err) {
      await client.query("ROLLBACK");
      // Rethrow so callers can map SQL errors (e.g. 23505 unique violation) to HTTP codes
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Get moderation records for a paper (with moderator name & paper title).
   */
  static async getByPaper(paperId) {
    const query = `
      SELECT pm.*, u.name as moderator_name, p.title as paper_title
      FROM paper_moderation pm
      LEFT JOIN users u ON pm.moderator_id = u.user_id
      LEFT JOIN question_papers p ON pm.paper_id = p.paper_id
      WHERE pm.paper_id = $1
      ORDER BY pm.reviewed_at DESC;
    `;
    const { rows } = await pool.query(query, [paperId]);
    return rows;
  }

  /**
   * Get moderation records claimed by moderator.
   */
  static async getByModerator(moderatorId) {
    const query = `
      SELECT pm.*, p.title as paper_title
      FROM paper_moderation pm
      LEFT JOIN question_papers p ON pm.paper_id = p.paper_id
      WHERE pm.moderator_id = $1
      ORDER BY pm.reviewed_at DESC;
    `;
    const { rows } = await pool.query(query, [moderatorId]);
    return rows;
  }

  /**
   * Update a moderation record's status (approve / reject).
   * Also writes a log entry inside the same transaction.
   */
  static async updateStatus(id, { status, comments = "" }) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const query = `
        UPDATE paper_moderation
        SET status = $1, comments = $2, reviewed_at = NOW()
        WHERE id = $3
        RETURNING id, paper_id, moderator_id, status, comments, reviewed_at;
      `;
      const { rows } = await client.query(query, [status, comments, id]);
      const record = rows[0];

      if (record) {
        await this.updatePaperStatus(record.paper_id, client);

        // Write audit log inside transaction
        const action = `PAPER_${status.toUpperCase()}`; // e.g. PAPER_APPROVED, PAPER_REJECTED
        const logQuery = `INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)`;
        await client.query(logQuery, [record.moderator_id, action, JSON.stringify({ paperId: record.paper_id, comments })]);
      }

      await client.query("COMMIT");
      return record;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }

  static approve(id, comments = "") {
    return this.updateStatus(id, { status: "approved", comments });
  }

  static reject(id, comments = "") {
    return this.updateStatus(id, { status: "rejected", comments });
  }

  /**
   * Determine the overall paper status based on both paper_moderation and question_moderation records.
   * Policy:
   *  - If any 'rejected' exists -> paper = 'rejected'
   *  - Else if any 'approved' exists -> paper = 'approved'
   *  - Else -> 'submitted'
   *
   * This function accepts an optional `client` so callers can run it inside an existing transaction.
   */
  static async updatePaperStatus(paperId, client = pool) {
    // client can be pool (default) or a pg Client
    const paperModsRes = await client.query("SELECT status FROM paper_moderation WHERE paper_id = $1", [paperId]);
    const questionModsRes = await client.query("SELECT status FROM question_moderation WHERE paper_id = $1", [paperId]);

    const allStatuses = [...paperModsRes.rows, ...questionModsRes.rows].map((r) => r.status);
    let newStatus = "submitted";

    if (allStatuses.includes("rejected")) newStatus = "rejected";
    else if (allStatuses.includes("approved")) newStatus = "approved";

    // Use QuestionPaper.update which already increments version in your model
    await QuestionPaper.update(paperId, { status: newStatus });

    return newStatus;
  }
}
