// routes/exportRoutes.js
import express from "express";
import { exportCoursePDF } from "../controllers/exportController.js";
import { authenticate } from "../middleware/auth.js";

const router = express.Router();

router.get("/course/:courseId", authenticate, exportCoursePDF);

export default router;
