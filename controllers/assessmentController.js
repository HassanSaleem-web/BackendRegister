const Student = require("../models/Student");
const Classroom = require("../models/Classroom");
const axios = require("axios");

// ------------------------
// AI HELPER
// ------------------------
async function generateAIInsights(student, latestAssessment, allAssessments) {
  try {
    // ---------- FORMAT HISTORY ----------
    const historyFormatted = allAssessments
      .map((a, i) => {
        return `
${i + 1}.
  Date: ${a.date ? new Date(a.date).toDateString() : "N/A"}
  Type: ${a.type}
  Score: ${a.score}/${a.maxScore}
  Percentage: ${a.percentage?.toFixed(2)}%
  Notes: ${a.notes || "None"}
`;
      })
      .join("\n");

    // ---------- THE PROMPT ----------
    const prompt = `
You are an educational analytics expert.

Analyze the following student's performance:

Student:
- Name: ${student.name}
- ELL: ${student.ell ? "Yes" : "No"}

LATEST ASSESSMENT:
- Type: ${latestAssessment.type}
- Score: ${latestAssessment.score}/${latestAssessment.maxScore}
- Percentage: ${latestAssessment.percentage.toFixed(2)}%
- Date: ${new Date(latestAssessment.date).toDateString()}
- Notes: ${latestAssessment.notes || "No notes provided"}

FULL ASSESSMENT HISTORY:
${historyFormatted}

### REQUIRED OUTPUT FORMAT (VERY IMPORTANT):
Return the answer in the EXACT JSON structure below. No extra text.

{
  "summary": "1–2 paragraph growth summary...",
  "strengths": ["strength 1", "strength 2", "..."],
  "weaknesses": ["weakness 1", "weakness 2", "..."],
  "learningPlan": "short actionable plan...",
  "assessmentFeedback": "1–2 sentence feedback on latest assessment"
}

Only valid JSON. Do NOT return markdown headings.
`;

    // ---------- API CALL ----------
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "x-ai/grok-4-fast",
        messages: [
          { role: "system", content: "You are an educational data analyst." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const rawText = response.data.choices[0].message.content.trim();

    // ---------- PARSE JSON ----------
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      console.error("❌ AI JSON PARSE ERROR:", error);
      console.log("AI returned:", rawText);

      return {
        summary: rawText,
        strengths: [],
        weaknesses: [],
        learningPlan: "",
        assessmentFeedback: ""
      };
    }

    // ---------- GUARANTEE STRUCTURE ----------
    return {
      summary: parsed.summary || "",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      learningPlan: parsed.learningPlan || "",
      assessmentFeedback: parsed.assessmentFeedback || ""
    };

  } catch (err) {
    console.error("AI ERROR:", err);
    return {
      summary: "",
      strengths: [],
      weaknesses: [],
      learningPlan: "",
      assessmentFeedback: ""
    };
  }
}

// ------------------------
// CREATE ASSESSMENT
// ------------------------
exports.createAssessment = async (req, res) => {
  try {
    const {
      classroomId,
      type,
      maxScore,
      date,
      notes,
      students // [ { studentId, score } ]
    } = req.body;

    if (!classroomId || !type || !maxScore || !students) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields."
      });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ success: false, message: "Classroom not found." });
    }

    // Increment classroom assessment count
    classroom.assessmentCount = (classroom.assessmentCount || 0) + 1;
    await classroom.save();

    // Process each student
    for (const s of students) {
      const student = await Student.findById(s.studentId);
      if (!student) continue;

      const percentage = (Number(s.score) / Number(maxScore)) * 100;

      // 1. Add assessment
      const newAssessment = {
        classroomId,
        type,
        score: s.score,
        maxScore,
        percentage,
        date,
        notes,
        metrics: Array.isArray(s.metrics) ? s.metrics : [],
        strengths: Array.isArray(s.strengths) ? s.strengths : [],
        weaknesses: Array.isArray(s.weaknesses) ? s.weaknesses : []
      };

      student.assessments.push(newAssessment);

      // 2. Recompute analytics
      const allPercentages = student.assessments.map(a => a.percentage);
      const newAverage = allPercentages.reduce((a, b) => a + b, 0) / allPercentages.length;

      student.averageScore = parseFloat(newAverage.toFixed(2));

      // Add to growth graph:
      student.growthData.push({
        date: new Date(date),
        avg: student.averageScore
      });

      // 3. Intervention flag logic:
      if (student.averageScore < 60) {
        student.interventionFlag = true;
      }

      // 4. AI Insights Generation
      // 4. AI Insights Generation (STRUCTURED)
      const ai = await generateAIInsights(student, newAssessment, student.assessments);

      // Save structured fields
      student.aiSummary = ai.summary;
      student.aiStrengths = ai.strengths;
      student.aiWeaknesses = ai.weaknesses;
      student.aiLearningPlan = ai.learningPlan;
      student.aiLastUpdated = new Date();

      // Save latest assessment feedback
      newAssessment.aiFeedback = ai.assessmentFeedback;

      await student.save();
    }

    res.json({
      success: true,
      message: "Assessment + AI analytics updated successfully."
    });

  } catch (err) {
    console.error("Assessment error:", err);
    res.status(500).json({
      success: false,
      message: "Server error.",
      error: err.message
    });
  }
};

