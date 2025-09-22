import express from "express";
import { addSubjective, addMCQ, getQuestionsByCourse, getQuestionsByCO } from "../controllers/QuestionController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Only instructors/admins can add questions
router.post("/subjective", authenticate, authorizeRoles("admin", "instructor"), addSubjective);
router.post("/mcq", authenticate, authorizeRoles("admin", "instructor"), addMCQ);

// Any logged-in user can fetch questions of a course
router.get("/course/:courseId", authenticate, getQuestionsByCourse);
router.get("/co/:coId", authenticate, getQuestionsByCO);

export default router;
