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

// CORS configuration
app.use(cors({
  origin: "*", // Allow all origins for now
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Root route - improved
app.get("/", (req, res) => {
  res.json({ 
    message: "QAMS Backend API is running! 🚀", 
    version: "1.0.0",
    status: "active",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/health",
      "/api/test", 
      "/api/auth",
      "/api/users",
      "/api/courses",
      "/api/questions"
    ]
  });
});

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    message: "Server is running smoothly",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// DB test route
app.get("/api/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ 
      success: true,
      database: "Connected ✅",
      time: result.rows[0].now 
    });
  } catch (err) {
    console.error("Database connection error:", err);
    res.status(500).json({ 
      success: false,
      error: "Database connection failed",
      message: err.message 
    });
  }
});

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

// 404 handler for undefined routes
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    availableEndpoints: [
      "GET /",
      "GET /health", 
      "GET /api/test",
      "POST /api/auth/login",
      "GET /api/users",
      "GET /api/courses"
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

// Server start
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;