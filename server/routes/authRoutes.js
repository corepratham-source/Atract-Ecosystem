const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/Users");

const JWT_SECRET = process.env.JWT_SECRET || "atract-super-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const COOKIE_NAME = process.env.COOKIE_NAME || "atract_token";

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
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const allowedRoles = ["admin", "customer"];
    const userRole = allowedRoles.includes(String(role).toLowerCase()) ? String(role).toLowerCase() : "customer";

    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: (name || "").trim() || email.split("@")[0],
      email: String(email).trim().toLowerCase(),
      password: hashed,
      role: userRole,
    });

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.status(201).json({
      message: "Registered successfully",
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
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate JWT and set HTTP-only cookie
    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, cookieOptions);

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

// Logout
router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ message: "Logged out successfully" });
});

// Verify token (for checking auth status)
router.get("/verify", async (req, res) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
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
    const token = req.cookies[COOKIE_NAME];
    
    if (!token) {
      return res.status(401).json({ error: "No token found" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
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
