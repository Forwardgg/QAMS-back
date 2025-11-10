// controllers/coController.js
import { CourseOutcome } from "../models/CourseOutcome.js";
import { Course } from "../models/Course.js";

// Create CO (admin or instructor for their own course)
export const createCO = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { coNumber, description } = req.body;
    const user = req.user;

    const course = await Course.getById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to add COs to this course" });
    }

    const co = await CourseOutcome.create({ courseId, coNumber, description });
    res.status(201).json({ success: true, data: co });
  } catch (error) {
    console.error("Error creating CO:", error);

    if (error.message === "DUPLICATE_CO_NUMBER") {
      return res.status(409).json({ success: false, message: "CO number already exists for this course" });
    }

    res.status(500).json({ success: false, message: "Failed to create CO" });
  }
};
// Get all COs for a specific course (everyone can see)
export const getCOsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.getById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const cos = await CourseOutcome.getByCourse(courseId);

    res.json({
      success: true,
      data: {
        course: {
          title: course.title,
          code: course.code,
          l: course.l,
          t: course.t,
          p: course.p,
        },
        outcomes: cos,
      },
    });
  } catch (error) {
    console.error("Error fetching COs by course:", error);
    res.status(500).json({ success: false, message: "Failed to fetch COs" });
  }
};
// Get all courses with their COs (everyone can see)
export const getAllCoursesWithCOs = async (req, res) => {
  try {
    const courses = await Course.getAll();

    // Parallelize CO fetch for performance
    const results = await Promise.all(
      courses.map(async (course) => {
        const cos = await CourseOutcome.getByCourse(course.course_id);
        return {
          title: course.title,
          code: course.code,
          l: course.l,
          t: course.t,
          p: course.p,
          outcomes: cos,
        };
      })
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching all courses with COs:", error);
    res.status(500).json({ success: false, message: "Failed to fetch data" });
  }
};
// Update CO (admin or instructor for own course)
export const updateCO = async (req, res) => {
  try {
    const { coId } = req.params;
    const { coNumber, description } = req.body;
    const user = req.user;

    const co = await CourseOutcome.getById(coId);
    if (!co) {
      return res.status(404).json({ success: false, message: "CO not found" });
    }

    const course = await Course.getById(co.course_id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to update this CO" });
    }

    const updated = await CourseOutcome.update(coId, { coNumber, description });
    if (!updated) {
      return res.status(404).json({ success: false, message: "CO not found or nothing to update" });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating CO:", error);

    if (error.message === "DUPLICATE_CO_NUMBER") {
      return res.status(409).json({ success: false, message: "CO number already exists for this course" });
    }

    res.status(500).json({ success: false, message: "Failed to update CO" });
  }
};
// Delete CO (admin or instructor for own course)
export const deleteCO = async (req, res) => {
  try {
    const { coId } = req.params;
    const user = req.user;

    const co = await CourseOutcome.getById(coId);
    if (!co) {
      return res.status(404).json({ success: false, message: "CO not found" });
    }

    const course = await Course.getById(co.course_id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    if (user.role === "instructor" && course.created_by !== user.user_id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this CO" });
    }

    const deleted = await CourseOutcome.delete(coId);
    res.json({
      success: true,
      data: deleted,
      message: `Deleted CO ${deleted.co_number} from course ${course.code}`,
    });
  } catch (error) {
    console.error("Error deleting CO:", error);
    res.status(500).json({ success: false, message: "Failed to delete CO" });
  }
};
