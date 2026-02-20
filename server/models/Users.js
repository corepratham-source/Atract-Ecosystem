const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, required: true, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "customer"], default: "customer" },

  subscription: {
    type: {
      type: String,
      default: "free"
    },
    batchCredits: {
      type: Number,
      default: 0
    }
  },

  usage: {
    analysesUsed: {
      type: Number,
      default: 0
    }
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
