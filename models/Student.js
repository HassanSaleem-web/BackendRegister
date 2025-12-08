const mongoose = require("mongoose");

const InterventionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  date: { type: Date, default: Date.now },
  notes: String
});

const AssessmentSchema = new mongoose.Schema({
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  type: String,                // quiz, test, essay, etc
  score: Number,
  maxScore: Number,
  percentage: Number,          // auto-calc maybe
  date: { type: Date, default: Date.now },
  notes: String,
  aiFeedback: String           // optional future feature
});

const StudentSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  
  // Basic Info
  name: { type: String, required: true },
  ell: { type: Boolean, default: false },
  gender: String,
  dob: Date,
  
  // Classroom(s)
  classroomIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],

  // Performance Data
  assessments: [AssessmentSchema],

  // Interventions
  interventions: [InterventionSchema],
  interventionFlag: { type: Boolean, default: false }, // quick boolean for dashboard

  // AI Insights
  aiSummary: String,
  aiStrengths: [String],
  aiWeaknesses: [String],
  aiLearningPlan: String,
  aiLastUpdated: Date,

  // Analytics helpers
  averageScore: Number,         // cached
  growthData: [
    {
      date: Date,
      avg: Number
    }
  ],

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Student", StudentSchema);
