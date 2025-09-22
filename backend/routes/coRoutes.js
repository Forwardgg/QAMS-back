import express from "express";
import { addCO, getCOsByCourse } from "../controllers/coController.js";
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

export default router;