import { pool } from "../config/db.js";
import { Question } from "../models/Question.js";
import { Option } from "../models/Option.js";
import { Course } from "../models/Course.js";
import { QuestionMedia } from "../models/QuestionMedia.js";
import { Log } from "../models/Log.js"; // ✅ added logging

// Utility to attach options + media
const attachExtras = async (questions) => {
  if (!questions.length) return [];

  const questionIds = questions.map((q) => q.question_id);

  // Batch fetch options for all MCQs
  const { rows: allOptions } = await pool.query(
    `SELECT option_id, question_id, option_text, is_correct
     FROM options
     WHERE question_id = ANY($1)
     ORDER BY option_id;`,
    [questionIds]
  );

  // Batch fetch media for all questions
  const { rows: allMedia } = await pool.query(
    `SELECT id, question_id, media_url, caption
     FROM question_media
     WHERE question_id = ANY($1)
     ORDER BY id;`,
    [questionIds]
  );

  // Group
  const optionsByQ = {};
  allOptions.forEach((opt) => {
    if (!optionsByQ[opt.question_id]) optionsByQ[opt.question_id] = [];
    optionsByQ[opt.question_id].push(opt);
  });

  const mediaByQ = {};
  allMedia.forEach((m) => {
    if (!mediaByQ[m.question_id]) mediaByQ[m.question_id] = [];
    mediaByQ[m.question_id].push(m);
  });

  // Attach
  return questions.map((q) => ({
    ...q,
    options: q.question_type === "mcq" ? optionsByQ[q.question_id] || [] : [],
    media: mediaByQ[q.question_id] || [],
  }));
};
export const addSubjectiveQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, coId, media = [] } = req.body;
    const user = req.user;

    if (!content || content.trim() === "") {
      return res.status(400).json({ success: false, message: "Question content is required" });
    }

    const course = await Course.getById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const question = await Question.create({
      courseId,
      authorId: user.user_id,
      questionType: "subjective",
      content,
      coId,
    });

    const mediaResults = [];
    for (const m of media) {
      const savedMedia = await QuestionMedia.create({
        questionId: question.question_id,
        mediaUrl: m.mediaUrl,
        caption: m.caption || "",
      });
      mediaResults.push(savedMedia);
    }

    question.options = [];
    question.media = mediaResults;

    await Log.create({
      userId: user.user_id,
      action: "ADD_QUESTION",
      details: `Added subjective question ${question.question_id} to course ${courseId}`,
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error("Error adding subjective question:", error);
    res.status(500).json({ success: false, message: "Failed to add question" });
  }
};
export const addMCQQuestion = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { content, coId, options, media = [] } = req.body;
    const user = req.user;

    const course = await Course.getById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ success: false, message: "MCQ must have at least 2 options" });
    }
    if (!options.some((o) => o.isCorrect)) {
      return res.status(400).json({ success: false, message: "MCQ must have at least 1 correct option" });
    }

    const question = await Question.create({
      courseId,
      authorId: user.user_id,
      questionType: "mcq",
      content,
      coId,
    });

    const optionResults = [];
    for (const opt of options) {
      const savedOption = await Option.create({
        questionId: question.question_id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
      });
      optionResults.push(savedOption);
    }

    const mediaResults = [];
    for (const m of media) {
      const savedMedia = await QuestionMedia.create({
        questionId: question.question_id,
        mediaUrl: m.mediaUrl,
        caption: m.caption || "",
      });
      mediaResults.push(savedMedia);
    }

    question.options = optionResults;
    question.media = mediaResults;

    await Log.create({
      userId: user.user_id,
      action: "ADD_QUESTION",
      details: `Added MCQ question ${question.question_id} to course ${courseId}`,
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error("Error adding MCQ question:", error);
    res.status(500).json({ success: false, message: "Failed to add MCQ question" });
  }
};
export const getQuestionsForPaper = async (req, res) => {
  try {
    const { paperId } = req.params;
    const { rows } = await pool.query(
      `SELECT pq.paper_id, q.*, co.co_number
       FROM paper_questions pq
       JOIN questions q ON pq.question_id = q.question_id
       LEFT JOIN course_outcomes co ON q.co_id = co.co_id
       WHERE pq.paper_id = $1 AND q.is_active = true
       ORDER BY pq.sequence;`,
      [paperId]
    );

    const questions = await attachExtras(rows);
    res.json({ success: true, total: questions.length, data: questions });
  } catch (error) {
    console.error("Error fetching paper questions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch paper questions" });
  }
};
export const getQuestionsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const questions = await Question.getByCourse(courseId);
    const withExtras = await attachExtras(questions);
    res.json({ success: true, total: withExtras.length, data: withExtras });
  } catch (error) {
    console.error("Error fetching course questions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course questions" });
  }
};
export const getQuestionsForCourseAndPaper = async (req, res) => {
  try {
    const { courseId, paperId } = req.params;
    const { rows } = await pool.query(
      `SELECT q.*, co.co_number, pq.paper_id
       FROM paper_questions pq
       JOIN questions q ON pq.question_id = q.question_id
       LEFT JOIN course_outcomes co ON q.co_id = co.co_id
       WHERE q.course_id = $1 AND pq.paper_id = $2 AND q.is_active = true
       ORDER BY pq.sequence;`,
      [courseId, paperId]
    );

    const withExtras = await attachExtras(rows);
    res.json({ success: true, total: withExtras.length, data: withExtras });
  } catch (error) {
    console.error("Error fetching course+paper questions:", error);
    res.status(500).json({ success: false, message: "Failed to fetch course+paper questions" });
  }
};
export const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { content, coId, options, media } = req.body;
    const user = req.user;

    const question = await Question.getById(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    if (user.role === "instructor" && question.author_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const updated = await Question.update(questionId, { content, coId });

    let updatedOptions = [];
    if (question.question_type === "mcq" && Array.isArray(options)) {
      if (options.length < 2) {
        return res.status(400).json({ success: false, message: "MCQ must have at least 2 options" });
      }
      if (!options.some((o) => o.isCorrect)) {
        return res.status(400).json({ success: false, message: "MCQ must have at least 1 correct option" });
      }

      await Option.deleteByQuestion(questionId);
      for (const opt of options) {
        const savedOpt = await Option.create({
          questionId,
          optionText: opt.optionText,
          isCorrect: opt.isCorrect,
        });
        updatedOptions.push(savedOpt);
      }
    }

    let updatedMedia = [];
    if (Array.isArray(media)) {
      await QuestionMedia.deleteByQuestion(questionId);
      for (const m of media) {
        const savedMedia = await QuestionMedia.create({
          questionId,
          mediaUrl: m.mediaUrl,
          caption: m.caption || "",
        });
        updatedMedia.push(savedMedia);
      }
    }

    updated.options = updatedOptions;
    updated.media = updatedMedia;

    await Log.create({
      userId: user.user_id,
      action: "UPDATE_QUESTION",
      details: `Updated question ${questionId}`,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ success: false, message: "Failed to update question" });
  }
};
export const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const user = req.user;

    const question = await Question.getById(questionId);
    if (!question) return res.status(404).json({ success: false, message: "Question not found" });

    if (user.role === "instructor" && question.author_id !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Question.softDelete(questionId);

    // Clean up children
    await QuestionMedia.deleteByQuestion(questionId);
    await Option.deleteByQuestion(questionId);

    await Log.create({
      userId: user.user_id,
      action: "DELETE_QUESTION",
      details: `Deleted question ${questionId}`,
    });

    res.json({ success: true, message: "Question deleted" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ success: false, message: "Failed to delete question" });
  }
};
