import express from "express";
import { getAllLogs, getLogsByUser, deleteLog } from "../controllers/logController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Admin → get all logs
router.get("/", authenticate, authorizeRoles("admin"), getAllLogs);

// Admin → get logs for a specific user
router.get("/user/:userId", authenticate, authorizeRoles("admin"), getLogsByUser);

// Admin → delete a log entry
router.delete("/:logId", authenticate, authorizeRoles("admin"), deleteLog);

export default router;
