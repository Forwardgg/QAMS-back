// backend/controllers/AuthController.js
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { Log } from "../models/Log.js";

const allowedRoles = ["instructor", "moderator"];
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const roleNormalized = role.toLowerCase();
    if (!allowedRoles.includes(roleNormalized)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ name, email, passwordHash, role: roleNormalized });

    await Log.create({
      userId: user.user_id,
      action: "REGISTER",
      details: `${user.role} ${user.user_id} registered`,
    });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256" }
    );

    res.json({
      tokenType: "Bearer",
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Server error during registration" });
  }
};
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findByEmail(email);
    if (!user || user.status !== "active") {
      await Log.create({
        userId: user ? user.user_id : null,
        action: "FAILED_LOGIN",
        details: `Failed login attempt with email ${email}`,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      await Log.create({
        userId: user.user_id,
        action: "FAILED_LOGIN",
        details: `Wrong password for email ${email}`,
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN, algorithm: "HS256" }
    );

    await Log.create({
      userId: user.user_id,
      action: "LOGIN",
      details: `${user.role} ${user.user_id} logged in`,
    });

    res.json({
      tokenType: "Bearer",
      token,
      user: { id: user.user_id, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error during login" });
  }
};
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(200).json({ message: "If email exists, reset link sent" });
    }

    const resetToken = jwt.sign(
      { user_id: user.user_id },
      process.env.JWT_RESET_SECRET,
      { expiresIn: process.env.JWT_RESET_EXPIRES_IN || "15m", algorithm: "HS256" }
    );

    const resetLink = `${process.env.FRONTEND_URL || 'https://your-frontend.com'}/reset-password?token=${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetLink}`); // temp
    await Log.create({
      userId: user.user_id,
      action: "FORGOT_PASSWORD",
      details: `Password reset requested for ${email}`,
    });

    res.status(200).json({ message: "If email exists, reset link sent" });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.status(500).json({ error: "Server error during password reset request" });
  }
};
export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_RESET_SECRET, {
        algorithms: ["HS256"],
      });
    } catch (err) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long" });
    }

    const passwordHash = await bcrypt.hash(
      newPassword,
      parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12
    );

    await User.updatePassword(decoded.user_id, passwordHash);

    await Log.create({
      userId: decoded.user_id,
      action: "RESET_PASSWORD",
      details: `Password reset successfully`,
    });

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err.message);
    res.status(500).json({ error: "Server error during password reset" });
  }
};
// soft delete
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.softDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Log.create({
      userId: req.user.user_id,
      action: "SOFT_DELETE_USER",
      details: `User ${id} set to inactive`,
    });

    res.json({ message: "User deactivated successfully", user });
  } catch (err) {
    console.error("Soft delete error:", err.message);
    res.status(500).json({ error: "Server error during soft delete" });
  }
};
// hard delete with cascade
export const forceDeleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.forceDelete(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Log.create({
      userId: req.user.user_id,
      action: "FORCE_DELETE_USER",
      details: `User ${id} permanently deleted (cascade)`,
    });

    res.json({ message: "User permanently deleted" });
  } catch (err) {
    console.error("Force delete error:", err.message);
    res.status(500).json({ error: "Server error during force delete" });
  }
};
