// const express = require("express");
// const router = express.Router();
// const { completeWithGroq } = require("../utils/groq");

// // Groq LLM-based interview question generation

// const buildPrompt = (role, level) => {
//   return `You are an expert interview coach. Generate 6-8 interview questions for a ${level} level ${role} position.

// Requirements:
// - Mix of behavioral (tell me about a time...) and situational questions
// - Role-specific and relevant to ${role}
// - Appropriate difficulty for ${level} level
// - Clear, concise, one question per line

// Return ONLY a valid JSON array of strings. No markdown, no extra text. Example format:
// ["Question 1?", "Question 2?", "Question 3?"]`;
// };

// async function generateWithGroq(role, level) {
//   const text = await completeWithGroq(buildPrompt(role, level));
//   const raw = (text || "[]").trim();
//   return parseQuestions(raw);
// }

// function parseQuestions(text) {
//   try {
//     let cleaned = text
//       .replace(/```json\s*/g, "")
//       .replace(/```\s*/g, "")
//       .trim();
//     const parsed = JSON.parse(cleaned);
//     if (!Array.isArray(parsed)) return [];
//     return parsed
//       .filter((q) => typeof q === "string" && q.trim().length > 0)
//       .map((q) => q.trim());
//   } catch {
//     return fallbackParse(text);
//   }
// }

// function fallbackParse(text) {
//   const lines = text
//     .split(/\n/)
//     .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
//     .filter((s) => s.length > 15 && (s.endsWith("?") || s.includes("how") || s.includes("what") || s.includes("describe")));
//   return [...new Set(lines)].slice(0, 10);
// }

// router.post("/generate-questions", async (req, res) => {
//   try {
//     const { role, level = "Mid", model: _model = "groq" } = req.body;

//     if (!role || typeof role !== "string") {
//       return res.status(400).json({ error: "Role is required" });
//     }

//     const trimmedRole = role.trim();
//     if (!trimmedRole) {
//       return res.status(400).json({ error: "Role cannot be empty" });
//     }

//     const validLevels = ["Junior", "Mid", "Senior"];
//     const levelVal = validLevels.includes(level) ? level : "Mid";

//     let questions = [];

//     try {
//       questions = await generateWithGroq(trimmedRole, levelVal) || [];
//     } catch (apiError) {
//       console.log("Groq API error, using fallback:", apiError.message);
//       questions = [];
//     }

//     // Fallback: generic questions when no API key or API fails
//     if (questions.length === 0) {
//       questions = [
//         `Tell me about a time you faced a challenging situation as a ${trimmedRole}. How did you handle it?`,
//         `What skills do you think are most important for a ${levelVal} ${trimmedRole}?`,
//         `How do you stay updated with industry trends in your role?`,
//         `Describe a project where you had to collaborate with multiple stakeholders.`,
//         `What would you do in your first 90 days as a ${trimmedRole} here?`,
//         `How do you prioritize when you have multiple urgent tasks?`,
//         `Tell me about a successful project you delivered as a ${trimmedRole}.`,
//         `How do you handle tight deadlines and pressure?`,
//       ];
//     }

//     if (questions.length === 0) {
//       return res.status(500).json({
//         error: "Could not generate questions. Please try again.",
//       });
//     }

//     res.json({
//       questions,
//       role: trimmedRole,
//       level: levelVal,
//       model: "groq",
//     });
//   } catch (err) {
//     console.error("Interview question generation error:", err);
//     res.status(500).json({
//       error: err.message || "Failed to generate questions",
//     });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { completeWithGroq } = require("../utils/groq");

// SUPER-POWERED PROMPT with few-shot examples (this forces real variation)
const buildPrompt = (role, level) => {
  const timestamp = new Date().toISOString();
  const seed = Math.random().toString(36).substring(2, 15);

  return `You are the world's #1 specialized interview coach with 20 years experience creating UNIQUE questions for every role and level.

TASK: Generate EXACTLY 8 fresh, never-before-seen interview questions for a ${level}-level ${role} position.

STRICT RULES (must follow or output is invalid):
- ALL 8 questions must be 100% specific to the ${role} role and ${level} seniority. No generic questions allowed.
- For ${level} level:
  • Junior: focus on learning, basic execution, support, fundamentals
  • Mid: focus on independent delivery, mentoring juniors, process improvement
  • Senior: focus on strategy, leadership, architecture, cross-team impact, innovation
- 4 behavioral questions (start with "Tell me about a time..." or "Describe a situation...")
- 4 technical/situational/strategic questions
- Every question must feel completely original and role-specific.

FEW-SHOT EXAMPLES (learn the style, then create totally different ones for the requested role):

Example 1 - Junior Software Engineer:
["Tell me about a time you debugged a bug in your first personal project.", "How would you explain REST APIs to a non-technical stakeholder?", "Describe a situation where you had to learn a new framework quickly.", "What steps would you take to optimize a slow SQL query?"]

Example 2 - Senior Product Manager:
["Tell me about a time you killed a feature that the team loved but data showed was failing.", "How would you align stakeholders when engineering and sales have conflicting priorities?", "Describe your process for creating a product roadmap that survived executive review.", "How do you measure success of a product that has both B2B and B2C users?"]

Example 3 - Mid Data Scientist:
["Tell me about a time your A/B test results contradicted business intuition.", "How would you handle missing data in a customer churn prediction model?", "Describe how you would productionize a machine learning model with your engineering team.", "What metrics would you track for a recommendation system in an e-commerce app?"]

Now generate for: ${level}-level ${role}

Current timestamp (makes output fresh): ${timestamp}
Random seed: ${seed}

Return ONLY a valid JSON array of 8 strings. No markdown, no numbers, no extra text.
Example output:
["Question one here?", "Question two here?", ...]`;
};

async function generateWithGroq(role, level) {
  const text = await completeWithGroq(buildPrompt(role, level));
  return parseQuestions(text || "[]");
}

function parseQuestions(text) {
  if (!text) return [];

  // Try JSON array first
  try {
    let cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      const unique = [...new Set(parsed)]
        .filter(q => typeof q === "string" && q.trim().length > 15)
        .map(q => q.trim());
      if (unique.length >= 4) return unique.slice(0, 8);
    }
  } catch (e) {}

  // Fallback: extract lines that look like questions
  const lines = text
    .split(/\n+/)
    .map(l => l.replace(/^\s*[\d\.\-\*•]+\s*/, "").replace(/^["']|["']$/g, "").trim())
    .filter(l => l.length > 20 && (
      l.endsWith("?") ||
      l.toLowerCase().includes("tell me") ||
      l.toLowerCase().includes("describe") ||
      l.toLowerCase().includes("how would") ||
      l.toLowerCase().includes("what would") ||
      l.toLowerCase().includes("how do you")
    ));

  return [...new Set(lines)].slice(0, 8);
}

function getFallbackQuestions(role, level) {
  const r = role.toLowerCase();
  const isTechnical = ["developer", "engineer", "architect", "devops", "data", "analyst", "designer", "qa", "tester", "security", "ml", "ai", "frontend", "backend", "fullstack", "full stack", "software", "programmer", "coder"].some(k => r.includes(k));

  if (isTechnical) {
    return [
      `Tell me about a time you debugged a particularly challenging production issue as a ${role}.`,
      `Describe a situation where you had to refactor legacy code. How did you approach it?`,
      `How would you design a system to handle 10x the current traffic for your ${role} work?`,
      `Tell me about a time you disagreed with a technical decision. How was it resolved?`,
      `What is your approach to code reviews and ensuring code quality as a ${role}?`,
      `Describe how you would onboard a new team member to your current codebase.`,
      `Tell me about a time you had to learn a new technology quickly for a project.`,
      `How do you balance technical debt with new feature development?`,
    ];
  }

  return [
    `Tell me about a time you led a project from conception to delivery as a ${role}.`,
    `Describe a situation where you had to manage conflicting stakeholder priorities.`,
    `How would you approach your first 90 days in this ${role} position?`,
    `Tell me about a time you had to make a difficult decision with limited information.`,
    `What strategies do you use to keep your team motivated during challenging periods?`,
    `Describe how you handle feedback from peers or managers that you disagree with.`,
    `Tell me about a time you identified and solved a problem before it became critical.`,
    `How do you measure success in your role as a ${role}?`,
  ];
}

router.post("/generate-questions", async (req, res) => {
  try {
    let { role, level = "Mid" } = req.body;

    if (!role || typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "Role is required" });
    }

    role = role.trim();
    const validLevels = ["Junior", "Mid", "Senior"];
    level = validLevels.includes(level) ? level : "Mid";

    console.log(`[Interview] Generating questions for ${level} ${role}`);

    let questions = [];
    try {
      questions = await generateWithGroq(role, level);
      console.log(`[Interview] Groq returned ${questions.length} questions`);
    } catch (apiError) {
      console.error("[Interview] Groq API error:", apiError.message);
    }

    // If Groq returned some but not enough, pad with fallback
    if (questions.length > 0 && questions.length < 6) {
      const fallback = getFallbackQuestions(role, level);
      const existing = new Set(questions.map(q => q.toLowerCase()));
      for (const fb of fallback) {
        if (questions.length >= 8) break;
        if (!existing.has(fb.toLowerCase())) {
          questions.push(fb);
        }
      }
      console.log(`[Interview] Padded to ${questions.length} questions with fallback`);
    }

    // If Groq completely failed, use all fallback
    if (questions.length < 4) {
      console.log("[Interview] Using fallback questions");
      questions = getFallbackQuestions(role, level);
    }

    res.json({
      success: true,
      questions: questions.slice(0, 8),
      role,
      level,
      count: Math.min(questions.length, 8),
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Interview questions error:", err);
    res.status(500).json({ error: "Server error generating questions" });
  }
});

module.exports = router;