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
  try {
    let cleaned = text
      .replace(/```json/gi, "")
      .replace(/```/gi, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(q => typeof q === "string" && q.trim().length > 20 && q.trim().endsWith("?"))
        .map(q => q.trim())
        .slice(0, 8);
    }
  } catch (e) {
    // Fallback line parser (still from Groq output)
    return text
      .split(/\n+/)
      .map(l => l.replace(/^\s*[\d\.\-\*•]+\s*/, "").trim())
      .filter(l => l.length > 30 && l.endsWith("?"))
      .slice(0, 8);
  }
  return [];
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

    const questions = await generateWithGroq(role, level);

    if (questions.length < 6) {
      return res.status(503).json({ 
        error: "Groq did not return enough unique questions. Please try again." 
      });
    }

    res.json({
      success: true,
      questions,
      role,
      level,
      count: questions.length,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Interview questions error:", err);
    res.status(500).json({ error: "Server error. Check Groq API key and utils/groq.js" });
  }
});

module.exports = router;