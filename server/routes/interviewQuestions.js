const express = require("express");
const router = express.Router();
const { completeWithGroq } = require("../utils/groq");

const buildSystemPrompt = () => `You are an expert interview question generator.
You MUST reply with ONLY a valid JSON array of strings.
No explanation. No markdown. No numbers. No extra text.
Example output:
["Tell me about a time...", "How would you design...", ...]`;

const buildUserPrompt = (role, level) => {
  const ts = new Date().toISOString();
  return `Generate **exactly 8 unique, high-quality** interview questions for a **${level}-level ${role}**.

Rules (never break):
- 4 Behavioral questions (must start with "Tell me about a time..." or "Describe a situation...")
- 4 Technical/Situational/Strategic questions
- 100% specific to ${role} and ${level} level only
- Junior = basics & learning
- Mid = ownership & mentoring
- Senior = strategy, leadership, architecture
- Make them feel completely fresh and role-specific

Current timestamp: ${ts}

Return ONLY the JSON array. Nothing else.`;
};

router.post("/generate-questions", async (req, res) => {
  try {
    let { role, level = "Mid" } = req.body;

    if (!role || typeof role !== "string" || !role.trim()) {
      return res.status(400).json({ error: "Role is required" });
    }

    role = role.trim();
    const validLevels = ["Junior", "Mid", "Senior"];
    level = validLevels.includes(level) ? level : "Mid";

    const system = buildSystemPrompt();
    const user = buildUserPrompt(role, level);

    console.log(`[Interview] Generating questions for ${level} ${role}`);

    const rawResponse = await completeWithGroq(user, system);

    console.log("[Interview] Raw Groq response:", rawResponse ? rawResponse.substring(0, 800) : "EMPTY");

    if (!rawResponse) {
      return res.status(503).json({ error: "Groq API did not respond. Try again." });
    }

    const questions = parseQuestions(rawResponse);

    console.log(`[Interview] Parsed ${questions.length} questions`);

    if (questions.length < 6) {
      console.warn("[Interview] Not enough questions parsed → using fallback parser");
      // Extra aggressive fallback
      const fallback = rawResponse
        .split(/\n+/)
        .map(l => l.replace(/^\s*[\d\.\-\*•]+\s*/, "").trim())
        .filter(l => l.length > 25 && (l.endsWith("?") || l.includes("time") || l.includes("how") || l.includes("describe")));
      
      if (fallback.length >= 6) {
        return res.json({
          success: true,
          questions: fallback.slice(0, 8),
          role,
          level,
          count: fallback.length,
          generatedAt: new Date().toISOString(),
          note: "Used fallback parser"
        });
      }
      
      return res.status(503).json({ 
        error: "Groq did not return enough questions. Please try again." 
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
    res.status(500).json({ error: "Server error generating questions" });
  }
});

function parseQuestions(text) {
  // Try JSON first
  try {
    let cleaned = text
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .replace(/^\s*[\[\{]/, "[")
      .trim();

    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      return parsed
        .filter(q => typeof q === "string" && q.trim().length > 20)
        .map(q => q.trim())
        .slice(0, 8);
    }
  } catch (e) {}

  // Aggressive line-by-line parser (handles almost everything)
  const lines = text
    .split(/\n+/)
    .map(line => line
      .replace(/^\s*[\d\.\-\*•]+\s*/, "")
      .replace(/^["']|["']$/g, "")
      .trim())
    .filter(line => line.length > 25 && (line.endsWith("?") || line.includes("time") || line.includes("how") || line.includes("describe") || line.includes("what would")));

  return [...new Set(lines)].slice(0, 8);
}

module.exports = router;