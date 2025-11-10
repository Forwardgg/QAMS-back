// backend/seedAdmin.js
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { pool } from "./config/db.js";

// Force-load .env (so running "node backend/seedAdmin.js" always works)
dotenv.config({ path: ".env" });

const seedAdmin = async () => {
  try {
    // Admin details (change as needed)
    const email = "admin@example.com";
    const plainPassword = "password123"; // 👈 login password you will use
    const name = "Super Admin";

    // Debug: check DB config (don’t print real password)
    console.log("DB Config:", {
      user: process.env.PGUSER,
      host: process.env.PGHOST,
      database: process.env.PGDATABASE,
      password: process.env.PGPASSWORD ? "*****" : "MISSING",
    });

    // Hash password
    const passwordHash = await bcrypt.hash(plainPassword, 12);

    // Insert or update admin
    const query = `
      INSERT INTO users (name, email, password_hash, role, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          status = 'active',
          updated_at = NOW()
      RETURNING user_id, email, role, status;
    `;

    const values = [name, email.toLowerCase(), passwordHash, "admin"];
    const { rows } = await pool.query(query, values);

    console.log("✅ Admin seeded successfully:", rows[0]);
    console.log(`\nYou can now login with:\n  Email: ${email}\n  Password: ${plainPassword}`);
  } catch (err) {
    console.error("❌ Error seeding admin:", err.message);
  } finally {
    await pool.end(); // close DB pool
  }
};

// Run the seeder
seedAdmin();
