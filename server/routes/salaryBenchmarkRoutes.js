const express = require("express");
const router = express.Router();

// Dynamic salary benchmark - uses heuristics + optional LLM for richer insights
// City multipliers (approximate for India)
const CITY_MULTIPLIERS = {
  bengaluru: 1.15,
  bangalore: 1.15,
  mumbai: 1.2,
  delhi: 1.1,
  gurgaon: 1.12,
  noida: 1.05,
  hyderabad: 1.1,
  pune: 1.08,
  chennai: 1.05,
  kolkata: 0.95,
};

// Base salary by role category (approximate ₹/month)
const ROLE_BASES = {
  engineer: 45000,
  developer: 45000,
  software: 45000,
  hr: 35000,
  recruiter: 32000,
  executive: 40000,
  manager: 55000,
  lead: 65000,
  designer: 40000,
  analyst: 42000,
  marketing: 38000,
  sales: 35000,
  default: 35000,
};

function getRoleBase(role) {
  const r = (role || "").toLowerCase();
  for (const [key, base] of Object.entries(ROLE_BASES)) {
    if (key !== "default" && r.includes(key)) return base;
  }
  return ROLE_BASES.default;
}

function getCityMultiplier(location) {
  const loc = (location || "").toLowerCase();
  for (const [city, mult] of Object.entries(CITY_MULTIPLIERS)) {
    if (loc.includes(city)) return mult;
  }
  return 1;
}

router.post("/generate", async (req, res) => {
  try {
    const { role, location, experience, salary } = req.body;

    if (!role?.trim() || !location?.trim()) {
      return res.status(400).json({ error: "Role and Location are required" });
    }

    const yrs = Math.max(0, Number(experience) || 0);
    const offered = salary ? Number(salary) : null;

    const base = getRoleBase(role.trim());
    const cityMult = getCityMultiplier(location.trim());
    const expFactor = Math.min(yrs * 4000, 40000); // ~4k per year, cap at 10 yrs

    const mid = Math.round((base + expFactor) * cityMult);
    const min = Math.round(mid * 0.85);
    const max = Math.round(mid * 1.2);

    let verdict = "Within typical range";
    let notes = "Offer is roughly in line with an indicative range. Use role scope and growth to close the candidate.";
    let recommendation = "";

    if (offered && offered < min) {
      verdict = "Below typical range";
      notes = "Risk of offer rejection or early attrition. Consider adjusting or adding strong non-cash benefits.";
      recommendation = "Consider revisiting the offer or highlighting non-monetary benefits (growth, learning, flexibility).";
    } else if (offered && offered > max) {
      verdict = "Above typical range";
      notes = "Offer is generous relative to indicative range. Use this to close faster, but guard against internal parity issues.";
      recommendation = "Strong offer. Leverage for quick close. Ensure internal pay parity for similar roles.";
    }

    res.json({
      range: { min, mid, max },
      offered: offered || null,
      verdict,
      notes,
      recommendation,
      role: role.trim(),
      location: location.trim(),
      experience: yrs,
    });
  } catch (err) {
    console.error("Salary benchmark error:", err);
    res.status(500).json({ error: err.message || "Failed to generate report" });
  }
});

module.exports = router;
