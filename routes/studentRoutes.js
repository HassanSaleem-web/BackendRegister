const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const {
  createStudent,
  getStudentsByClassroom,
  getStudentById,
  updateStudent,
  deleteStudent,
  addAssessment,
  deleteAssessment,
  addIntervention,
  updateAISummary,
  getAllStudents,
  updateAssessment,
  addStudentToClasses,
  moveStudentClass
} = require("../controllers/studentController");

// All routes require authentication
router.use(authMiddleware);

// Create a student
router.post("/create", createStudent);
router.get("/all", getAllStudents);
// Get all students in a classroom
router.get("/classroom/:classroomId", getStudentsByClassroom);

// Get single student
router.get("/:id", getStudentById);

// Update student info (name, ELL, flags)
// router.put("/:id", updateStudent);

// Add student to other classes
router.put("/:id/add-classes", addStudentToClasses);

// Move student to another class
router.put("/:id/move-class", moveStudentClass);

// Delete student
router.delete("/:id", deleteStudent);

// Add assessment
router.post("/:id/assessments", addAssessment);

// Delete a specific assessment
router.put("/:studentId/assessments/:assessmentId", updateAssessment);
router.delete("/:studentId/assessments/:assessmentId", deleteAssessment);




// Add intervention entry
router.post("/:id/interventions", addIntervention);

// Update AI summary + insights
router.put("/:id/ai", updateAISummary);

module.exports = router;
