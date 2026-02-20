// const Groq = require("groq-sdk");

// const LLM_ENABLED = String(process.env.MATCHING_LLM_ENABLED || "true").toLowerCase() === "true";
// const GROQ_API_KEY = process.env.GROQ_API_KEY;

// const MODEL_FALLBACK_CHAIN = [
//   "llama-3.3-70b-versatile",
//   "meta-llama/llama-4-scout-17b-16e-instruct",
//   "llama-3.1-8b-instant",
// ];

// let client = null;

// function getGroqClient() {
//   if (!LLM_ENABLED) { console.log("[Groq] Disabled"); return null; }
//   if (!GROQ_API_KEY) { console.error("[Groq] GROQ_API_KEY missing!"); return null; }
//   if (!client) { client = new Groq({ apiKey: GROQ_API_KEY }); console.log("[Groq] Initialized"); }
//   return client;
// }

// // Sequential queue — prevents simultaneous calls causing 429s
// let _queue = Promise.resolve();
// function enqueue(fn) {
//   const r = _queue.then(() => fn());
//   _queue = r.catch(() => {});
//   return r;
// }

// function parseScore(text) {
//   const t = String(text || "").replace(/<\|.*?\|>/g, "").trim();
//   console.log("[Groq] Output:\n" + t.substring(0, 500));
//   for (const p of [
//     /MATCH_SCORE:\s*(\d+)/i,
//     /score[:\s]+(\d+)%/i,
//     /(\d+)%\s*match/i,
//     /overall[:\s]+(\d+)/i,
//   ]) {
//     const m = t.match(p);
//     if (m) {
//       const s = Math.min(100, Math.max(0, Number(m[1])));
//       console.log("[Groq] Parsed score:", s);
//       return { score: s, raw: t };
//     }
//   }
//   console.error("[Groq] Failed to parse score");
//   return { score: null, raw: t };
// }

// function extractList(text, label) {
//   const m = text.match(new RegExp(`${label}[:\\s]+([^\\n]+)`, "i"));
//   if (!m) return [];
//   return m[1].split(/,|;/).map((s) => s.replace(/^[-*\s]+/, "").trim())
//     .filter((s) => s.length > 1 && !["none","n/a","na","-"].includes(s.toLowerCase()));
// }

// function extractLine(text, label) {
//   const m = text.match(new RegExp(`${label}[:\\s]+([^\\n]+)`, "i"));
//   return m ? m[1].trim() : "";
// }

// // Industry mismatch detector — used for safety cap only
// function isClearMismatch(resumeText, jdText) {
//   const r = resumeText.toLowerCase();
//   const j = jdText.toLowerCase();
//   const resumeIsPlastics = ["plastic","polym","injection mould","moulding","cipet",
//     "thin wall","pipe fitting"," pp "," pe "," abs "," pvc "].some((k) => r.includes(k));
//   const resumeIsIT = ["software developer","javascript developer","python developer",
//     "react developer","frontend developer","backend developer","full stack developer"].some((k) => r.includes(k));
//   const jdIsMetallurgy = ["smelt","refin","metallurg","furnace","ingot","lead recycl",
//     "battery recycl","slag","flux","alloying","rml"].some((k) => j.includes(k));
//   const jdIsHeavyMfg = ["blast furnace","steel plant","foundry","die casting"].some((k) => j.includes(k));
//   return (resumeIsPlastics && (jdIsMetallurgy || jdIsHeavyMfg)) ||
//          (resumeIsIT && (jdIsMetallurgy || jdIsHeavyMfg));
// }

// async function _callGroqNow(systemPrompt, userPrompt) {
//   const groqClient = getGroqClient();
//   if (!groqClient) return null;

//   for (const model of MODEL_FALLBACK_CHAIN) {
//     let attempts = 3;
//     while (attempts > 0) {
//       try {
//         console.log(`[Groq] Trying: ${model}`);
//         const res = await groqClient.chat.completions.create({
//           model,
//           temperature: 0.1,
//           max_completion_tokens: 350,
//           messages: [
//             { role: "system", content: systemPrompt },
//             { role: "user",   content: userPrompt   },
//           ],
//         });
//         const content = res?.choices?.[0]?.message?.content;
//         if (content?.trim().length > 10) {
//           console.log(`[Groq] ✓ ${model} responded`);
//           return { model, content: content.trim() };
//         }
//         break;
//       } catch (err) {
//         if (err.message?.includes("429")) {
//           const wm = err.message.match(/try again in ([0-9.]+)s/i);
//           const ms = wm ? Math.ceil(parseFloat(wm[1]) * 1000) + 500 : 6000;
//           console.warn(`[Groq] 429 on ${model}. Waiting ${ms}ms...`);
//           await new Promise((r) => setTimeout(r, ms));
//           attempts--;
//         } else {
//           console.warn(`[Groq] ${model} error: ${err.message}`);
//           break;
//         }
//       }
//     }
//   }
//   console.error("[Groq] All models failed");
//   return null;
// }

// function callGroq(sys, usr) {
//   return enqueue(() => _callGroqNow(sys, usr));
// }

// // =============================================================================
// // THE SINGLE SCORING FUNCTION — called by both /analyze and /match-job
// // =============================================================================
// async function scoreResumeVsJD({ resumeText, jdText, jobType }) {
//   const FAIL = { usedLLM: false, result: "FAILED" };
//   if (!resumeText || !jdText || !getGroqClient()) return FAIL;

//   const jd  = jdText.substring(0, 1000);
//   const res = resumeText.substring(0, 1000);
//   const isTech = jobType !== "non-technical";

//   let systemPrompt, userPrompt;

//   if (isTech) {
//     systemPrompt = `You are a strict technical recruiter scoring resumes 0-100.
// - Score based on actual technical skills overlap only
// - Missing required tech stack = maximum 50
// - Wrong tech domain entirely = maximum 40
// - Never give 0 unless the resume is completely blank or totally unrelated`;

//     userPrompt = `Score this resume vs JD for a TECHNICAL role.

// SCORING WEIGHTS (total 100):
// - Technical Skills Match: 40pts
// - Role & Seniority: 20pts  
// - Years of Experience: 20pts
// - Domain Context: 10pts
// - Education: 10pts

// IMPORTANT: Score must be between 1-100. Never output 0.

// OUTPUT (exact format only):
// MATCH_SCORE: [1-100]
// MATCHED_SKILLS: s1, s2
// MISSING_SKILLS: s1, s2
// STRENGTHS: [one line]
// GAPS: [one line]
// FINAL_RECOMMENDATION: Reject/Borderline/Strong Match/Excellent Match

// JD: ${jd}
// RESUME: ${res}`;

//   } else {
//     systemPrompt = `You are a strict HR recruiter scoring resumes 0-100 for non-technical roles.

// SCORING PHILOSOPHY — Partial credit always applies:
// Every candidate has SOME transferable value. Even a complete industry mismatch scores 15-40% 
// because general management skills, documentation, safety awareness, and leadership have 
// partial transferability. Never score 0 unless the resume is completely blank.

// INDUSTRY MISMATCH SCORING GUIDE:
// - Complete industry mismatch (e.g., plastics vs metallurgy): 20-38%
//   Give points for: general production management (partial), safety practices (partial),
//   team/manpower handling (partial), documentation skills (partial)
//   Deduct heavily for: wrong industry processes, wrong materials, wrong equipment knowledge
// - Partial industry overlap: 40-60%
// - Same industry, different role: 55-70%
// - Same industry, same role: 70-100%

// WEIGHT BREAKDOWN (total 100):
// - Industry/Domain Match: 35pts
//   * Same industry = 28-35pts
//   * Adjacent industry = 15-27pts  
//   * Different industry entirely = 5-12pts (still gives partial credit)
// - Role & Duties Match: 25pts
//   * Same duties in same industry = 20-25pts
//   * Similar management experience in wrong industry = 8-14pts
//   * Different role type = 3-8pts
// - Years of Experience (in any relevant capacity): 20pts
//   * Right industry + right years = 16-20pts
//   * Wrong industry but significant experience = 5-10pts
// - Process/Technical Knowledge: 15pts
//   * Exact process match = 12-15pts
//   * General manufacturing knowledge = 3-6pts
//   * No overlap = 0-3pts
// - Education: 5pts

// HARD CEILING: Different industry candidate CANNOT score above 42%.`;

//     userPrompt = `Score this resume vs JD for a NON-TECHNICAL manufacturing/operations role.

// Apply the partial credit system. Score between 15-42% for industry mismatch cases.
// Score between 42-70% for partial industry matches.
// Score 70%+ only for same-industry candidates.

// STEP 1: Identify the JD industry and candidate's industry
// STEP 2: Check if same industry, adjacent, or completely different
// STEP 3: Award partial credit in each category using the weights
// STEP 4: Sum up — mismatch candidates typically land 20-38%

// OUTPUT (exact format, no extra text):
// MATCH_SCORE: [15-100, never 0]
// MATCHED_SKILLS: s1, s2, s3 (list any genuinely transferable skills)
// MISSING_SKILLS: s1, s2, s3
// STRENGTHS: [what the candidate genuinely brings even if wrong industry]
// GAPS: [the critical industry/process gaps]
// FINAL_RECOMMENDATION: Reject/Borderline/Strong Match/Excellent Match

// JD: ${jd}
// RESUME: ${res}`;
//   }

//   try {
//     const result = await callGroq(systemPrompt, userPrompt);
//     if (!result) return FAIL;

//     const { score, raw } = parseScore(result.content);
//     if (score === null) return FAIL;

//     // Safety net: if model returns 0, give minimum meaningful score
//     let finalScore = score;
//     if (finalScore === 0) {
//       finalScore = isTech ? 5 : 20;
//       console.warn(`[Groq] Model returned 0 — setting minimum: ${finalScore}%`);
//     }

//     // Safety cap: if model ignores the 42% ceiling for clear mismatches
//     if (!isTech && finalScore > 42 && isClearMismatch(resumeText, jdText)) {
//       console.warn(`[Groq] Model returned ${finalScore}% but industry mismatch detected → capping at 38%`);
//       finalScore = 38;
//     }

//     console.log(`[Groq] ✅ Final score: ${finalScore}% via ${result.model}`);
//     return {
//       usedLLM: true,
//       score: finalScore,
//       matchedSkills: extractList(raw, "MATCHED_SKILLS"),
//       missingSkills: extractList(raw, "MISSING_SKILLS"),
//       strengths: extractLine(raw, "STRENGTHS"),
//       gaps: extractLine(raw, "GAPS"),
//       recommendation: finalScore <= 42 ? "Reject" : extractLine(raw, "FINAL_RECOMMENDATION"),
//       result: raw,
//       model: result.model,
//     };
//   } catch (err) {
//     console.error("[Groq] scoreResumeVsJD error:", err.message);
//     return FAIL;
//   }
// }

// async function matchResumeToJD({ resumeText, jdText, jobType = "technical" }) {
//   console.log(`[Groq] matchResumeToJD | jobType=${jobType}`);
//   return scoreResumeVsJD({ resumeText, jdText, jobType });
// }

// async function completeWithGroq(prompt, systemMessage, options = {}) {
//   const g = getGroqClient();
//   if (!g) return null;
//   for (const model of MODEL_FALLBACK_CHAIN) {
//     try {
//       const c = await g.chat.completions.create({
//         model, temperature: options.temperature ?? 0.3,
//         max_completion_tokens: options.max_tokens ?? 600,
//         messages: [{ role: "system", content: systemMessage }, { role: "user", content: prompt }],
//       });
//       const content = c?.choices?.[0]?.message?.content;
//       if (content?.trim()) return String(content);
//     } catch (e) { console.warn(`[Groq] legacy ${model}: ${e.message}`); }
//   }
//   return null;
// }

// module.exports = { matchResumeToJD, scoreResumeVsJD, completeWithGroq, getGroqClient, MODEL_FALLBACK_CHAIN };

const Groq = require("groq-sdk");

const LLM_ENABLED = String(process.env.MATCHING_LLM_ENABLED || "true").toLowerCase() === "true";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const MODEL_FALLBACK_CHAIN = [
  "llama-3.3-70b-versatile",
  "meta-llama/llama-4-scout-17b-16e-instruct",
  "llama-3.1-8b-instant",
];

let client = null;

function getGroqClient() {
  if (!LLM_ENABLED) { console.log("[Groq] Disabled"); return null; }
  if (!GROQ_API_KEY) { console.error("[Groq] GROQ_API_KEY missing!"); return null; }
  if (!client) { client = new Groq({ apiKey: GROQ_API_KEY }); console.log("[Groq] Initialized"); }
  return client;
}

// Sequential queue — prevents simultaneous calls causing 429s
let _queue = Promise.resolve();
function enqueue(fn) {
  const r = _queue.then(() => fn());
  _queue = r.catch(() => {});
  return r;
}

async function _callGroqNow(systemPrompt, userPrompt) {
  const g = getGroqClient();
  if (!g) return null;

  for (const model of MODEL_FALLBACK_CHAIN) {
    let attempts = 3;
    while (attempts > 0) {
      try {
        console.log(`[Groq] Trying: ${model}`);
        const res = await g.chat.completions.create({
          model,
          temperature: 0.1,
          max_completion_tokens: 900,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });
        const content = res?.choices?.[0]?.message?.content;
        if (content?.trim().length > 20) {
          console.log(`[Groq] ✓ ${model} responded (${content.length} chars)`);
          return { model, content: content.trim() };
        }
        console.warn(`[Groq] Empty response from ${model}`);
        break;
      } catch (err) {
        if (err.message?.includes("429")) {
          const wm = err.message.match(/try again in ([0-9.]+)s/i);
          const ms = wm ? Math.ceil(parseFloat(wm[1]) * 1000) + 800 : 8000;
          console.warn(`[Groq] 429 on ${model}. Waiting ${ms}ms...`);
          await new Promise((r) => setTimeout(r, ms));
          attempts--;
        } else {
          console.warn(`[Groq] ${model} error: ${err.message}`);
          break;
        }
      }
    }
  }
  console.error("[Groq] All models failed");
  return null;
}

function callGroq(sys, usr) {
  return enqueue(() => _callGroqNow(sys, usr));
}

function parseJSONResponse(text) {
  let cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/gi, "").trim();
  try { return JSON.parse(cleaned); } catch (_) {}
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0, end = -1;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) {
    const open = (cleaned.match(/\{/g) || []).length;
    const close = (cleaned.match(/\}/g) || []).length;
    try { return JSON.parse(cleaned + "}".repeat(Math.max(0, open - close))); } catch (_) { return null; }
  }
  try { return JSON.parse(cleaned.substring(start, end + 1)); } catch (_) { return null; }
}

// =============================================================================
// MAIN SCORING FUNCTION
// Sends raw extracted text directly — model reads and scores itself
// =============================================================================
async function scoreResumeVsJD({ resumeText, jdText, jobType }) {
  const FAIL = { usedLLM: false, result: "FAILED" };
  if (!getGroqClient()) return FAIL;

  // ── Validate we actually have text ─────────────────────────────────────────
  const resumeClean = (resumeText || "").trim();
  const jdClean = (jdText || "").trim();

  if (resumeClean.length < 30) {
    console.error(`[Groq] Resume text too short (${resumeClean.length} chars) — PDF extraction likely failed`);
    return { usedLLM: true, score: 10, classification: "Not at all a match",
      scoreBreakdown: {}, criticalMismatches: ["Resume text could not be extracted from PDF"],
      strongAlignments: [], detailedAnalysis: "PDF text extraction failed — please re-upload the resume",
      salaryNote: null, matchedSkills: [], missingSkills: [], strengths: "", gaps: "PDF extraction failed",
      recommendation: "Not at all a match", result: "", model: "none" };
  }

  if (jdClean.length < 30) {
    console.error(`[Groq] JD text too short (${jdClean.length} chars)`);
    return FAIL;
  }

  // ── Log extracted text so you can verify what's being sent ─────────────────
  console.log(`[Groq] ── Resume text (first 400 chars) ──`);
  console.log(resumeClean.substring(0, 400));
  console.log(`[Groq] ── JD text (first 400 chars) ──`);
  console.log(jdClean.substring(0, 400));
  console.log(`[Groq] Resume: ${resumeClean.length} chars | JD: ${jdClean.length} chars`);

  const jd = jdClean.substring(0, 1800);
  const resume = resumeClean.substring(0, 1800);

  const systemPrompt = `You are an expert AI recruitment evaluator.

TASK: Read the raw job description and raw resume text below, then score the candidate match.

CRITICAL RULES:
1. READ THE RAW TEXT YOURSELF — extract all information by reading it carefully
2. PDF-extracted text may have odd spacing or line breaks — still read it and find the data
3. NEVER return final_score of 0 unless the resume is completely blank/unreadable
4. A wrong-industry candidate still scores 15-35% for general transferable skills
5. If salary/location data is missing → EXCLUDE those parameters and re-normalize weights
6. Always find SOMETHING to score — experience years, education, any skills mentioned

SCORING FRAMEWORK (total = 100 points):

1. EXPERIENCE MATCH (25pts):
   Find years of experience from resume dates or statements.
   - Under minimum required → 0-8pts
   - Within JD range → 20-25pts  
   - Slightly over max → 15-18pts
   - Cannot determine from text → 8pts (partial, do not give 0)

2. LOCATION MATCH (15pts):
   Find candidate city/location from resume address section.
   - Exact city match → 15pts | Same region → 8pts | Different → 0pts
   - Cannot determine → EXCLUDE this parameter, re-normalize

3. SALARY COMPATIBILITY (15pts):
   Find current salary from resume if stated.
   - If NOT found → EXCLUDE, re-normalize, note in salary_note
   - Offered ≥10% above current → 15pts | Below threshold → 0pts

4. EDUCATION MATCH (15pts):
   Find degree and field from resume.
   - Exact required qualification → 15pts
   - Related field → 8-12pts
   - Unrelated field → 3-6pts
   - Not mentioned → 5pts (partial)

5. MANAGEMENT & LEADERSHIP (15pts):
   Does resume show people/team management?
   - Full match → 15pts | Partial → 8-12pts | Missing but required → 4-5pts

6. SKILL & DOMAIN RELEVANCE (15pts):
   Compare resume skills vs JD mandatory skills.
   - Same industry, strong match → 12-15pts
   - Adjacent industry → 5-9pts
   - Completely different industry → 1-4pts

7. INTELLIGENT CAREER ASSESSMENT (10pts):
   Industry alignment, career progression, stability.
   - Perfect alignment → 8-10pts | Partial → 4-6pts | Mismatch → 2-3pts

NORMALIZATION: If salary or location excluded, redistribute their weights proportionally across remaining categories.

CLASSIFICATION:
0–39  → "Not at all a match"
40–69 → "Almost match"
70–100 → "Near perfect match"

Return ONLY valid JSON. No markdown. No extra text.`;

  const userPrompt = `Evaluate this candidate against the job below.

READ THE RAW TEXT CAREFULLY. Extract all information yourself.
Even with messy formatting, find: years of experience, location, education, skills, industry.

JOB DESCRIPTION:
${jd}

CANDIDATE RESUME:
${resume}

Return this exact JSON structure:
{
  "final_score": <number 15-100, never 0 for non-blank resume>,
  "classification": <"Not at all a match" | "Almost match" | "Near perfect match">,
  "score_breakdown": {
    "experience": <number or "excluded">,
    "location": <number or "excluded">,
    "salary": <number or "excluded">,
    "education": <number>,
    "management": <number>,
    "skills": <number>,
    "intelligent_assessment": <number>
  },
  "critical_mismatches": [<strings listing key gaps>],
  "strong_alignment_areas": [<strings listing genuine strengths>],
  "detailed_analysis": <"one clear paragraph explaining the score">,
  "salary_note": <"string if salary excluded, else omit this field">
}`;

  try {
    const result = await callGroq(systemPrompt, userPrompt);
    if (!result) return FAIL;

    console.log("[Groq] Raw output:\n" + result.content.substring(0, 700));

    const parsed = parseJSONResponse(result.content);
    if (!parsed || typeof parsed.final_score !== "number") {
      console.error("[Groq] JSON parse failed");
      return FAIL;
    }

    let finalScore = Math.min(100, Math.max(0, Math.round(parsed.final_score)));

    // Safety floor: non-blank resume should never show 0
    if (finalScore === 0 && resumeClean.length > 100) {
      console.warn("[Groq] Score was 0 for non-blank resume → setting floor 15%");
      finalScore = 15;
    }

    const classification = parsed.classification ||
      (finalScore >= 70 ? "Near perfect match" : finalScore >= 40 ? "Almost match" : "Not at all a match");

    console.log(`[Groq] ✅ Score: ${finalScore}% | ${classification} | ${result.model}`);

    return {
      usedLLM: true,
      score: finalScore,
      classification,
      scoreBreakdown: parsed.score_breakdown || {},
      criticalMismatches: parsed.critical_mismatches || [],
      strongAlignments: parsed.strong_alignment_areas || [],
      detailedAnalysis: parsed.detailed_analysis || "",
      salaryNote: parsed.salary_note || null,
      matchedSkills: parsed.strong_alignment_areas || [],
      missingSkills: parsed.critical_mismatches || [],
      strengths: (parsed.strong_alignment_areas || []).join("; "),
      gaps: (parsed.critical_mismatches || []).join("; "),
      recommendation: classification,
      result: result.content,
      model: result.model,
    };
  } catch (err) {
    console.error("[Groq] scoreResumeVsJD error:", err.message);
    return FAIL;
  }
}

async function matchResumeToJD({ resumeText, jdText, jobType = "technical" }) {
  console.log(`[Groq] matchResumeToJD | jobType=${jobType} | resumeLen=${resumeText?.length} | jdLen=${jdText?.length}`);
  return scoreResumeVsJD({ resumeText, jdText, jobType });
}

async function completeWithGroq(prompt, systemMessage, options = {}) {
  const g = getGroqClient();
  if (!g) return null;
  for (const model of MODEL_FALLBACK_CHAIN) {
    try {
      const c = await g.chat.completions.create({
        model, temperature: options.temperature ?? 0.3,
        max_completion_tokens: options.max_tokens ?? 600,
        messages: [{ role: "system", content: systemMessage }, { role: "user", content: prompt }],
      });
      const content = c?.choices?.[0]?.message?.content;
      if (content?.trim()) return String(content);
    } catch (e) { console.warn(`[Groq] legacy ${model}: ${e.message}`); }
  }
  return null;
}

module.exports = { matchResumeToJD, scoreResumeVsJD, completeWithGroq, getGroqClient, MODEL_FALLBACK_CHAIN };