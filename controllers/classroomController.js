const Classroom = require("../models/Classroom");
//const Student = require("../models/Student");

// ===============================
// Create Classroom
// ===============================
exports.createClassroom = async (req, res) => {
  try {
    const {
      name,
      gradeLevel,
      ageGroup,
      subject,
      term,
      environment,
      notes,
    } = req.body;

    const classroom = new Classroom({
      teacher: req.user.id,
      name,
      gradeLevel,
      ageGroup,
      subject,
      term,
      environment,
      notes,
    });

    await classroom.save();

    res.status(201).json({
      success: true,
      message: "Classroom created successfully",
      classroom,
    });
  } catch (err) {
    console.error("Error creating classroom:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ===============================
// Get All Classrooms (for teacher)
// ===============================
exports.getClassrooms = async (req, res) => {
  try {
    const classrooms = await Classroom.find({ teacher: req.user.id })
      .populate("students");

    res.json({ success: true, classrooms });
  } catch (err) {
    console.error("Error fetching classrooms:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ===============================
// Get a Classroom by ID
// ===============================
exports.getClassroomById = async (req, res) => {
  try {
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      teacher: req.user.id,
    }).populate("students");

    if (!classroom)
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });

    res.json({ success: true, classroom });
  } catch (err) {
    console.error("Error fetching classroom:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ===============================
// Update Classroom Analytics Metrics
// ===============================
exports.updateClassroomMetrics = async (req, res) => {
  try {
    const { metrics } = req.body;

    const classroom = await Classroom.findOneAndUpdate(
      { _id: req.params.id, teacher: req.user.id },
      { metrics },
      { new: true }
    );

    if (!classroom)
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });

    res.json({ success: true, classroom });
  } catch (err) {
    console.error("Error updating metrics:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// ===============================
// Delete a Classroom
// ===============================
exports.deleteClassroom = async (req, res) => {
  try {
    const classroom = await Classroom.findOneAndDelete({
      _id: req.params.id,
      teacher: req.user.id,
    });

    if (!classroom)
      return res
        .status(404)
        .json({ success: false, message: "Classroom not found" });

    res.json({ success: true, message: "Classroom deleted" });
  } catch (err) {
    console.error("Error deleting classroom:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
