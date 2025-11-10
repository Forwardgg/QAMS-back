import bcrypt from "bcrypt";
import { User } from "../models/User.js";
import { Log } from "../models/Log.js";

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const existing = await User.findByEmail(email);
    if (existing) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, passwordHash: hashedPassword, role });

    await Log.create({
      userId: req.user?.user_id || null, // system/admin
      action: "CREATE_USER",
      details: `User ${newUser.user_id} (${role}) created`,
    });

    res.status(201).json({ message: "User created", user: newUser });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message });
  }
};
export const getTotalUsers = async (req, res) => {
  try {
    const users = await User.getAll();
    res.json({ total_users: users.length });
  } catch (err) {
    console.error("Error getting total users:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const getUserCountsByRole = async (req, res) => {
  try {
    const users = await User.getAll();
    const counts = { admin: 0, instructor: 0, moderator: 0 };
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    res.json(counts);
  } catch (err) {
    console.error("Error fetching user counts:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const getTotalInstructors = async (req, res) => {
  try {
    const users = await User.getAll();
    const total = users.filter((u) => u.role === "instructor").length;
    res.json({ total_instructors: total });
  } catch (err) {
    console.error("Error fetching instructors:", err);
    res.status(500).json({ error: "Server error" });
  }
};
export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updated = await User.updateStatus(userId, "inactive");
    if (!updated) return res.status(404).json({ error: "User not found" });

    await Log.create({
      userId: req.user.user_id,
      action: "DEACTIVATE_USER",
      details: `User ${userId} deactivated`,
    });

    res.json({ message: "User deactivated successfully", user: updated });
  } catch (err) {
    console.error("Error deactivating user:", err);
    res.status(500).json({ error: err.message });
  }
};
export const activateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updated = await User.updateStatus(userId, "active");
    if (!updated) return res.status(404).json({ error: "User not found" });

    await Log.create({
      userId: req.user.user_id,
      action: "ACTIVATE_USER",
      details: `User ${userId} activated`,
    });

    res.json({ message: "User activated successfully", user: updated });
  } catch (err) {
    console.error("Error activating user:", err);
    res.status(500).json({ error: err.message });
  }
};
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, role, status } = req.body;

    const existing = await User.findById(userId);
    if (!existing) return res.status(404).json({ error: "User not found" });

    let updated;
    if (status) {
      updated = await User.updateStatus(userId, status);
    } else {
      updated = await User.updateProfile(userId, { name, email, role });
    }

    await Log.create({
      userId: req.user.user_id,
      action: "UPDATE_USER",
      details: `User ${userId} updated`,
    });

    res.json({ message: "User updated", user: updated });
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: err.message });
  }
};
export const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const updated = await User.updatePassword(userId, hashed);
    if (!updated) return res.status(404).json({ error: "User not found" });

    await Log.create({
      userId: req.user.user_id,
      action: "UPDATE_USER_PASSWORD",
      details: `Password updated for user ${userId}`,
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating password:", err);
    res.status(500).json({ error: err.message });
  }
};
