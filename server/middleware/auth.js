const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "atract-super-secret-key-change-in-production";
const COOKIE_NAME = process.env.COOKIE_NAME || "atract_token";

// Middleware to authenticate JWT token from cookie
const authenticateToken = (req, res, next) => {
  // Try to get token from cookie first, then from Authorization header
  let token = req.cookies?.[COOKIE_NAME];
  
  // Also support Bearer token for API clients (like mobile apps)
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Middleware to check if user has specific role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
const optionalAuth = (req, res, next) => {
  let token = req.cookies?.[COOKIE_NAME];
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (err) {
      // Token invalid, but that's okay for optional auth
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  optionalAuth,
  JWT_SECRET
};
