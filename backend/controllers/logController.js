import { Log } from "../models/Log.js";
//  created internally, not exposed as a route

export const getAllLogs = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const logs = await Log.getAll(limit);
    res.json({ success: true, total: logs.length, logs });
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch logs" });
  }
};
export const getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const logs = await Log.getByUser(userId, limit);
    res.json({ success: true, total: logs.length, logs });
  } catch (err) {
    console.error("Error fetching user logs:", err);
    res.status(500).json({ success: false, message: "Failed to fetch user logs" });
  }
};
export const deleteLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const deleted = await Log.delete(logId);
    if (!deleted) return res.status(404).json({ success: false, message: "Log not found" });

    res.json({ success: true, message: "Log deleted", log: deleted });
  } catch (err) {
    console.error("Error deleting log:", err);
    res.status(500).json({ success: false, message: "Failed to delete log" });
  }
};
