// routes/reportRoutes.js
import express from "express";
import { exportCourseReport } from "../controllers/reportController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/course/:courseId", authenticate, exportCourseReport);

export default router;
