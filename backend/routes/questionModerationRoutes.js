import express from "express";
import {
  claimQuestionForModeration,
  getModerationForPaperQuestions,
  getModerationForQuestion,
  getMyQuestionModerations,
  approveQuestionModeration,
  rejectQuestionModeration,
} from "../controllers/QuestionModerationController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/question-moderation/claim/:paperId/:questionId
 * @desc    Moderator claims a specific question within a paper for moderation
 * @access  Moderator
 */
router.post(
  "/claim/:paperId/:questionId",
  authenticate,
  authorizeRoles("moderator"),
  claimQuestionForModeration
);

/**
 * @route   GET /api/question-moderation/paper/:paperId
 * @desc    Get all question moderation records for a specific paper
 * @access  Admin, Instructor, Moderator
 */
router.get(
  "/paper/:paperId",
  authenticate,
  authorizeRoles("admin", "instructor", "moderator"),
  getModerationForPaperQuestions
);

/**
 * @route   GET /api/question-moderation/question/:questionId
 * @desc    Get all moderation records for a single question
 * @access  Admin, Instructor, Moderator
 */
router.get(
  "/question/:questionId",
  authenticate,
  authorizeRoles("admin", "instructor", "moderator"),
  getModerationForQuestion
);

/**
 * @route   GET /api/question-moderation/my
 * @desc    Get all question moderations claimed by the current moderator
 * @access  Moderator
 */
router.get(
  "/my",
  authenticate,
  authorizeRoles("moderator"),
  getMyQuestionModerations
);

/**
 * @route   PATCH /api/question-moderation/:id/approve
 * @desc    Approve a question moderation record
 * @access  Moderator, Admin
 */
router.patch(
  "/:id/approve",
  authenticate,
  authorizeRoles("moderator", "admin"),
  approveQuestionModeration
);

/**
 * @route   PATCH /api/question-moderation/:id/reject
 * @desc    Reject a question moderation record
 * @access  Moderator, Admin
 */
router.patch(
  "/:id/reject",
  authenticate,
  authorizeRoles("moderator", "admin"),
  rejectQuestionModeration
);

export default router;
