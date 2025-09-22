import express from "express";
import {
  reviewQuestion,
  getModerationByQuestion,
  getModerationByModerator
} from "../controllers/ModerationController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Only moderators/admins can review
router.post("/:questionId", authenticate, authorizeRoles("admin", "moderator"), reviewQuestion);

// Any logged-in user can see moderation history of a question
router.get("/question/:questionId", authenticate, getModerationByQuestion);

// Moderator can see their own moderation actions
router.get("/moderator/:moderatorId", authenticate, authorizeRoles("admin", "moderator"), getModerationByModerator);

export default router;
