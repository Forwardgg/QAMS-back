import express from "express";
import {
  createUser,
  getAllUsers,
  getTotalUsers,
  getUserCountsByRole,
  getTotalInstructors,
  deactivateUser,
  activateUser,
  updateUser,
  updateUserPassword,
} from "../controllers/UserController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ------------------- ADMIN ONLY -------------------

// Create a new user (admin only)
router.post("/", authenticate, authorizeRoles("admin"), createUser);

// Get all users
router.get("/", authenticate, authorizeRoles("admin"), getAllUsers);

// Get total user count
router.get("/stats/total", authenticate, authorizeRoles("admin"), getTotalUsers);

// Get user counts by role
router.get("/stats/roles", authenticate, authorizeRoles("admin"), getUserCountsByRole);

// Get total instructors
router.get("/stats/instructors", authenticate, authorizeRoles("admin"), getTotalInstructors);

// Deactivate user
router.patch("/:userId/deactivate", authenticate, authorizeRoles("admin"), deactivateUser);

// Activate user
router.patch("/:userId/activate", authenticate, authorizeRoles("admin"), activateUser);

// Update user (name/email/role/status)
router.put("/:userId", authenticate, authorizeRoles("admin"), updateUser);

// Update user password (admin can reset for any user)
router.patch("/:userId/password", authenticate, authorizeRoles("admin"), updateUserPassword);

//  SELF SERVICE 

// A user updates their own password
router.patch("/me/password", authenticate, async (req, res, next) => {
  try {
    req.params.userId = req.user.user_id; // set userId to current logged-in user
    return updateUserPassword(req, res, next);
  } catch (err) {
    console.error("Error updating own password:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
