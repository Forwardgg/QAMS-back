import express from "express";
import {
  createCourse,
  getAllCoursesAdmin,
  getAllCoursesInstructor,
  getCoursesPublic,
  updateCourse,
  deleteCourse,
  getCourseByCode,
  searchCoursesByTitle
} from "../controllers/CourseController.js";

import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Create course (admin or instructor)
router.post("/", authenticate, authorizeRoles("admin", "instructor"), createCourse);

// Admin → get all courses
router.get("/", authenticate, authorizeRoles("admin"), getAllCoursesAdmin);

// Instructor → get own courses
router.get("/mine", authenticate, authorizeRoles("instructor"), getAllCoursesInstructor);

// Public → everyone can see course code, title, LTP
router.get("/public", getCoursesPublic);

// Get course by code (public)
router.get("/code/:code", getCourseByCode);

// Search courses (public) - by title
router.get("/search", searchCoursesByTitle);

// Update course (admin can update all, instructor only own)
router.put("/:id", authenticate, authorizeRoles("admin", "instructor"), updateCourse);

// Delete course (admin can delete all, instructor only own)
router.delete("/:id", authenticate, authorizeRoles("admin", "instructor"), deleteCourse);

export default router;
