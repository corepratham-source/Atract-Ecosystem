const express = require("express");
const router = express.Router();

router.post("/analyze", (req, res) => {
  try {
    const { employeeName, department, role, tenure, exitDate, reason, notes, manager } = req.body;
    
    if (!notes || typeof notes !== "string") {
      return res.status(400).json({ error: "Notes are required" });
    }

    const text = notes.toLowerCase();
    const themes = [];
    const keywords = [];

    // Enhanced theme detection
    if (text.includes("manager") || text.includes("lead") || text.includes("supervisor") || text.includes("boss")) {
      themes.push("Manager / Leadership Issues");
      keywords.push("manager", "lead", "supervisor");
    }
    if (text.includes("salary") || text.includes("pay") || text.includes("compensation") || text.includes("package")) {
      themes.push("Compensation & Benefits");
      keywords.push("salary", "pay", "compensation", "package");
    }
    if (text.includes("growth") || text.includes("career") || text.includes("promotion") || text.includes("advancement")) {
      themes.push("Career Growth & Development");
      keywords.push("growth", "career", "promotion", "advancement");
    }
    if (text.includes("workload") || text.includes("burnout") || text.includes("stress") || text.includes("overtime")) {
      themes.push("Workload & Burnout");
      keywords.push("workload", "burnout", "stress", "overtime");
    }
    if (text.includes("culture") || text.includes("toxic") || text.includes("environment") || text.includes("atmosphere")) {
      themes.push("Culture & Environment");
      keywords.push("culture", "toxic", "environment", "atmosphere");
    }
    if (text.includes("remote") || text.includes("wfh") || text.includes("flexible") || text.includes("work from home")) {
      themes.push("Remote Work Flexibility");
      keywords.push("remote", "wfh", "flexible", "work from home");
    }
    if (text.includes("recognition") || text.includes("appreciation") || text.includes("valued") || text.includes("acknowledg")) {
      themes.push("Recognition & Feedback");
      keywords.push("recognition", "appreciation", "valued", "acknowledgment");
    }
    if (text.includes("work-life") || text.includes("balance") || text.includes("personal") || text.includes("family")) {
      themes.push("Work-Life Balance");
      keywords.push("work-life", "balance", "personal", "family");
    }
    if (text.includes("benefits") || text.includes("insurance") || text.includes("health") || text.includes("perks")) {
      themes.push("Benefits & Perks");
      keywords.push("benefits", "insurance", "health", "perks");
    }
    if (text.includes("training") || text.includes("learning") || text.includes("development") || text.includes("skills")) {
      themes.push("Training & Development");
      keywords.push("training", "learning", "development", "skills");
    }
    if (text.includes("communication") || text.includes("transparency") || text.includes("information") || text.includes("updates")) {
      themes.push("Communication & Transparency");
      keywords.push("communication", "transparency", "information", "updates");
    }
    if (text.includes("job security") || text.includes("layoff") || text.includes("uncertainty") || text.includes("future")) {
      themes.push("Job Security Concerns");
      keywords.push("job security", "layoff", "uncertainty", "future");
    }
    if (text.includes("better opportunity") || text.includes("new role") || text.includes("challenge") || text.includes("new company")) {
      themes.push("Better Opportunity");
      keywords.push("opportunity", "new role", "challenge", "new company");
    }
    if (text.includes("relocation") || text.includes("moved") || text.includes("city") || text.includes("location")) {
      themes.push("Relocation");
      keywords.push("relocation", "moved", "city", "location");
    }
    if (text.includes("health") || text.includes("personal reasons") || text.includes("family reasons") || text.includes("medical")) {
      themes.push("Personal / Health Reasons");
      keywords.push("health", "personal reasons", "family reasons", "medical");
    }

    // Enhanced sentiment analysis
    const positiveWords = ["happy", "good", "great", "thank", "appreciated", "valued", "enjoyed", "positive", "wonderful", "excellent", "supportive", "helpful", "growth", "learned", "grateful"];
    const negativeWords = ["bad", "toxic", "poor", "frustrat", "disappointed", "unhappy", "negative", "terrible", "awful", "unsupportive", "unhelpful", "stressful", "overwhelming", "burned out"];
    
    let score = 0;
    positiveWords.forEach(w => { 
      const regex = new RegExp(`\\b${w}\\b`, 'i');
      if (regex.test(text)) score += 1; 
    });
    negativeWords.forEach(w => { 
      const regex = new RegExp(`\\b${w}\\b`, 'i');
      if (regex.test(text)) score -= 1; 
    });

    let sentiment = "Mixed / Neutral";
    if (score <= -2) sentiment = "Mostly Negative";
    else if (score >= 2) sentiment = "Mostly Positive";

    // Generate priority actions based on themes
    const actions = [];
    
    if (themes.includes("Manager / Leadership Issues")) {
      actions.push({ priority: "High", action: "Review manager feedback and consider leadership training program", timeline: "Immediate" });
      actions.push({ priority: "Medium", action: "Conduct 360-degree feedback assessment for managers", timeline: "Within 30 days" });
    }
    if (themes.includes("Compensation & Benefits")) {
      actions.push({ priority: "High", action: "Conduct market salary benchmarking analysis", timeline: "Within 30 days" });
      actions.push({ priority: "Medium", action: "Review and communicate total rewards package", timeline: "Quarterly" });
    }
    if (themes.includes("Career Growth & Development")) {
      actions.push({ priority: "Medium", action: "Implement clear career progression framework", timeline: "Quarterly" });
      actions.push({ priority: "Medium", action: "Create individual development plans for high potentials", timeline: "Within 60 days" });
    }
    if (themes.includes("Workload & Burnout")) {
      actions.push({ priority: "High", action: "Assess team workload distribution immediately", timeline: "Immediate" });
      actions.push({ priority: "Medium", action: "Review resource allocation and hiring needs", timeline: "Within 30 days" });
    }
    if (themes.includes("Culture & Environment")) {
      actions.push({ priority: "Medium", action: "Conduct anonymous pulse survey on culture", timeline: "Monthly" });
      actions.push({ priority: "Medium", action: "Review HR policies and workplace practices", timeline: "Within 60 days" });
    }
    if (themes.includes("Remote Work Flexibility")) {
      actions.push({ priority: "Medium", action: "Review and communicate hybrid work policy", timeline: "Within 30 days" });
      actions.push({ priority: "Low", action: "Survey employees on remote work preferences", timeline: "Quarterly" });
    }
    if (themes.includes("Recognition & Feedback")) {
      actions.push({ priority: "Medium", action: "Implement formal recognition program", timeline: "Within 30 days" });
      actions.push({ priority: "Low", action: "Train managers on effective feedback techniques", timeline: "Quarterly" });
    }
    if (themes.includes("Work-Life Balance")) {
      actions.push({ priority: "Medium", action: "Review working hours and overtime policies", timeline: "Within 30 days" });
      actions.push({ priority: "Low", action: "Promote wellness programs and time-off culture", timeline: "Ongoing" });
    }
    if (themes.includes("Communication & Transparency")) {
      actions.push({ priority: "Medium", action: "Improve internal communication channels", timeline: "Within 30 days" });
      actions.push({ priority: "Low", action: "Schedule regular all-hands meetings", timeline: "Monthly" });
    }
    if (themes.includes("Job Security Concerns")) {
      actions.push({ priority: "High", action: "Communicate company roadmap and stability plans", timeline: "Immediate" });
      actions.push({ priority: "Medium", action: "Review business strategy and communicate clearly", timeline: "Within 30 days" });
    }
    if (themes.includes("Better Opportunity")) {
      actions.push({ priority: "Medium", action: "Review internal job posting and promotion processes", timeline: "Quarterly" });
      actions.push({ priority: "Low", action: "Create internal mobility program", timeline: "Within 90 days" });
    }
    if (themes.includes("Training & Development")) {
      actions.push({ priority: "Medium", action: "Assess training needs and expand L&D programs", timeline: "Within 60 days" });
      actions.push({ priority: "Low", action: "Budget for skill development initiatives", timeline: "Quarterly" });
    }

    // Calculate retention risk
    let retentionRisk = "Low";
    const riskFactors = themes.length;
    if (riskFactors >= 3 || (sentiment === "Mostly Negative" && riskFactors >= 2)) {
      retentionRisk = "High";
    } else if (riskFactors >= 2 || sentiment === "Mostly Negative") {
      retentionRisk = "Medium";
    }

    // If no themes found, add default action
    if (actions.length === 0) {
      actions.push({ priority: "Low", action: "Collect more detailed exit interview feedback", timeline: "Ongoing" });
      actions.push({ priority: "Low", action: "Analyze exit trends across departments", timeline: "Quarterly" });
    }

    res.json({
      themes: themes.length ? [...new Set(themes)] : ["No clear repeating patterns found"],
      sentiment,
      actions: actions.slice(0, 5), // Limit to 5 actions
      retentionRisk,
      keywords: [...new Set(keywords)].slice(0, 10),
      generatedAt: new Date().toLocaleString(),
      employeeName,
      department,
      role,
      tenure,
      exitReason: reason,
    });
  } catch (err) {
    console.error("Exit interview analysis error:", err);
    res.status(500).json({ error: err.message || "Analysis failed" });
  }
});

module.exports = router;
