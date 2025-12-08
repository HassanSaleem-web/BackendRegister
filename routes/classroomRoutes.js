const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");

const {
  createClassroom,
  getClassrooms,
  getClassroomById,
  updateClassroomMetrics,
  deleteClassroom,
} = require("../controllers/classroomController");

// All classroom routes require login
router.use(authMiddleware);

// Create a new classroom
router.post("/create", createClassroom);

// Get all classrooms for logged-in teacher
router.get("/", getClassrooms);

// Get single classroom details
router.get("/:id", getClassroomById);

// Update analytics metrics (optional endpoint)
router.put("/:id/metrics", updateClassroomMetrics);

// Delete a classroom
router.delete("/:id", deleteClassroom);

module.exports = router;
