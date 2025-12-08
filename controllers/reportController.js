const Student = require("../models/Student");
const axios = require("axios");

exports.generateReport = async (req, res) => {
  try {
    console.log("\n===== REPORT REQUEST RECEIVED =====");
    console.log("Body:", req.body);

    const { classroomId, studentIds, startDate, endDate } = req.body;
    console.log("Classroom ID:", classroomId);
    console.log("Student IDs:", studentIds);
    console.log("Start Date:", startDate);
    console.log("End Date:", endDate);

    if (!classroomId || !studentIds || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Classroom and student list are required",
      });
    }

    const start = startDate ? new Date(startDate) : new Date("2000-01-01");
    const end = endDate ? new Date(endDate) : new Date();

    // Fetch selected students
    const students = await Student.find({ _id: { $in: studentIds } }).lean();
    console.log("\nFetched students count:", students.length);
    console.log("Fetched student names:", students.map(s => s.name));

    const reportData = [];

    students.forEach(s => {
        console.log("\n--- PROCESSING STUDENT:", s.name, "ID:", s._id, "---");
        console.log("Raw assessments:", s.assessments);
        
      const filteredAssessments = (s.assessments || []).filter(a => {
        const d = new Date(a.date);
        return d >= start && d <= end;
      });
      console.log("Filtered assessments:", filteredAssessments);


      let avg = null;
      console.log("Computed average:", avg);

      if (filteredAssessments.length > 0) {
        avg =
          filteredAssessments.reduce((sum, a) => sum + a.percentage, 0) /
          filteredAssessments.length;
      }

      reportData.push({
        studentId: s._id,
        name: s.name,
        gender: s.gender,
        ell: s.ell,
        dob: s.dob,
        age: s.dob ? Math.floor((Date.now() - new Date(s.dob)) / (365 * 24 * 60 * 60 * 1000)) : null,
        interventionFlag: s.interventionFlag,

        overallAverage: avg ? avg.toFixed(1) : null,
        totalAssessments: filteredAssessments.length,

        aiSummary: s.aiSummary,
        aiStrengths: s.aiStrengths,
        aiWeaknesses: s.aiWeaknesses,

        assessments: filteredAssessments.map(a => ({
          type: a.type,
          score: a.score,
          maxScore: a.maxScore,
          percentage: a.percentage,
          date: a.date,
          notes: a.notes
        }))
      });
      console.log("Student report object prepared:", {
        name: s.name,
        overallAverage: avg,
        totalAssessments: filteredAssessments.length
      });
    });
    
      

    // ------------------------------
    // GROUP LEVEL ANALYTICS
    // ------------------------------
    const groupAvg =
      reportData
        .filter(d => d.overallAverage !== null)
        .reduce((sum, d) => sum + Number(d.overallAverage), 0) /
      reportData.filter(d => d.overallAverage !== null).length || null;

    const totalAssessmentsAcrossGroup = reportData.reduce(
      (sum, d) => sum + d.totalAssessments,
      0
    );
    console.log("\nGroup Average:", groupAvg);
console.log("Total assessments across group:", totalAssessmentsAcrossGroup);


    // Prepare data for AI prompt
    const plainTextFormatted = JSON.stringify(
      {
        classroomId,
        startDate,
        endDate,
        groupAverage: groupAvg,
        totalAssessments: totalAssessmentsAcrossGroup,
        students: reportData
      },
      null,
      2
    );

    // ------------------------------
    // AI PROMPT FOR GROK (OpenRouter)
    // ------------------------------
    const prompt = `
You are an expert education evaluator. You are generating a formal performance report for a teacher. 

Use the Washington State CEL 5D Framework for Teaching as reference, especially these dimensions:
- Student Engagement
- Classroom Environment & Culture
- Assessment for Student Learning
- Purpose & Teaching for Learning
- Curriculum & Pedagogy

Generate a **formal, multi-student performance report**.

The report should include:

1. **Group-Level Overview**
   - Average performance across all selected students
   - Overall growth patterns
   - Common strengths & weaknesses
   - Intervention needs
   - Comparison of ELL vs Non-ELL performance

2. **Individual Student Profiles**
   For each student, include:
   - Name, Age, ELL status
   - Strengths
   - Weaknesses
   - Assessment trends
   - Areas that meet CEL 5D proficiency
   - Areas needing support
   - Recommended next steps
   - Suggested interventions or accommodations

3. **Formal Academic Tone**
   Use district-appropriate language suitable for:
   - Parent conferences
   - IEP/MTSS reviews
   - Administrator evaluations
   - Evidence for student progress monitoring

4. **Standards Alignment**
   Relate findings loosely to:
   - State ELA/math standards
   - Learning targets
   - Growth mindset language

5. **Clarity**
   Avoid unnecessary jargon. Write clearly and professionally.

Here is the structured data you will use to generate the report:

${plainTextFormatted}

Now produce a complete, polished, administrator-level report.
`;

    // ------------------------------
    // CALL GROK (OPENROUTER)
    // ------------------------------

    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "x-ai/grok-4-fast",
        messages: [
          { role: "system", content: "You are a master educator and assessment expert." },
          { role: "user", content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://smartassess.app",
          "X-Title": "SmartAssess Report Generator"
        }
      }
    );

    const aiText = aiResponse.data.choices[0].message.content;

    return res.json({
        success: true,
        report: reportData,   // <-- renamed so frontend reads it correctly
        groupLevelAnalysis: {
          groupAverage: groupAvg,
          totalAssessments: totalAssessmentsAcrossGroup
        },
        aiNarrativeReport: aiText
      });
      
  } catch (err) {
    console.error("REPORT ERROR:", err);
    return res.status(500).json({ success: false, message: "Report generation failed" });
  }
  

};
