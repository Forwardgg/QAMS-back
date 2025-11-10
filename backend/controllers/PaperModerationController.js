import { pool } from "../config/db.js";
import { PaperModeration } from "../models/PaperModeration.js";
import { QuestionPaper } from "../models/QuestionPaper.js";

/**
 * Claim a paper for moderation
 * Validates role, paper status, and duplicate claims.
 */
export const claimPaperForModeration = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;
    const { comments = "" } = req.body || {}; // ✅ Prevent undefined req.body

    // Role validation
    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can claim papers" });
    }

    // Validate paper existence & status
    const paper = await QuestionPaper.getById(paperId);
    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }
    if (paper.status !== "submitted") {
      return res.status(400).json({ success: false, message: "Only submitted papers can be claimed" });
    }

    // Prevent duplicate claim by same moderator
    const { rowCount } = await pool.query(
      "SELECT 1 FROM paper_moderation WHERE paper_id=$1 AND moderator_id=$2 LIMIT 1",
      [paperId, user.user_id]
    );
    if (rowCount > 0) {
      return res.status(400).json({ success: false, message: "You already claimed this paper" });
    }

    // Create moderation claim (transaction handled inside model)
    const record = await PaperModeration.create({
      paperId,
      moderatorId: user.user_id,
      status: "pending",
      comments,
    });

    return res.status(201).json({ success: true, moderation: record });
  } catch (err) {
    // Handle DB race condition
    if (err.code === "23505") {
      return res.status(409).json({ success: false, message: "Paper already claimed by another moderator" });
    }
    console.error("Error claiming paper for moderation:", err);
    return res.status(500).json({ success: false, message: "Failed to claim paper" });
  }
};

/**
 * Get all moderation records for a paper
 */
export const getModerationForPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const moderations = await PaperModeration.getByPaper(paperId);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (err) {
    console.error("Error fetching paper moderation:", err);
    res.status(500).json({ success: false, message: "Failed to fetch moderation records" });
  }
};

/**
 * Get papers claimed by the current moderator
 */
export const getMyModerations = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can view this" });
    }

    const moderations = await PaperModeration.getByModerator(user.user_id);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (err) {
    console.error("Error fetching my moderations:", err);
    res.status(500).json({ success: false, message: "Failed to fetch your moderations" });
  }
};

/**
 * Approve a paper moderation record
 */
export const approvePaperModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { comments = "" } = req.body || {}; // ✅ Prevent undefined req.body

    // Validate role
    if (!["moderator", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Only moderator/admin can approve" });
    }

    // Validate ID
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Invalid moderation ID" });
    }

    const updated = await PaperModeration.approve(id, comments);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Moderation record not found" });
    }

    const paper = await QuestionPaper.getById(updated.paper_id);
    return res.json({ success: true, moderation: updated, paperStatus: paper.status });
  } catch (err) {
    console.error("Error approving paper:", err);
    return res.status(500).json({ success: false, message: "Failed to approve paper" });
  }
};

/**
 * Reject a paper moderation record
 */
export const rejectPaperModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { comments = "" } = req.body || {}; // ✅ Prevent undefined req.body

    // Validate role
    if (!["moderator", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Only moderator/admin can reject" });
    }

    // Validate ID
    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Invalid moderation ID" });
    }

    const updated = await PaperModeration.reject(id, comments);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Moderation record not found" });
    }

    const paper = await QuestionPaper.getById(updated.paper_id);
    return res.json({ success: true, moderation: updated, paperStatus: paper.status });
  } catch (err) {
    console.error("Error rejecting paper:", err);
    return res.status(500).json({ success: false, message: "Failed to reject paper" });
  }
};
