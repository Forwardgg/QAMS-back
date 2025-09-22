// AuthController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role",
      [name, email, hashed, role]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "User not found" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid password" });

    // Generate JWT
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Log the login action
    await pool.query(
      "INSERT INTO logs (user_id, action, details) VALUES ($1, $2, $3)",
      [user.user_id, "LOGIN", `${user.role} ${user.user_id} logged in`]
    );

    res.json({
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
