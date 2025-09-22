// coRoutes.js
import express from "express";
import { addCO, getCOsByCourse, updateCO, deleteCO, getCOById } from "../controllers/coController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Instructors/Admins can define COs
router.post(
  "/:courseId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  addCO
);

// Any logged-in user can view COs of a course
router.get("/:courseId", authenticate, getCOsByCourse);

// Any logged-in user can view a single CO
router.get("/single/:coId", authenticate, getCOById);

// Update CO
router.put("/:coId", authenticate, authorizeRoles("admin", "instructor"), updateCO);

// Delete CO
router.delete("/:coId", authenticate, authorizeRoles("admin", "instructor"), deleteCO);

export default router;