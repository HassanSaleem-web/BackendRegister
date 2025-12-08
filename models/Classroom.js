const mongoose = require("mongoose");

const ClassroomSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // classroom always belongs to logged-in teacher
    },

    // === BASIC INFORMATION ===
    name: {
      type: String,
      required: true,
      trim: true,
    },

    gradeLevel: {
      type: String,
      required: true,
    },

    ageGroup: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    term: {
      type: String,
      enum: ["Fall", "Spring", "Winter", "Summer", "Full Year"],
      default: "Fall",
    },

    environment: {
      type: String,
      enum: ["In-Person", "Hybrid", "Online"],
      default: "In-Person",
    },

    notes: {
      type: String,
      default: "",
    },

    // === RELATIONS ===
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],

    // === ANALYTIC FIELDS (CALCULATED LATER) ===
    metrics: {
      averageScore: { type: Number, default: 0 },
      growthRate: { type: Number, default: 0 },
      strugglingStudents: { type: Number, default: 0 },
      assessmentCount: { type: Number, default: 0 },
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model("Classroom", ClassroomSchema);
