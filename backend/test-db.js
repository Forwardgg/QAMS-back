import { pool } from "./config/db.js";

const check = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Connected to Aiven! Time:", res.rows[0].now);
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  } finally {
    await pool.end();
  }
};

check();
