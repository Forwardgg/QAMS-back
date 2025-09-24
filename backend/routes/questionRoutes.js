// questionRoutes.js
import express from "express";
import { 
  addSubjective, 
  addMCQ, 
  getQuestionsByCourse, 
  getQuestionsByCO, 
  editQuestion, 
  deleteQuestion,
  getQuestionVersions 
} from "../controllers/QuestionController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Only instructors/admins can add questions
router.post("/subjective", authenticate, authorizeRoles("admin", "instructor"), addSubjective);
router.post("/mcq", authenticate, authorizeRoles("admin", "instructor"), addMCQ);

// Edit/Delete → only by owner (no need to restrict role, check is in controller)
router.put("/:questionId", authenticate, editQuestion);
router.delete("/:questionId", authenticate, deleteQuestion);

// Any logged-in user can fetch questions of a course
router.get("/course/:courseId", authenticate, getQuestionsByCourse);
router.get("/co/:coId", authenticate, getQuestionsByCO);
router.get("/:questionId/versions", authenticate, getQuestionVersions);

export default router;
