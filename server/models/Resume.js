const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  name: String,
  email: String,
  text: String,
  embedding: [Number],
  techKeywords: [String],
  softSkills: [String],
}, { timestamps: true });

module.exports = mongoose.model("Resume", resumeSchema);
