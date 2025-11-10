import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./config/db.js";

// Routers
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import coRoutes from "./routes/coRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import questionPaperRoutes from "./routes/QuestionPaperRoutes.js";
import paperQuestionRoutes from "./routes/PaperQuestionRoutes.js";
import paperModerationRoutes from "./routes/paperModerationRoutes.js";
import questionModerationRoutes from "./routes/questionModerationRoutes.js";
import logRoutes from "./routes/logRoutes.js";
// import exportRoutes from "./routes/exportRoutes.js";
// import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ------------------- API ROUTES -------------------
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/cos", coRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/papers", questionPaperRoutes);
app.use("/api/paper-questions", paperQuestionRoutes);
app.use("/api/paper-moderation", paperModerationRoutes);
app.use("/api/question-moderation", questionModerationRoutes);
app.use("/api/logs", logRoutes);
// app.use("/api/export", exportRoutes);
// app.use("/api/report", reportRoutes);

// DB test
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// server start
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
}

export default app; // allows Jest/Supertest to import the app
