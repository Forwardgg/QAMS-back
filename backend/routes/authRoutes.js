// backend/routes/authRoutes.js
import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  deleteUser,
  forceDeleteUser,
} from "../controllers/AuthController.js";
import { validateRegister, validateLogin, authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", validateRegister, registerUser);
router.post("/login", validateLogin, loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Admin-only user management
router.delete("/users/:id", authenticate, authorizeRoles("admin"), deleteUser);
router.delete("/users/:id/force", authenticate, authorizeRoles("admin"), forceDeleteUser);

export default router;
