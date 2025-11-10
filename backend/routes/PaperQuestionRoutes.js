// routes/paperQuestionRoutes.js
import express from "express";
import {
  addQuestionToPaper,
  getQuestionsInPaper,
  updatePaperQuestion,
  removeQuestionFromPaper,
  reorderPaperQuestions,
  bulkAddQuestionsToPaper
} from "../controllers/PaperQuestionController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// ------------------- CREATE -------------------

// Bulk add questions to paper (⚠️ must come before single add)
router.post(
  "/:paperId/bulk",
  authenticate,
  authorizeRoles("admin", "instructor"),
  bulkAddQuestionsToPaper
);

// Add single question to paper
router.post(
  "/:paperId/:questionId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  addQuestionToPaper
);

// ------------------- READ -------------------

// Get all questions in a paper
// If students shouldn't see this, add authorizeRoles("admin","instructor","moderator")
router.get("/:paperId", authenticate, getQuestionsInPaper);

// ------------------- UPDATE -------------------

// Update marks/sequence/section of a mapping
router.put(
  "/:pqId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  updatePaperQuestion
);

// Reorder all questions in a paper
router.put(
  "/:paperId/reorder",
  authenticate,
  authorizeRoles("admin", "instructor"),
  reorderPaperQuestions
);

// ------------------- DELETE -------------------

// Remove a question from a paper
router.delete(
  "/:pqId",
  authenticate,
  authorizeRoles("admin", "instructor"),
  removeQuestionFromPaper
);

export default router;
