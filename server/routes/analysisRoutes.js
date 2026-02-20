const express = require("express");
const router = express.Router();
const Resume = require("../models/Resume");
require("dotenv").config();
const { scoreResumeVsJD, getGroqClient } = require("../utils/groq");

// ─── TF-IDF fallback — only when Groq is completely down, capped at 50 ──────
const tokenize = (t) => t.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
const calcTF = (tokens) => {
  const tf = new Map(), n = tokens.length || 1;
  tokens.forEach((t) => tf.set(t, (tf.get(t) || 0) + 1));
  const r = new Map();
  tf.forEach((c, t) => r.set(t, c / n));
  return r;
};
const calcIDF = (docs) => {
  const idf = new Map(), N = docs.length;
  const terms = new Set(docs.flatMap(tokenize));
  terms.forEach((term) => {
    let c = 0;
    docs.forEach((d) => { if (d.toLowerCase().includes(term)) c++; });
    idf.set(term, Math.log((N + 1) / (c + 1)) + 1);
  });
  return idf;
};
const tfidfVec = (text, vocab, idf) => {
  const tf = calcTF(tokenize(text));
  return vocab.map((t) => (tf.get(t) || 0) * (idf.get(t) || 1));
};
const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2; }
  const d = Math.sqrt(na) * Math.sqrt(nb);
  return d === 0 ? 0 : dot / d;
};
const getTFIDFFallback = (jd, resume) => {
  try {
    const idf = calcIDF([jd, resume]), vocab = Array.from(idf.keys());
    const raw = Math.round(cosine(tfidfVec(jd, vocab, idf), tfidfVec(resume, vocab, idf)) * 100);
    const capped = Math.min(Math.max(raw, 15), 50);
    console.log(`[TF-IDF] raw=${raw}% → capped=${capped}%`);
    return capped;
  } catch (e) {
    console.error("[TF-IDF] Error:", e.message);
    return 15;
  }
};

// ─── Job type detection ──────────────────────────────────────────────────────
const detectJobType = (jdText) => {
  const tech = [
    "developer", "programmer", "software engineer", "frontend", "backend",
    "fullstack", "devops", "data scientist", "machine learning", "javascript",
    "python", "java", "react", "nodejs", "sql", "mongodb", "aws", "azure",
    "docker", "kubernetes", "android", "ios", "data engineer", "embedded",
    "cybersecurity", "network engineer", "qa engineer", "test automation",
  ];
  const nonTech = [
    "production manager", "plant manager", "operations manager", "factory",
    "smelting", "refining", "metallurgy", "metallurgical", "furnace", "ingot",
    "casting", "lead recycling", "battery recycling", "manufacturing",
    "procurement", "supply chain", "logistics", "hr manager", "human resources",
    "sales manager", "business development", "account manager", "quality control",
    "production planning", "shift incharge", "plant head", "maintenance manager",
    "finance manager", "marketing manager", "recruiter", "business analyst",
  ];
  const low = jdText.toLowerCase();
  let t = 0, nt = 0;
  tech.forEach((k) => { if (low.includes(k)) t++; });
  nonTech.forEach((k) => { if (low.includes(k)) nt++; });
  console.log(`[JobType] tech=${t} nonTech=${nt} → ${t > nt ? "technical" : "non-technical"}`);
  if (t === 0 && nt === 0) return "technical";
  return t > nt ? "technical" : "non-technical";
};

// ─── Verdict labels ──────────────────────────────────────────────────────────
const getVerdict = (score, classification) => {
  const c = classification || "";
  if (score >= 50)
    return { verdict: score >= 75 ? "Excellent Match" : "Good Match", verdictColor: "green", verdictBg: "bg-green-50" };
  return { verdict: "Poor Match", verdictColor: "red", verdictBg: "bg-red-50" };
};

// ─── Score resolver ───────────────────────────────────────────────────────────
// AI score is AUTHORITATIVE. TF-IDF only fires when Groq is completely down.
// Never blend the two — that was the original bug causing 62% inflation.
const resolveScore = (aiResult, tfidfFallback) => {
  if (aiResult?.usedLLM === true && typeof aiResult.score === "number") {
    console.log(`[Score] ✅ AI: ${aiResult.score}% (${aiResult.model})`);
    return {
      finalScore: aiResult.score,
      classification: aiResult.classification || "",
      matchedKeywords: aiResult.matchedSkills || [],
      missingKeywords: aiResult.missingSkills || [],
      scoreBreakdown: aiResult.scoreBreakdown || {},
      criticalMismatches: aiResult.criticalMismatches || [],
      strongAlignments: aiResult.strongAlignments || [],
      detailedAnalysis: aiResult.detailedAnalysis || "",
      salaryNote: aiResult.salaryNote || null,
      usedAI: true,
      scoreSource: `AI (${aiResult.model})`,
    };
  }
  console.warn(`[Score] ⚠️ AI failed → TF-IDF fallback: ${tfidfFallback}%`);
  console.warn("[Score] ⚠️ TF-IDF cannot detect industry mismatch — score may be inaccurate");
  return {
    finalScore: tfidfFallback,
    classification:
      tfidfFallback >= 70 ? "Near perfect match" :
      tfidfFallback >= 40 ? "Almost match" : "Not at all a match",
    matchedKeywords: [],
    missingKeywords: [],
    scoreBreakdown: {},
    criticalMismatches: [],
    strongAlignments: [],
    detailedAnalysis: "TF-IDF fallback used — Groq AI unavailable",
    salaryNote: null,
    usedAI: false,
    scoreSource: "TF-IDF-FALLBACK",
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// POST /analyze
// Single JD vs single resume (no DB storage needed)
// ═══════════════════════════════════════════════════════════════════════════════
router.post("/analyze", async (req, res) => {
  try {
    const { jdText, resumeText, roleType, useAI } = req.body;

    if (!jdText || !resumeText) {
      return res.status(400).json({ error: "Both jdText and resumeText are required" });
    }

    const jobType = roleType || detectJobType(jdText);
    console.log(`\n[Analyze] ══ /analyze ══`);
    console.log(`[Analyze] jobType=${jobType} | jdLen=${jdText.length} | resumeLen=${resumeText.length}`);

    // Log first 300 chars of each so you can verify what's being sent
    console.log(`[Analyze] JD preview: ${jdText.substring(0, 300)}`);
    console.log(`[Analyze] Resume preview: ${resumeText.substring(0, 300)}`);

    const tfidfFallback = getTFIDFFallback(jdText, resumeText);

    let aiResult = null;
    if (useAI !== false) {
      aiResult = await scoreResumeVsJD({ resumeText, jdText, jobType });
      console.log(`[Analyze] AI result: score=${aiResult?.score} usedLLM=${aiResult?.usedLLM}`);
    }

    const {
      finalScore, classification, matchedKeywords, missingKeywords,
      scoreBreakdown, criticalMismatches, strongAlignments,
      detailedAnalysis, salaryNote, usedAI, scoreSource,
    } = resolveScore(aiResult, tfidfFallback);

    console.log(`[Analyze] ✅ FINAL SCORE: ${finalScore}% — ${classification} (${scoreSource})`);

    const { verdict, verdictColor, verdictBg } = getVerdict(finalScore, classification);

    return res.json({
      overallScore: finalScore,
      similarityScore: tfidfFallback,  // Add for frontend compatibility
      tfidfFallbackScore: tfidfFallback,
      aiScore: aiResult?.usedLLM ? aiResult.score : null,
      verdict,
      verdictColor,
      verdictBg,
      classification,
      matchedKeywords,
      missingKeywords,
      scoreBreakdown,
      criticalMismatches,
      strongAlignments,
      detailedAnalysis,
      salaryNote,
      isTechnical: jobType === "technical",
      jobType,
      usedAI,
      scoreSource,
      aiDetails: usedAI ? {
        strengths: aiResult.strengths || "",
        gaps: aiResult.gaps || "",
        recommendation: aiResult.recommendation || "",
        model: aiResult.model || "",
        rawBreakdown: aiResult.result || "",
      } : null,
      warning: !usedAI
        ? "⚠️ Score computed via TF-IDF fallback. Groq AI unavailable — industry-specific accuracy NOT guaranteed."
        : null,
      message: `Resume matches ${finalScore}% — ${classification}`,
    });
  } catch (err) {
    console.error("[Analyze] Unhandled error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /match-job
// Match a JD against ALL resumes stored in MongoDB
// Processes SEQUENTIALLY — not Promise.all — to avoid rate limit spikes
// ═══════════════════════════════════════════════════════════════════════════════
router.post("/match-job", async (req, res) => {
  try {
    const { jdText, roleType, useAI } = req.body;

    if (!jdText?.trim()) {
      return res.status(400).json({ error: "Job description is required" });
    }

    const jobType = roleType || detectJobType(jdText);
    console.log(`\n[Match] ══ /match-job ══`);
    console.log(`[Match] jobType=${jobType} | jdLen=${jdText.length}`);

    const resumes = await Resume.find();
    if (!resumes.length) {
      return res.json({
        message: "No resumes in database. Please upload resumes first.",
        totalCandidates: 0,
        rankedCandidates: [],
        uploadedResumes: [],
        jobType,
      });
    }

    const groqOk = !!getGroqClient();
    const aiEnabled = useAI !== false && groqOk;
    console.log(`[Match] Groq available=${groqOk} | AI enabled=${aiEnabled} | Resumes=${resumes.length}`);

    if (!groqOk) {
      console.error("[Match] ❌ Groq unavailable — check GROQ_API_KEY in .env");
    }

    // Check for resumes with empty text and warn
    const emptyTextResumes = resumes.filter((r) => !r.text || r.text.trim().length < 50);
    if (emptyTextResumes.length > 0) {
      console.warn(`[Match] ⚠️ ${emptyTextResumes.length} resume(s) have empty/short text — PDF extraction may have failed:`);
      emptyTextResumes.forEach((r) => console.warn(`  - ${r.name}: ${r.text?.length || 0} chars`));
    }

    const results = [];

    // Sequential loop — NOT Promise.all — prevents 429 rate limit storms
    for (const resume of resumes) {
      console.log(`\n[Match] ── Processing: ${resume.name} (text: ${resume.text?.length || 0} chars)`);

      // Warn if this resume has suspiciously little text
      if (!resume.text || resume.text.trim().length < 50) {
        console.warn(`[Match] ⚠️ "${resume.name}" has very little text (${resume.text?.length || 0} chars). Re-upload this resume.`);
      }

      const tfidfFallback = getTFIDFFallback(jdText, resume.text || "");

      let aiResult = null;
      if (aiEnabled) {
        try {
          aiResult = await scoreResumeVsJD({
            resumeText: resume.text || "",
            jdText,
            jobType,
          });
          console.log(`[Match] AI: ${resume.name} → score=${aiResult?.score}% usedLLM=${aiResult?.usedLLM}`);
        } catch (err) {
          console.error(`[Match] AI error for "${resume.name}":`, err.message);
        }
      }

      const {
        finalScore, classification, matchedKeywords, missingKeywords,
        scoreBreakdown, criticalMismatches, strongAlignments,
        detailedAnalysis, salaryNote, usedAI, scoreSource,
      } = resolveScore(aiResult, tfidfFallback);

      console.log(`[Match] ✅ FINAL: ${resume.name} = ${finalScore}% — ${classification} (${scoreSource})`);

      results.push({
        id: resume._id,
        name: resume.name,
        email: resume.email,
        matchPercentage: finalScore,
        tfidfFallbackScore: tfidfFallback,
        aiScore: aiResult?.usedLLM ? aiResult.score : null,
        classification,
        matchedKeywords,
        missingKeywords,
        scoreBreakdown,
        criticalMismatches,
        strongAlignments,
        detailedAnalysis,
        salaryNote,
        isTechnical: jobType === "technical",
        jobType,
        usedAI,
        scoreSource,
        aiDetails: usedAI ? {
          strengths: aiResult.strengths || "",
          gaps: aiResult.gaps || "",
          recommendation: aiResult.recommendation || "",
          model: aiResult.model || "",
          rawBreakdown: aiResult.result || "",
        } : null,
        warning: !usedAI
          ? "⚠️ TF-IDF fallback score. AI unavailable — industry accuracy not guaranteed."
          : (!resume.text || resume.text.trim().length < 50)
            ? "⚠️ Resume text was very short — PDF may not have extracted properly. Re-upload recommended."
            : null,
        textPreview: (resume.text || "").substring(0, 200) + "...",
      });
    }

    // Sort by match percentage — highest first
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);

    console.log("\n[Match] ══ Results Summary ══");
    results.forEach((r) =>
      console.log(`  ${r.name}: ${r.matchPercentage}% (${r.classification}) [${r.scoreSource}]`)
    );

    return res.json({
      totalCandidates: results.length,
      rankedCandidates: results,
      uploadedResumes: resumes.map((r) => ({
        id: r._id,
        name: r.name,
        email: r.email,
        textLength: r.text?.length || 0,
        createdAt: r.createdAt,
      })),
      jobType,
      aiAnalysisEnabled: aiEnabled,
    });
  } catch (err) {
    console.error("[Match] Unhandled error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /resumes
// List all stored resumes with text length (useful for debugging empty-text issues)
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/resumes", async (req, res) => {
  try {
    const resumes = await Resume.find().select("name email text filename createdAt");
    res.json({
      count: resumes.length,
      resumes: resumes.map((r) => ({
        id: r._id,
        name: r.name,
        email: r.email,
        filename: r.filename || "",
        textLength: r.text?.length || 0,
        textPreview: (r.text || "").substring(0, 150) + "...",
        hasText: (r.text?.length || 0) > 50,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;