import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { pool } from "./config/db.js";
import fs from "fs";
import path from "path";

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

// ------------------- CORS Configuration -------------------
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'http://frontend:3000', // For Docker container communication
    process.env.FRONTEND_URL // If you set this environment variable
  ].filter(Boolean), // Remove any undefined values
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// ------------------- Ensure Uploads Directory Exists -------------------
const ensureUploadsDir = () => {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
  }
};

// Create uploads directory on startup
ensureUploadsDir();

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

// ------------------- Health Check Endpoint -------------------
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString()
  });
});

// DB test
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ------------------- Error Handling Middleware -------------------
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// ------------------- 404 Handler -------------------
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// ------------------- Server Start -------------------
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📁 Uploads directory: ${path.join(process.cwd(), 'uploads')}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;