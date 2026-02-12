const express = require("express");
const router = express.Router();

router.post("/analyze", (req, res) => {
  try {
    const { selfReview = "", managerFeedback = "" } = req.body;
    const text = (selfReview + " " + managerFeedback).toLowerCase();

    const positives = ["exceeded", "outstanding", "great", "excellent", "improved", "delivered", "led", "innovat", "collaborat", "proactive", "initiative", "strong", "impact", "successful"];
    const concerns = ["improve", "need to", "lack", "missed", "delay", "quality issue", "dependen", "communication", "prioritiz", "struggling", "challenges", "below expectations"];

    const positiveCount = positives.filter(w => text.includes(w)).length;
    const concernCount = concerns.filter(w => text.includes(w)).length;

    let overallTone = "Balanced";
    if (positiveCount > concernCount + 2) overallTone = "Strongly Positive";
    else if (concernCount > positiveCount + 1) overallTone = "Needs Improvement";
    else if (concernCount > 0) overallTone = "Mixed with Development Areas";

    const themes = [];
    if (text.includes("communicat") || text.includes("feedback")) themes.push("Communication Skills");
    if (text.includes("team") || text.includes("collaborat")) themes.push("Teamwork & Collaboration");
    if (text.includes("technic") || text.includes("skill")) themes.push("Technical Competence");
    if (text.includes("deliver") || text.includes("deadlin") || text.includes("qualit")) themes.push("Delivery & Quality");
    if (text.includes("leader") || text.includes("mentor")) themes.push("Leadership & Mentoring");
    if (text.includes("customer") || text.includes("client")) themes.push("Client Focus");
    if (text.includes("problem") || text.includes("solution")) themes.push("Problem Solving");
    if (text.includes("adapt") || text.includes("flexib")) themes.push("Adaptability");
    if (text.includes("initiative") || text.includes("proactive")) themes.push("Proactivity");
    if (text.includes("time") || text.includes("priorit")) themes.push("Time Management");

    let estimatedRating = 3;
    if (positiveCount > concernCount + 5) estimatedRating = 5;
    else if (positiveCount > concernCount + 3) estimatedRating = 4;
    else if (concernCount > positiveCount + 2) estimatedRating = 2;

    const summaryPoints = [];
    if (positiveCount > 0) summaryPoints.push(`Demonstrated strong performance in ${positiveCount > 4 ? "multiple" : "key"} areas.`);
    if (concernCount > 0) summaryPoints.push(`Identified development opportunities.`);
    if (positiveCount === 0 && concernCount === 0) summaryPoints.push("Add more specific examples for better analysis.");

    const nextSteps = [
      { type: "Strength", action: `Leverage ${themes[0] || "identified strengths"} in upcoming projects` },
      { type: "Development", action: themes.length > 1 ? `Create action plan to improve ${themes[1]}` : "Create action plan for development areas" },
      { type: "Discussion", action: "Schedule 1:1 to discuss career aspirations" },
      { type: "Follow-up", action: "Schedule follow-up in 6-8 weeks" },
    ];

    const promotionEligible = positiveCount > concernCount + 3;
    const bonusEligible = positiveCount > concernCount;

    res.json({
      overallTone,
      strengthCount: positiveCount,
      concernCount,
      detectedThemes: themes.length ? themes : ["No clear themes detected"],
      suggestedSummary: summaryPoints.length ? summaryPoints : ["Balanced performance with room for growth."],
      nextSteps,
      estimatedRating,
      promotionEligible,
      bonusEligible,
      generatedAt: new Date().toLocaleString(),
    });
  } catch (err) {
    console.error("Performance review analysis error:", err);
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

module.exports = router;
