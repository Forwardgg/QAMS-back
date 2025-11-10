import express from "express";
import {
  createPaper,
  getAllPapers,
  getPaperById,
  updatePaper,
  deletePaper,
  submitPaper,
  approvePaper,
  rejectPaper,
} from "../controllers/QuestionPaperController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Create paper (admin or instructor)
router.post("/", authenticate, authorizeRoles("admin", "instructor"), createPaper);

// Get papers
router.get("/", authenticate, getAllPapers);

// Get paper by ID
router.get("/:paperId", authenticate, getPaperById);

// Update paper
router.put("/:paperId", authenticate, authorizeRoles("admin", "instructor"), updatePaper);

// Delete paper
router.delete("/:paperId", authenticate, authorizeRoles("admin", "instructor"), deletePaper);

// Workflow
router.post("/:paperId/submit", authenticate, authorizeRoles("admin", "instructor"), submitPaper);
router.post("/:paperId/approve", authenticate, authorizeRoles("admin", "moderator"), approvePaper);
router.post("/:paperId/reject", authenticate, authorizeRoles("admin", "moderator"), rejectPaper);

export default router;
