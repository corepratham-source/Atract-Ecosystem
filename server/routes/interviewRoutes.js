const express = require("express");
const router = express.Router();
const { completeWithGroq } = require("../utils/groq");

// Groq LLM-based interview question generation

const buildPrompt = (role, level) => {
  return `You are an expert interview coach. Generate 6-8 interview questions for a ${level} level ${role} position.

Requirements:
- Mix of behavioral (tell me about a time...) and situational questions
- Role-specific and relevant to ${role}
- Appropriate difficulty for ${level} level
- Clear, concise, one question per line

Return ONLY a valid JSON array of strings. No markdown, no extra text. Example format:
["Question 1?", "Question 2?", "Question 3?"]`;
};

async function generateWithGroq(role, level) {
  const text = await completeWithGroq(buildPrompt(role, level));
  const raw = (text || "[]").trim();
  return parseQuestions(raw);
}

function parseQuestions(text) {
  try {
    let cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((q) => typeof q === "string" && q.trim().length > 0)
      .map((q) => q.trim());
  } catch {
    return fallbackParse(text);
  }
}

function fallbackParse(text) {
  const lines = text
    .split(/\n/)
    .map((s) => s.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter((s) => s.length > 15 && (s.endsWith("?") || s.includes("how") || s.includes("what") || s.includes("describe")));
  return [...new Set(lines)].slice(0, 10);
}

router.post("/generate-questions", async (req, res) => {
  try {
    const { role, level = "Mid", model: _model = "groq" } = req.body;

    if (!role || typeof role !== "string") {
      return res.status(400).json({ error: "Role is required" });
    }

    const trimmedRole = role.trim();
    if (!trimmedRole) {
      return res.status(400).json({ error: "Role cannot be empty" });
    }

    const validLevels = ["Junior", "Mid", "Senior"];
    const levelVal = validLevels.includes(level) ? level : "Mid";

    let questions = [];

    try {
      questions = await generateWithGroq(trimmedRole, levelVal) || [];
    } catch (apiError) {
      console.log("Groq API error, using fallback:", apiError.message);
      questions = [];
    }

    // Fallback: generic questions when no API key or API fails
    if (questions.length === 0) {
      questions = [
        `Tell me about a time you faced a challenging situation as a ${trimmedRole}. How did you handle it?`,
        `What skills do you think are most important for a ${levelVal} ${trimmedRole}?`,
        `How do you stay updated with industry trends in your role?`,
        `Describe a project where you had to collaborate with multiple stakeholders.`,
        `What would you do in your first 90 days as a ${trimmedRole} here?`,
        `How do you prioritize when you have multiple urgent tasks?`,
        `Tell me about a successful project you delivered as a ${trimmedRole}.`,
        `How do you handle tight deadlines and pressure?`,
      ];
    }

    if (questions.length === 0) {
      return res.status(500).json({
        error: "Could not generate questions. Please try again.",
      });
    }

    res.json({
      questions,
      role: trimmedRole,
      level: levelVal,
      model: "groq",
    });
  } catch (err) {
    console.error("Interview question generation error:", err);
    res.status(500).json({
      error: err.message || "Failed to generate questions",
    });
  }
});

module.exports = router;
