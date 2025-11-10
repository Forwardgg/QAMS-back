// models/User.js
import { pool } from "../config/db.js";

export class User {
  static allowedRoles = ["admin", "instructor", "moderator"];
  static allowedStatuses = ["active", "inactive"];

  // Expects passwordHash (string) and role already normalized (lowercase)
  static async create({ name, email, passwordHash, role }) {
    if (!this.allowedRoles.includes(role)) {
      throw new Error(`Invalid role. Allowed: ${this.allowedRoles.join(", ")}`);
    }

    const query = `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, LOWER($2), $3, $4)
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const values = [name, email.toLowerCase(), passwordHash, role];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  static async findByEmail(email) {
    const query = `
      SELECT * FROM users 
      WHERE LOWER(email) = LOWER($1) 
      LIMIT 1;
    `;
    const { rows } = await pool.query(query, [email.toLowerCase()]);
    return rows[0];
  }
  static async findById(userId) {
    const query = `
      SELECT * FROM users 
      WHERE user_id = $1;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  }
  static async getAll() {
    const query = `
      SELECT user_id, name, email, role, status, created_at, updated_at
      FROM users;
    `;
    const { rows } = await pool.query(query);
    return rows;
  }
  static async updateStatus(userId, status) {
    if (!this.allowedStatuses.includes(status)) {
      throw new Error(`Invalid status. Allowed: ${this.allowedStatuses.join(", ")}`);
    }

    const query = `
      UPDATE users 
      SET status = $1,
          updated_at = NOW()
      WHERE user_id = $2 
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const { rows } = await pool.query(query, [status, userId]);
    return rows[0];
  }
  static async updateProfile(userId, { name, email, role }) {
    let roleNormalized = null;

    if (role) {
      roleNormalized = role.toLowerCase();
      if (!this.allowedRoles.includes(roleNormalized)) {
        throw new Error(`Invalid role. Allowed: ${this.allowedRoles.join(", ")}`);
      }
    }

    const query = `
      UPDATE users
      SET name = COALESCE($1, name),
          email = COALESCE(LOWER($2), email),
          role = COALESCE($3, role),
          updated_at = NOW()
      WHERE user_id = $4
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const values = [
      name || null,
      email ? email.toLowerCase() : null,
      roleNormalized || null,
      userId,
    ];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
  static async updatePassword(userId, passwordHash) {
    const query = `
      UPDATE users
      SET password_hash = $1,
          updated_at = NOW()
      WHERE user_id = $2
      RETURNING user_id, name, email, role, status, created_at, updated_at;
    `;
    const { rows } = await pool.query(query, [passwordHash, userId]);
    return rows[0];
  }
  // Soft delete (normal use)
  static async softDelete(userId) {
    const query = `
      UPDATE users
      SET status = 'inactive',
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING user_id, status, updated_at;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  }
  // Hard delete (admin-only)
  static async forceDelete(userId) {
    const query = `
      DELETE FROM users 
      WHERE user_id = $1
      RETURNING user_id;
    `;
    const { rows } = await pool.query(query, [userId]);
    return rows[0];
  }
}
