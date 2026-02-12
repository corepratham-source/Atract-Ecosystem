const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const router = express.Router();

// Razorpay instance (use Test/Live keys from .env)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const PLANS = {
  basic: { amount: 9900, name: "Basic - Unlimited Analyses", receipt: "resume_basic_" },
  premium: { amount: 49900, name: "Premium - Full Access", receipt: "resume_premium_" },
  offer_letter: { amount: 19900, name: "Offer Letter - Per Letter", receipt: "offer_letter_" },
  salary_benchmark: { amount: 29900, name: "Salary Benchmark - Per Report", receipt: "salary_benchmark_" },
  follow_up_tracker: { amount: 29900, name: "Follow-up Tracker - Monthly", receipt: "follow_up_tracker_" },
};

// Create Razorpay order
router.post("/create-order", async (req, res) => {
  try {
    const { plan } = req.body;
    const planConfig = PLANS[plan];

    if (!planConfig) {
      return res.status(400).json({ error: "Invalid plan. Use 'basic', 'premium', 'offer_letter', 'salary_benchmark', or 'follow_up_tracker'." });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      return res.status(503).json({
        error: "Payment gateway not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env",
      });
    }

    const options = {
      amount: planConfig.amount,
      currency: "INR",
      receipt: planConfig.receipt + Date.now(),
      notes: { plan },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    res.status(500).json({
      error: err.message || "Failed to create order",
    });
  }
});

// Verify payment signature
router.post("/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing payment details" });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature - payment verification failed" });
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ error: err.message || "Verification failed" });
  }
});

module.exports = router;
