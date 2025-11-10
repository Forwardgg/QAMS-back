// backend/controllers/PaperQuestionController.js
import { PaperQuestion } from "../models/PaperQuestion.js";
import { QuestionPaper } from "../models/QuestionPaper.js";
import { Log } from "../models/Log.js";

// Helper: check paper ownership and role-based access
const checkPaperAccess = async (paperId, user) => {
  const paper = await QuestionPaper.getById(paperId);
  if (!paper) throw new Error("Paper not found");

  if (user.role === "instructor" && paper.instructor_id !== user.user_id) {
    throw new Error("Not authorized");
  }

  return paper;
};
export const addQuestionToPaper = async (req, res) => {
  try {
    const { paperId, questionId } = req.params;
    const { sequence, marks, section } = req.body;
    const user = req.user;

    await checkPaperAccess(paperId, user);

    const added = await PaperQuestion.add({ paperId, questionId, sequence, marks, section });

    await Log.create({
      userId: user.user_id,
      action: "ADD_QUESTION_TO_PAPER",
      details: `User ${user.user_id} added question ${questionId} to paper ${paperId}`
    });

    res.status(201).json({ success: true, data: added });
  } catch (error) {
    console.error("Error adding question to paper:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes("already exists")) {
      return res.status(409).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Failed to add question to paper" });
  }
};
export const getQuestionsInPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    await checkPaperAccess(paperId, user);

    const questions = await PaperQuestion.getByPaper(paperId);
    res.json({ success: true, total: questions.length, data: questions });
  } catch (error) {
    console.error("Error fetching paper questions:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Failed to fetch paper questions" });
  }
};
export const updatePaperQuestion = async (req, res) => {
  try {
    const { pqId } = req.params;
    const { sequence, marks, section } = req.body;
    const user = req.user;

    const pq = await PaperQuestion.getById(pqId);
    if (!pq) return res.status(404).json({ success: false, message: "PaperQuestion not found" });

    await checkPaperAccess(pq.paper_id, user);

    const updated = await PaperQuestion.update(pqId, { sequence, marks, section });

    await Log.create({
      userId: user.user_id,
      action: "UPDATE_PAPER_QUESTION",
      details: `User ${user.user_id} updated paper_question ${pqId}`
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating paper question:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Failed to update paper question" });
  }
};
export const removeQuestionFromPaper = async (req, res) => {
  try {
    const { pqId } = req.params;
    const user = req.user;

    const pq = await PaperQuestion.getById(pqId);
    if (!pq) return res.status(404).json({ success: false, message: "PaperQuestion not found" });

    await checkPaperAccess(pq.paper_id, user);

    await PaperQuestion.remove(pqId);
    await PaperQuestion.reorder(pq.paper_id);

    await Log.create({
      userId: user.user_id,
      action: "REMOVE_QUESTION_FROM_PAPER",
      details: `User ${user.user_id} removed paper_question ${pqId} from paper ${pq.paper_id}`
    });

    res.json({ success: true, message: "Question removed from paper and sequence reordered" });
  } catch (error) {
    console.error("Error removing question from paper:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Failed to remove question from paper" });
  }
};
export const reorderPaperQuestions = async (req, res) => {
  try {
    const { paperId } = req.params;
    const user = req.user;

    await checkPaperAccess(paperId, user);

    const reordered = await PaperQuestion.reorder(paperId);

    await Log.create({
      userId: user.user_id,
      action: "REORDER_PAPER_QUESTIONS",
      details: `User ${user.user_id} reordered questions in paper ${paperId}`
    });

    res.json({ success: true, total: reordered.length, data: reordered });
  } catch (error) {
    console.error("Error reordering paper questions:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Failed to reorder paper questions" });
  }
};
export const bulkAddQuestionsToPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { questions } = req.body;
    const user = req.user;

    await checkPaperAccess(paperId, user);

    const added = await PaperQuestion.bulkAdd(paperId, questions);

    await Log.create({
      userId: user.user_id,
      action: "BULK_ADD_QUESTIONS_TO_PAPER",
      details: `User ${user.user_id} added ${added.length} questions to paper ${paperId}`
    });

    res.status(201).json({ success: true, total: added.length, data: added });
  } catch (error) {
    console.error("Error bulk adding questions to paper:", error);

    if (error.message.includes("not found")) {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message.includes("already exists")) {
      return res.status(409).json({ success: false, message: error.message });
    }

    res.status(500).json({ success: false, message: "Failed to bulk add questions to paper" });
  }
};
