// const express = require("express");
// const router = express.Router();
// const { completeWithGroq } = require("../utils/groq");

// // Dynamic offer letter generation using LLM (Groq)

// const buildPrompt = (form) => {
//   return `You are an expert HR professional. Generate a professional, formal offer letter using ONLY the following details.

// Details:
// - Company: ${form.company || "[Company Name]"}
// - Candidate: ${form.candidate || "[Candidate Name]"}
// - Role/Position: ${form.role || "[Role]"}
// - Department: ${form.department || "General"}
// - Start Date: ${form.startDate || "To be decided"}
// - Location: ${form.location || "To be decided"}
// - Monthly Salary (₹): ${form.salary ? form.salary : "As per company standards"}
// - HR/Manager Name: ${form.managerName || form.company + " HR Team"}
// - Manager Title: ${form.managerTitle || "HR Manager"}
// - Work Mode: ${form.workMode || "Hybrid"}
// - Probation Period: ${form.probationPeriod || "3 months"}
// - Working Hours: ${form.workingHours || "9:00 AM - 6:00 PM"}
// - Benefits: ${form.benefits || "As per company policy"}
// - Leave Policy: ${form.leavePolicy || "As per company policy"}
// - Notice Period: ${form.noticePeriod || "15 days"}

// Requirements:
// - Use today's date in DD Month YYYY format
// - Format as a formal business letter with proper letterhead
// - Include: Company letterhead/header, Date, Candidate address (with placeholder), Subject line, Salutation, Multiple body paragraphs covering all terms, Benefits section, Acceptance deadline (7 days from today), Closing with signature block
// - Make it realistic and professional - use actual values provided
// - Salary: format as ₹XX,XX,XXX per month (gross) if provided
// - Include standard employment terms: working hours, work mode, probation, benefits, leave policy, notice period
// - Professional tone, no placeholders - use the exact values provided
// - Return ONLY the offer letter text, no markdown, no extra commentary

// Today's date for reference: ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`;
// };

// async function generateWithGroq(form) {
//   const text = await completeWithGroq(buildPrompt(form));
//   return text || "";
// }

// function fallbackLetter(form) {
//   const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
//   const salary = form.salary ? `₹${parseInt(form.salary).toLocaleString("en-IN")}` : "As per company standards";
  
//   return `═══════════════════════════════════════════════════════════════
//                          ${(form.company || "[COMPANY NAME]").toUpperCase()}
//                     Corporate Office, India
// ═══════════════════════════════════════════════════════════════════════

// Date: ${today}

// To,
// ${form.candidate || "[Candidate Name]"}
// ${form.location || "[City, State]"}

// Subject: Offer of Employment – ${form.role || "[Position]"}

// Dear ${form.candidate || "[Candidate Name]"},

// We are pleased to offer you the position of ${form.role || "[Position]"} in our ${form.department || "General"} department at ${form.company || "[Company Name]"}.

// EMPLOYMENT DETAILS:

// Position        : ${form.role || "[Position]"}
// Department      : ${form.department || "General"}
// Start Date      : ${form.startDate || "To be decided"}
// Location        : ${form.location || "[Location]"}
// Work Mode       : ${form.workMode || "Hybrid"}
// Working Hours   : ${form.workingHours || "9:00 AM - 6:00 PM"}
// Salary          : ${salary} per month (Gross)

// PROBATION & BENEFITS:

// Probation Period: ${form.probationPeriod || "3 months"}
// Benefits        : ${form.benefits || "Health insurance, PF, and other benefits as per company policy"}
// Leave Policy    : ${form.leavePolicy || "As per company policy"}
// Notice Period   : ${form.noticePeriod || "15 days"} during probation (30 days after confirmation)

// This offer is contingent upon:
// • Verification of all original educational and professional credentials
// • Successful completion of background verification
// • Submission of required documents (ID proof, Address proof, Bank details, etc.)

// Please confirm your acceptance of this offer by signing and returning the duplicate copy of this letter within 7 days from the date of this letter.

// We look forward to welcoming you to our team.

// For ${form.company || "[Company Name]"},

// _________________________
// ${form.managerName || "[HR Manager Name]"}
// ${form.managerTitle || "HR Manager"}

// I, ${form.candidate || "[Candidate Name]"}, hereby accept the above terms and conditions of employment.

// _________________________                    _________________________
// Candidate Signature                         Date

// _________________________
// Witness Signature
// `;

// }

// router.post("/generate", async (req, res) => {
//   try {
//     const form = req.body;

//     if (!form || !form.role || !form.company || !form.candidate) {
//       return res.status(400).json({ error: "Company, Candidate, and Role are required" });
//     }

//     let letter = "";

//     try {
//       letter = await generateWithGroq(form) || "";
//     } catch (apiError) {
//       console.log("Groq API error, using fallback:", apiError.message);
//       letter = "";
//     }

//     // Fallback if no API or API failed
//     if (!letter || letter.length < 50) {
//       letter = fallbackLetter(form);
//     }

//     res.json({ letter });
//   } catch (err) {
//     console.error("Offer letter generation error:", err);
//     try {
//       const letter = fallbackLetter(req.body);
//       return res.json({ letter });
//     } catch (fallbackErr) {
//       res.status(500).json({ error: err.message || "Failed to generate offer letter" });
//     }
//   }
// });

// module.exports = router;


// server/routes/offerLetterRoutes.js
const express = require("express");
const router = express.Router();
const { completeWithGroq } = require("../utils/groq");

// Perfect prompt to match your image style
const buildPrompt = (form) => {
  const today = new Date().toLocaleDateString("en-IN", { 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  });

  return `You are a senior HR executive writing a beautiful, clean, professional offer letter exactly in the style of a high-quality corporate letter.

Generate the full offer letter using these details:

Company Name     : ${form.company || "Your Company Name"}
Candidate        : ${form.candidate || "Candidate Name"}
Role             : ${form.role || "Position"}
Department       : ${form.department || "Department"}
Start Date       : ${form.startDate || "Immediately"}
Location         : ${form.location || "Bengaluru"}
Monthly Salary   : ${form.salary ? `₹${Number(form.salary).toLocaleString("en-IN")}` : "As per company policy"}
Work Mode        : ${form.workMode || "Hybrid"}
Manager Name     : ${form.managerName || "HR Manager"}

Requirements (follow exactly):
- Start with company name in big bold letters on the left
- Put company address on the right side
- Add today's date: ${today}
- Then "To," followed by candidate name and location
- Subject line: Offer of Employment – [Role]
- Professional salutation: Dear [Candidate],
- 4-5 clean paragraphs explaining the offer
- Use **bold** for section headings like **Employment Details**
- List key details neatly (Position, Department, Salary, etc.)
- End with warm closing and signature block
- NO horizontal lines, NO dashes, NO borders, NO "════"
- Use proper spacing and newlines for perfect formatting

Return ONLY the complete offer letter text. Nothing else.`;
};

// Super clean fallback (matches image style perfectly)
function fallbackLetter(form) {
  const today = new Date().toLocaleDateString("en-IN", { 
    day: "numeric", 
    month: "long", 
    year: "numeric" 
  });

  const salary = form.salary 
    ? `₹${Number(form.salary).toLocaleString("en-IN")} per month (Gross)` 
    : "As per company policy";

  return `${form.company || "Your Company Name"}
Corporate Office, Bengaluru, India

Date: ${today}

To,
${form.candidate || "Candidate Name"}
${form.location || "Bengaluru, Karnataka"}

Subject: Offer of Employment – ${form.role || "Position"}

Dear ${form.candidate || "Candidate Name"},

We are delighted to extend this formal offer of employment for the position of **${form.role || "Position"}** in our ${form.department || "Department"} department at ${form.company || "Your Company Name"}.

**Employment Details**

Position          : ${form.role || "Position"}
Department        : ${form.department || "Department"}
Reporting To      : ${form.managerName || "HR Manager"}
Start Date        : ${form.startDate || "To be mutually decided"}
Location          : ${form.location || "Bengaluru"}
Work Mode         : ${form.workMode || "Hybrid"}
Monthly Salary    : ${salary}

You will undergo a probation period of 3 months, during which either party may terminate the employment with 15 days' notice. Upon successful completion of probation, the notice period will be 30 days.

You will be entitled to all standard company benefits including health insurance, provident fund, gratuity, paid leaves, and other perks as per company policy.

Please review and sign the duplicate copy of this letter and return it to us within 7 days to confirm your acceptance.

We are very excited to welcome you to the team and look forward to your valuable contributions.

Warm regards,

${form.managerName || "HR Manager"}
HR Department
${form.company || "Your Company Name"}
Phone: +91 98765 43210
Email: hr@yourcompany.com

────────────────────────────────────

I accept the terms and conditions of this offer.

______________________________          ________________
Candidate Signature                            Date

${form.candidate || "Candidate Name"}
`;
}

router.post("/generate", async (req, res) => {
  try {
    const form = req.body;

    if (!form.company?.trim() || !form.candidate?.trim() || !form.role?.trim()) {
      return res.status(400).json({ error: "Company, Candidate, and Role are required" });
    }

    let letter = "";

    try {
      letter = await completeWithGroq(buildPrompt(form)) || "";
    } catch (e) {
      console.log("[Offer Letter] Groq failed, using clean fallback");
    }

    // Use fallback if Groq returns poor output
    if (!letter || letter.length < 200 || letter.includes("════")) {
      letter = fallbackLetter(form);
    }

    res.json({ letter });

  } catch (err) {
    console.error(err);
    res.json({ letter: fallbackLetter(req.body) });
  }
});

module.exports = router;