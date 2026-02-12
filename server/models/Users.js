const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,

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
