const mongoose = require("mongoose");

// const resumeSchema = new mongoose.Schema({
//   name: String,
//   email: String,
//   text: String,
//   embedding: [Number],
//   techKeywords: [String],
//   softSkills: [String],
// }, { timestamps: true });

const ResumeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: "" },
  text: { type: String, required: true },   
  filename: { type: String, default: "" },
  filesize: { type: Number, default: 0 },
}, { timestamps: true });
module.exports = mongoose.model("Resume", ResumeSchema);
