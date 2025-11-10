import express from "express";
import {
  claimPaperForModeration,
  getModerationForPaper,
  getMyModerations,
  approvePaperModeration,
  rejectPaperModeration,
} from "../controllers/PaperModerationController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Moderator claims a paper for moderation
router.post(
  "/claim/:paperId",
  authenticate,
  authorizeRoles("moderator"),
  claimPaperForModeration
);

// Get all moderation records for a specific paper
router.get(
  "/paper/:paperId",
  authenticate,
  authorizeRoles("admin", "instructor", "moderator"),
  getModerationForPaper
);

// Get papers claimed by the current moderator
router.get(
  "/my",
  authenticate,
  authorizeRoles("moderator"),
  getMyModerations
);

// Approve a paper moderation record
router.patch(
  "/:id/approve",
  authenticate,
  authorizeRoles("moderator", "admin"),
  approvePaperModeration
);

// Reject a paper moderation record
router.patch(
  "/:id/reject",
  authenticate,
  authorizeRoles("moderator", "admin"),
  rejectPaperModeration
);

export default router;
