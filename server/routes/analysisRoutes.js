const express = require("express");
const router = express.Router();
const Resume = require("../models/Resume");

// ============================================
// FREE TF-IDF VECTORIZATION & COSINE SIMILARITY
// ============================================

// Tokenize and clean text
const tokenize = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(word => word.length > 2); // Filter short words
};

// Calculate Term Frequency (TF)
const calculateTF = (tokens, vocab) => {
  const tf = new Map();
  const totalTokens = tokens.length;
  
  tokens.forEach(token => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });
  
  // Normalize by document length
  const normalizedTf = new Map();
  tf.forEach((count, token) => {
    normalizedTf.set(token, count / totalTokens);
  });
  
  return normalizedTf;
};

// Calculate Inverse Document Frequency (IDF) across all documents
const calculateIDF = (allDocuments) => {
  const idf = new Map();
  const N = allDocuments.length;
  
  // Get all unique terms
  const allTerms = new Set();
  allDocuments.forEach(doc => {
    const tokens = tokenize(doc);
    tokens.forEach(term => allTerms.add(term));
  });
  
  // Calculate IDF for each term
  allTerms.forEach(term => {
    let docCount = 0;
    allDocuments.forEach(doc => {
      if (doc.toLowerCase().includes(term)) {
        docCount++;
      }
    });
    // Smooth IDF to avoid division by zero
    idf.set(term, Math.log((N + 1) / (docCount + 1)) + 1);
  });
  
  return idf;
};

// Create TF-IDF vector for a document
const createTFIDFVector = (text, vocab, idf) => {
  const tokens = tokenize(text);
  const tf = calculateTF(tokens);
  const vector = [];
  
  vocab.forEach(term => {
    const tfValue = tf.get(term) || 0;
    const idfValue = idf.get(term) || 1;
    vector.push(tfValue * idfValue);
  });
  
  return vector;
};

// Cosine Similarity Function
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dot / denominator;
};

// Extract technical keywords with weights
const extractTechnicalKeywords = (text) => {
  const technicalPatterns = {
    // Programming Languages
    'javascript': 2.0, 'python': 2.0, 'java': 2.0, 'typescript': 2.0,
    'c++': 1.8, 'c#': 1.8, 'go': 1.8, 'rust': 1.8, 'ruby': 1.5,
    'php': 1.5, 'swift': 1.5, 'kotlin': 1.5, 'scala': 1.5,
    
    // Frameworks & Libraries
    'react': 2.0, 'angular': 1.8, 'vue': 1.8, 'nextjs': 2.0,
    'nodejs': 1.8, 'express': 1.5, 'django': 1.8, 'flask': 1.5,
    'spring': 1.8, 'fastapi': 1.5, 'rails': 1.5,
    
    // Databases
    'mysql': 1.5, 'postgresql': 1.5, 'mongodb': 1.5, 'redis': 1.5,
    'elasticsearch': 1.3, 'dynamodb': 1.3, 'firebase': 1.3,
    
    // Cloud & DevOps
    'aws': 1.8, 'azure': 1.8, 'gcp': 1.5, 'docker': 1.8,
    'kubernetes': 1.8, 'terraform': 1.5, 'jenkins': 1.5,
    'ci/cd': 1.5, 'gitlab': 1.2, 'github': 1.2,
    
    // Data Science & ML
    'machine learning': 2.0, 'deep learning': 2.0, 'tensorflow': 1.8,
    'pytorch': 1.8, 'pandas': 1.5, 'numpy': 1.5, 'scikit-learn': 1.5,
    'nlp': 1.5, 'computer vision': 1.5, 'data analysis': 1.5,
    
    // Other Technical
    'graphql': 1.5, 'rest api': 1.3, 'microservices': 1.5,
    'agile': 1.2, 'scrum': 1.2, 'git': 1.3
  };
  
  const textLower = text.toLowerCase();
  const foundKeywords = {};
  
  Object.keys(technicalPatterns).forEach(keyword => {
    if (textLower.includes(keyword)) {
      foundKeywords[keyword] = technicalPatterns[keyword];
    }
  });
  
  return foundKeywords;
};

// Extract soft skills for non-technical roles
const extractSoftSkills = (text) => {
  const softSkills = {
    'communication': 1.5, 'teamwork': 1.5, 'leadership': 1.5,
    'problem solving': 1.5, 'critical thinking': 1.5, 'analytical': 1.3,
    'organization': 1.3, 'time management': 1.3, 'adaptability': 1.3,
    'creativity': 1.3, 'interpersonal': 1.3, 'collaboration': 1.5,
    'presentation': 1.2, 'negotiation': 1.3, 'conflict resolution': 1.3,
    'customer service': 1.3, 'client relations': 1.3, 'stakeholder': 1.2,
    'project management': 1.3, 'planning': 1.2, 'strategic': 1.3,
    'decision making': 1.3, 'attention to detail': 1.2, 'multitasking': 1.2
  };
  
  const textLower = text.toLowerCase();
  const foundSkills = {};
  
  Object.keys(softSkills).forEach(skill => {
    if (textLower.includes(skill)) {
      foundSkills[skill] = softSkills[skill];
    }
  });
  
  return foundSkills;
};

// Detect if job is technical or non-technical
const detectJobType = (jdText) => {
  const technicalIndicators = [
    'developer', 'engineer', 'programmer', 'software', 'frontend', 'backend',
    'fullstack', 'devops', 'data scientist', 'machine learning', 'ai',
    'coding', 'programming', 'javascript', 'python', 'java', 'react',
    'database', 'api', 'cloud', 'aws', 'azure', 'docker', 'kubernetes',
    'tensorflow', 'pytorch', 'sql', 'node', 'framework'
  ];
  
  const nonTechnicalIndicators = [
    'manager', 'managerial', 'leadership', 'supervisor', 'executive',
    'sales', 'marketing', 'hr', 'human resources', 'recruiter',
    'customer', 'client', 'account', 'finance', 'accounting',
    'strategy', 'business', 'operations', 'administrative', 'secretary',
    'reception', 'counselor', 'advisor', 'consultant'
  ];
  
  const jdLower = jdText.toLowerCase();
  
  let techCount = 0;
  let nonTechCount = 0;
  
  technicalIndicators.forEach(ind => {
    if (jdLower.includes(ind)) techCount++;
  });
  
  nonTechnicalIndicators.forEach(ind => {
    if (jdLower.includes(ind)) nonTechCount++;
  });
  
  return techCount > nonTechCount ? 'technical' : 'non-technical';
};

// Enhanced matching with role-specific weighting
const calculateMatchScore = (jdText, resumeText, isTechnical) => {
  // Extract keywords/skills from both
  const jdTechKeywords = extractTechnicalKeywords(jdText);
  const resumeTechKeywords = extractTechnicalKeywords(resumeText);
  const jdSoftSkills = extractSoftSkills(jdText);
  const resumeSoftSkills = extractSoftSkills(resumeText);
  
  let score = 0;
  let maxScore = 0;
  let matchedKeywords = [];
  let missingKeywords = [];
  
  if (isTechnical) {
    // Technical role: prioritize technical keywords
    Object.keys(jdTechKeywords).forEach(keyword => {
      maxScore += jdTechKeywords[keyword];
      if (resumeTechKeywords[keyword]) {
        score += jdTechKeywords[keyword];
        matchedKeywords.push(keyword);
      } else {
        missingKeywords.push(keyword);
      }
    });
    
    // Soft skills bonus (30% weight for technical)
    const jdSoftKeys = Object.keys(jdSoftSkills);
    if (jdSoftKeys.length > 0) {
      maxScore += 30; // Base soft skills weight
      jdSoftKeys.forEach(skill => {
        if (resumeSoftSkills[skill]) {
          score += 10; // Each matched soft skill
          matchedKeywords.push(skill);
        }
      });
    }
  } else {
    // Non-technical role: prioritize soft skills
    Object.keys(jdSoftSkills).forEach(skill => {
      maxScore += jdSoftSkills[skill];
      if (resumeSoftSkills[skill]) {
        score += jdSoftSkills[skill];
        matchedKeywords.push(skill);
      } else {
        missingKeywords.push(skill);
      }
    });
    
    // Technical keywords bonus (20% weight for non-technical)
    const jdTechKeys = Object.keys(jdTechKeywords);
    if (jdTechKeys.length > 0) {
      maxScore += 20;
      jdTechKeys.forEach(keyword => {
        if (resumeTechKeywords[keyword]) {
          score += 10;
          matchedKeywords.push(keyword);
        }
      });
    }
  }
  
  // Additional TF-IDF based similarity (40% weight)
  const allTexts = [jdText, resumeText];
  const idf = calculateIDF(allTexts);
  const vocab = Array.from(idf.keys());
  
  const jdVector = createTFIDFVector(jdText, vocab, idf);
  const resumeVector = createTFIDFVector(resumeText, vocab, idf);
  const tfidfSimilarity = cosineSimilarity(jdVector, resumeVector);
  
  // Weighted final score
  const baseScore = maxScore > 0 ? Math.min((score / maxScore) * 60, 60) : 0;
  const similarityScore = tfidfSimilarity * 40;
  const finalScore = Math.round(baseScore + similarityScore);
  
  return {
    percentage: Math.min(finalScore, 100),
    matchedKeywords,
    missingKeywords,
    isTechnical,
    tfidfSimilarity: (tfidfSimilarity * 100).toFixed(1)
  };
};

// ============================================
// API ROUTES
// ============================================

// Match job description against stored resumes using TF-IDF
router.post("/match-job", async (req, res) => {
  try {
    const { jdText, roleType } = req.body;

    if (!jdText) {
      return res.status(400).json({ error: "Job description required" });
    }

    // Detect job type if not specified
    const jobType = roleType || detectJobType(jdText);

    // Fetch all resumes from database
    const resumes = await Resume.find();

    if (resumes.length === 0) {
      return res.json({ 
        message: "No resumes available. Please upload resumes first.",
        totalCandidates: 0,
        rankedCandidates: [],
        uploadedResumes: [],
        jobType
      });
    }

    // Calculate match scores for each resume
    const results = resumes.map((resume) => {
      const matchResult = calculateMatchScore(jdText, resume.text, jobType);
      
      return {
        id: resume._id,
        name: resume.name,
        email: resume.email,
        matchPercentage: matchResult.percentage,
        matchedKeywords: matchResult.matchedKeywords,
        missingKeywords: matchResult.missingKeywords,
        tfidfSimilarity: matchResult.tfidfSimilarity,
        isTechnical: matchResult.isTechnical,
        textPreview: resume.text.substring(0, 200) + "..."
      };
    });

    // Rank by match percentage (highest first)
    results.sort((a, b) => b.matchPercentage - a.matchPercentage);

    res.json({
      totalCandidates: results.length,
      rankedCandidates: results,
      uploadedResumes: resumes.map(r => ({ id: r._id, name: r.name, createdAt: r.createdAt })),
      jobType
    });

  } catch (error) {
    console.error("Match error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Direct resume analysis (single JD vs single resume without storage)
router.post("/analyze", async (req, res) => {
  try {
    const { jdText, resumeText, roleType } = req.body;

    if (!jdText || !resumeText) {
      return res.status(400).json({ error: "Both JD and resume text required" });
    }

    // Detect job type if not specified
    const isTechnical = roleType ? roleType === 'technical' : detectJobType(jdText);
    
    const matchResult = calculateMatchScore(jdText, resumeText, isTechnical);
    
    // Determine verdict based on percentage
    let verdict, verdictColor, verdictBg;
    if (matchResult.percentage >= 80) {
      verdict = "Excellent Match";
      verdictColor = "text-emerald-700";
      verdictBg = "bg-emerald-50";
    } else if (matchResult.percentage >= 60) {
      verdict = "Good Match";
      verdictColor = "text-blue-700";
      verdictBg = "bg-blue-50";
    } else if (matchResult.percentage >= 40) {
      verdict = "Moderate Match";
      verdictColor = "text-amber-700";
      verdictBg = "bg-amber-50";
    } else {
      verdict = "Weak Match";
      verdictColor = "text-rose-700";
      verdictBg = "bg-rose-50";
    }

    res.json({
      overallScore: matchResult.percentage,
      similarityScore: matchResult.tfidfSimilarity,
      verdict,
      verdictColor,
      verdictBg,
      matchedKeywords: matchResult.matchedKeywords,
      missingKeywords: matchResult.missingKeywords,
      isTechnical: isTechnical,
      message: `Resume matches ${matchResult.percentage}% with the job description`
    });

  } catch (error) {
    console.error("Analyze error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all stored resumes
router.get("/resumes", async (req, res) => {
  try {
    const resumes = await Resume.find().select("name email text createdAt");
    res.json({
      count: resumes.length,
      resumes: resumes.map(r => ({
        id: r._id,
        name: r.name,
        email: r.email,
        textPreview: r.text.substring(0, 100) + "...",
        createdAt: r.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
