// routes/questionRoutes.js
import express from "express";
import {
  addSubjectiveQuestion,
  addMCQQuestion,
  getQuestionsForPaper,
  getQuestionsForCourse,
  getQuestionsForCourseAndPaper,
  updateQuestion,
  deleteQuestion,
} from "../controllers/QuestionController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Add subjective question (with optional media)
router.post(
  "/subjective/:courseId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  addSubjectiveQuestion
);

// Add MCQ question (with options + optional media)
router.post(
  "/mcq/:courseId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  addMCQQuestion
);

// Get all questions for a paper
router.get("/paper/:paperId", getQuestionsForPaper);

// Get all questions for a course
router.get("/course/:courseId", getQuestionsForCourse);

// Get questions for a specific course & paper
router.get("/course/:courseId/paper/:paperId", getQuestionsForCourseAndPaper);

// Update question (content, CO, options, media)
router.put(
  "/:questionId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  updateQuestion
);

// Soft delete question (and hard delete media)
router.delete(
  "/:questionId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  deleteQuestion
);

export default router;
