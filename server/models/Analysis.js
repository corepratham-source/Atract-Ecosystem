const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  jdText: String,
  resumeText: String,
  overallScore: Number,
  verdict: String,
  sectionScores: Object,
  suggestions: Array,

}, { timestamps: true });

module.exports = mongoose.model("Analysis", analysisSchema);
