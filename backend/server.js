import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import courseRoutes from "./routes/courseRoutes.js";
import coRoutes from "./routes/coRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import moderationRoutes from "./routes/moderationRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/cos", coRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/moderation", moderationRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/report", reportRoutes);

// Test DB
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app; // 👈 allow Jest/Supertest to import the app
