const Student = require("../models/Student");
const Classroom = require("../models/Classroom");

// ------------------------------
// CREATE STUDENT
// ------------------------------
exports.createStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;   // this is set in your auth middleware
    const { name, ell, gender, dob, classroomId, notes } = req.body;

    if (!name || !classroomId) {
      return res
        .status(400)
        .json({ success: false, message: "Name and classroomId are required" });
    }

    // Ensure classroom exists & belongs to teacher
    const classroom = await Classroom.findOne({ _id: classroomId, teacher: teacherId });
    if (!classroom) {
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });
    }

    const student = new Student({
      name,
      ell,
      gender,
      dob,
      notes,
      classroomIds: [classroomId],
      teacherId: teacherId          // 🔥 FIX: use teacherId, not req.user._id
    });

    // 🔥 actually persist to DB
    await student.save();

    // link student to classroom
    classroom.students.push(student._id);
    await classroom.save();

    return res.json({ success: true, student });
  } catch (err) {
    console.error("Error creating student:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// ------------------------------
// GET STUDENTS BY CLASSROOM
// ------------------------------
exports.getStudentsByClassroom = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { classroomId } = req.params;

    const students = await Student.find({
      teacherId,
      classroomIds: classroomId
    });

    res.json({ success: true, students });
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
exports.getAllStudents = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const students = await Student.find({ teacherId })
      .populate("classroomIds", "name");

    const formatted = students.map(s => ({
      _id: s._id,
      name: s.name,
      classroomName: s.classroomIds?.[0]?.name || "Unassigned",
      ell: s.ell,
      avg: s.averageScore || null
    }));

    return res.json({ success: true, students: formatted });

  } catch (err) {
    console.error("Error fetching all students:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
// ------------------------------
// GET SINGLE STUDENT
// ------------------------------
exports.getStudentById = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const student = await Student.findOne({
      _id: req.params.id,
      teacherId
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student });
  } catch (err) {
    console.error("Error fetching student:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------
// UPDATE STUDENT INFO
// ------------------------------


// ------------------------------
// DELETE STUDENT
// ------------------------------
exports.deleteStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const student = await Student.findOneAndDelete({
      _id: req.params.id,
      teacherId
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Remove from classrooms
    await Classroom.updateMany(
      { students: student._id },
      { $pull: { students: student._id } }
    );

    res.json({ success: true, message: "Student deleted" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------
// ADD ASSESSMENT
// ------------------------------
exports.addAssessment = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const student = await Student.findOne({ _id: req.params.id, teacherId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { type, score, maxScore, date, notes, classroomId } = req.body;

    const percentage = (score / maxScore) * 100;

    student.assessments.push({
      type,
      score,
      maxScore,
      percentage,
      date: date || new Date(),
      notes,
      classroomId
    });

    await student.save();

    res.json({ success: true, student });
  } catch (err) {
    console.error("Error adding assessment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------
// DELETE ASSESSMENT
// ------------------------------
exports.deleteAssessment = async (req, res) => {
  try {
    const teacherId = req.user.id;

    const student = await Student.findOne({
      _id: req.params.id,
      teacherId
    });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    student.assessments = student.assessments.filter(
      (a) => a._id.toString() !== req.params.assessmentId
    );

    await student.save();

    res.json({ success: true, student });
  } catch (err) {
    console.error("Error deleting assessment:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------
// ADD INTERVENTION
// ------------------------------
exports.addIntervention = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const student = await Student.findOne({ _id: req.params.id, teacherId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { type, notes } = req.body;

    student.interventions.push({
      type,
      notes
    });

    student.interventionFlag = true;
    await student.save();

    res.json({ success: true, student });
  } catch (err) {
    console.error("Error adding intervention:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ------------------------------
// UPDATE AI SUMMARY
// ------------------------------
exports.updateAISummary = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { aiSummary, aiStrengths, aiWeaknesses, aiLearningPlan } = req.body;

    const student = await Student.findOne({ _id: req.params.id, teacherId });

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    student.aiSummary = aiSummary;
    student.aiStrengths = aiStrengths || [];
    student.aiWeaknesses = aiWeaknesses || [];
    student.aiLearningPlan = aiLearningPlan || "";
    student.aiLastUpdated = new Date();

    await student.save();

    res.json({ success: true, student });
  } catch (err) {
    console.error("Error updating AI summary:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// controllers/studentController.js
exports.updateStudent = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const { name, ell, gender, dob, notes, classroomId } = req.body;

    const student = await Student.findOne({ _id: req.params.id, teacherId });
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Update available fields
    if (name !== undefined) student.name = name;
    if (ell !== undefined) student.ell = ell;
    if (gender !== undefined) student.gender = gender;
    if (dob !== undefined) student.dob = dob || null;
    if (notes !== undefined) student.notes = notes;

    // 🔥 Update classroom assignment
    if (classroomId !== undefined && classroomId !== null) {
      student.classroomIds = [classroomId];
    }

    await student.save();

    return res.json({ success: true, student });

  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ===============================
// UPDATE ASSESSMENT
// ===============================
exports.updateAssessment = async (req, res) => {
  try {
    const { studentId, assessmentId } = req.params;
    const { type, score, maxScore, date, notes } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const assessment = student.assessments.id(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    // Update fields
    if (type !== undefined) assessment.type = type;
    if (score !== undefined) assessment.score = score;
    if (maxScore !== undefined) assessment.maxScore = maxScore;
    if (date !== undefined) assessment.date = date;
    if (notes !== undefined) assessment.notes = notes;

    // Recalculate derived percentage
    if (assessment.score != null && assessment.maxScore != null) {
      assessment.percentage = (assessment.score / assessment.maxScore) * 100;
    }

    await student.save();

    return res.json({
      success: true,
      message: "Assessment updated successfully",
      updatedAssessment: assessment
    });

  } catch (err) {
    console.error("Update assessment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// ===============================
// DELETE ASSESSMENT
// ===============================
exports.deleteAssessment = async (req, res) => {
  try {
    const { studentId, assessmentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const assessment = student.assessments.id(assessmentId);
    if (!assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }

    assessment.deleteOne(); // or assessment.remove();
    await student.save();

    return res.json({
      success: true,
      message: "Assessment deleted successfully"
    });

  } catch (err) {
    console.error("Delete assessment error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
