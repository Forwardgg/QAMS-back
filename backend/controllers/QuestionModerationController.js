import { QuestionModeration } from "../models/QuestionModeration.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Log } from "../models/Log.js";

/**
 * Claim a specific question for moderation
 * Handles:
 *  - Role validation
 *  - Paper existence and status check
 *  - Duplicate claim prevention
 *  - Structured logging
 */
export const claimQuestionForModeration = async (req, res) => {
  try {
    const { paperId, questionId } = req.params;
    const user = req.user;
    const { comments = "" } = req.body || {};

    // 🧩 Role check
    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can claim questions" });
    }

    // 🧩 Paper existence + status validation
    const paper = await QuestionPaper.getById(paperId);
    if (!paper) {
      return res.status(404).json({ success: false, message: "Paper not found" });
    }
    if (!["submitted", "approved"].includes(paper.status)) {
      return res.status(400).json({ success: false, message: "Only submitted or approved papers can be moderated" });
    }

    // 🧩 Prevent duplicate claim (same moderator-question)
    const existing = await QuestionModeration.getByQuestion(questionId);
    if (existing.some((r) => r.moderator_id === user.user_id)) {
      return res.status(400).json({ success: false, message: "You already claimed this question" });
    }

    // 🧩 Create moderation record
    const record = await QuestionModeration.create({
      paperId,
      questionId,
      moderatorId: user.user_id,
      status: "pending",
      comments,
    });

    // 🧾 Log claim action
    await Log.create({
      userId: user.user_id,
      action: "CLAIM_QUESTION",
      details: { paperId, questionId, comments },
    });

    return res.status(201).json({ success: true, moderation: record });
  } catch (err) {
    console.error("Error claiming question for moderation:", err);
    return res.status(500).json({ success: false, message: "Failed to claim question for moderation" });
  }
};

/**
 * Fetch all question-level moderation records for a paper
 */
export const getModerationForPaperQuestions = async (req, res) => {
  try {
    const { paperId } = req.params;
    const moderations = await QuestionModeration.getByPaper(paperId);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (err) {
    console.error("Error fetching question moderation by paper:", err);
    res.status(500).json({ success: false, message: "Failed to fetch question moderation" });
  }
};

/**
 * Fetch all moderation records for a single question
 */
export const getModerationForQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const moderations = await QuestionModeration.getByQuestion(questionId);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (err) {
    console.error("Error fetching moderation for question:", err);
    res.status(500).json({ success: false, message: "Failed to fetch moderation for question" });
  }
};

/**
 * Fetch all question moderations claimed by the current moderator
 */
export const getMyQuestionModerations = async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "moderator") {
      return res.status(403).json({ success: false, message: "Only moderators can view this" });
    }

    const moderations = await QuestionModeration.getByModerator(user.user_id);
    res.json({ success: true, total: moderations.length, moderations });
  } catch (err) {
    console.error("Error fetching my question moderations:", err);
    res.status(500).json({ success: false, message: "Failed to fetch your question moderations" });
  }
};

/**
 * Approve a question moderation record
 * Handles:
 *  - Role validation
 *  - Transactional update (in model)
 *  - Structured logging
 */
export const approveQuestionModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { comments = "" } = req.body || {};

    if (!["moderator", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Only moderator/admin can approve questions" });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Invalid moderation ID" });
    }

    const updated = await QuestionModeration.approve(id, comments);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Moderation record not found" });
    }

    await Log.create({
      userId: user.user_id,
      action: "APPROVE_QUESTION",
      details: { moderationId: id, paperId: updated.paper_id, questionId: updated.question_id, comments },
    });

    res.json({ success: true, moderation: updated });
  } catch (err) {
    console.error("Error approving question moderation:", err);
    res.status(500).json({ success: false, message: "Failed to approve question" });
  }
};

/**
 * Reject a question moderation record
 */
export const rejectQuestionModeration = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { comments = "" } = req.body || {};

    if (!["moderator", "admin"].includes(user.role)) {
      return res.status(403).json({ success: false, message: "Only moderator/admin can reject questions" });
    }

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({ success: false, message: "Invalid moderation ID" });
    }

    const updated = await QuestionModeration.reject(id, comments);
    if (!updated) {
      return res.status(404).json({ success: false, message: "Moderation record not found" });
    }

    await Log.create({
      userId: user.user_id,
      action: "REJECT_QUESTION",
      details: { moderationId: id, paperId: updated.paper_id, questionId: updated.question_id, comments },
    });

    res.json({ success: true, moderation: updated });
  } catch (err) {
    console.error("Error rejecting question moderation:", err);
    res.status(500).json({ success: false, message: "Failed to reject question" });
  }
};
