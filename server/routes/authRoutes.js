const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/Users");

const JWT_SECRET = process.env.JWT_SECRET || "atract-super-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = process.env.COOKIE_NAME || "atract_token";

// Check if MongoDB is connected
const isDbReady = () => mongoose.connection.readyState === 1;

// Cookie options for HTTP-only secure cookies
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Clear auth cookie
const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions);
};

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log("[Register] Attempting registration for:", email);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    
    const allowedRoles = ["admin", "customer"];
    const userRole = allowedRoles.includes(String(role).toLowerCase()) ? String(role).toLowerCase() : "customer";

    const normalizedEmail = String(email).trim().toLowerCase();
    
    // Check MongoDB connection state before querying
    const mongoState = mongoose.connection.readyState;
    console.log("[Register] MongoDB state:", mongoState, "(0=disconnected, 1=connected, 2=connecting, 3=disconnecting)");
    
    if (mongoState !== 1) {
      console.warn("[Register] MongoDB not connected (state:", mongoState, "). Returning error.");
      return res.status(503).json({ 
        error: "Database temporarily unavailable. Please try again in a few moments.",
        mongoState: mongoState
      });
    }
    
    console.log("[Register] Checking for existing user:", normalizedEmail);
    
    // Hash the incoming password
    const hashed = await bcrypt.hash(password, 10);

    // If user already exists, update their password and role instead of failing
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      console.log("[Register] User already exists, updating password and role:", normalizedEmail);
      user.password = hashed;
      user.role = userRole;
      user.name = (name || "").trim() || user.name || email.split("@")[0];
      await user.save();
    } else {
      console.log("[Register] Creating new user...");
      user = await User.create({
        name: (name || "").trim() || email.split("@")[0],
        email: normalizedEmail,
        password: hashed,
        role: userRole,
      });
    }
    
    console.log("[Register] User ready:", user.email, "Role:", user.role);

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.status(201).json({
      message: "Registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("[Login] Attempting login for:", email);
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check MongoDB connection state before querying
    const mongoState = mongoose.connection.readyState;
    console.log("[Login] MongoDB state:", mongoState);
    
    if (mongoState !== 1) {
      console.warn("[Login] MongoDB not connected (state:", mongoState, "). Returning error.");
      return res.status(503).json({ 
        error: "Database temporarily unavailable. Please try again in a few moments.",
        mongoState: mongoState
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    console.log("[Login] Looking for user with email:", normalizedEmail);
    
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.log("[Login] User not found");
      return res.status(401).json({ error: "Invalid email or password" });
    }
    
    console.log("[Login] User found:", user.email, "Role:", user.role);
    
    const match = await bcrypt.compare(password, user.password);
    console.log("[Login] Password match result:", match);
    
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions);
    
    console.log("[Login] Success! Token generated for user:", user.email);

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("[Login] Error:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  // Try to get token from cookie or header to invalidate if needed
  const token = req.cookies[COOKIE_NAME] || 
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer ") 
      ? req.headers.authorization.substring(7) 
      : null);
  
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
});

// Verify token (for checking auth status)
router.get("/verify", async (req, res) => {
  try {
    // First try to get token from cookie
    let token = req.cookies[COOKIE_NAME];
    
    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if MongoDB is connected
    if (!isDbReady()) {
      // If no DB, return basic info from token (demo mode)
      return res.json({
        authenticated: true,
        demo: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      });
    }
    
    // Optionally refresh user data from database
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ authenticated: false });
    }

    res.json({
      authenticated: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    clearAuthCookie(res);
    res.status(401).json({ authenticated: false });
  }
});

// Refresh token (extend session)
router.post("/refresh", async (req, res) => {
  try {
    // First try to get token from cookie
    let token = req.cookies[COOKIE_NAME];
    
    // If no cookie, try Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: "No token found" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if MongoDB is connected
    if (!isDbReady()) {
      // In demo mode, just return success without DB lookup
      return res.json({
        message: "Token refreshed (demo mode)",
        demo: true,
        user: {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role
        }
      });
    }
    
    const user = await User.findById(decoded.id);
    
    if (!user) {
      clearAuthCookie(res);
      return res.status(401).json({ error: "User not found" });
    }

    // Generate new token
    const newToken = generateToken(user);
    res.cookie(COOKIE_NAME, newToken, cookieOptions);

    res.json({
      message: "Token refreshed",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (err) {
    clearAuthCookie(res);
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
