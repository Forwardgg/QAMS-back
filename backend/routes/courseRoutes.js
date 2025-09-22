// courseRoutes.js
import express from "express";
import { createCourse, getCourses, getCoursesWithCOs, updateCourse, deleteCourse } from "../controllers/CourseController.js";
import { authenticate, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

// Only admin + instructor can create courses
router.post("/", authenticate, authorizeRoles("admin", "instructor"), createCourse);

// Any logged-in user can view courses
router.get("/", authenticate, getCourses);

// Any logged-in user can view courses with COs + assessments
router.get("/with-cos", authenticate, getCoursesWithCOs);

// Only admin + instructor can update a course
router.put("/:courseId", authenticate, authorizeRoles("admin", "instructor"), updateCourse);

// Only admin + instructor can delete a course
router.delete("/:courseId", authenticate, authorizeRoles("admin", "instructor"), deleteCourse);

export default router;