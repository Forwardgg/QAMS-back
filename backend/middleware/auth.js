// backend/middleware/auth.js
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

//JWT Middleware
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const [scheme, token] = parts;
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    // Fetch user from DB to check status/revocation
    const user = await User.findById(decoded.user_id);
    if (!user || user.status !== "active") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach safe user info to request
    req.user = { user_id: user.user_id, role: user.role };
    next();
  } catch (err) {
    console.error("Auth error:", err.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
//Role-based Authorization
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
// Validation Middleware
export const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters long" });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  // Normalize role and validate
  const roleNormalized = role.toLowerCase();
  if (!["instructor", "moderator"].includes(roleNormalized)) {
    return res
      .status(400)
      .json({ error: "Invalid role. Allowed: instructor, moderator" });
  }

  // Overwrite request body with normalized role so downstream code is consistent
  req.body.role = roleNormalized;

  next();
};
export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ error: "Email and password are required" });
  }

  next();
};
