import mongoose from "mongoose";
import User from "./user.model.js";

/* ──────────────────────────────────────────────────────────────── */
/*  Agent cost mapping — single source of truth                   */
/* ──────────────────────────────────────────────────────────────── */

export const AGENT_COST = {
  chat: 1,
  search: 5,
  coding: 10,
  pdf: 10,
  ppt: 10,
  vision: 10,
  pdfRag: 15,
  imageAnalyzer: 10,
};

/* ──────────────────────────────────────────────────────────────── */
/*  CreditError — domain error                                   */
/* ──────────────────────────────────────────────────────────────── */

export class CreditError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = "CreditError";
    this.code = code;
    this.details = details;
  }
}

/* ──────────────────────────────────────────────────────────────── */
/*  DEDUCT CREDITS — core logic                                  */
/*  Called by: auth.controller.js (HTTP)                         */
/*            agent/utils/deductCredits.js (direct)              */
/* ──────────────────────────────────────────────────────────────── */

export async function deductCreditsService({ userId, agent }) {
  /* ─── 1. Input validation ──────────────────────────────────── */
  if (!userId) {
    throw new CreditError("userId is required", "MISSING_USER_ID");
  }
  if (!agent) {
    throw new CreditError("agent is required", "MISSING_AGENT");
  }

  const cost = AGENT_COST[agent];
  if (typeof cost !== "number") {
    throw new CreditError(
      `Unknown agent: "${agent}"`,
      "UNKNOWN_AGENT",
      { validAgents: Object.keys(AGENT_COST) },
    );
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new CreditError("Invalid userId format", "INVALID_USER_ID");
  }

  /* ─── 2. User check ────────────────────────────────────────── */
  const user = await User.findById(userId).select(
    "credits planExpiresAt",
  );
  if (!user) {
    throw new CreditError("User not found", "USER_NOT_FOUND");
  }

  /* ─── 3. Plan expiry check ────────────────────────────────── */
  if (user.planExpiresAt && user.planExpiresAt < new Date()) {
    throw new CreditError(
      "Your plan has expired. Please renew to continue.",
      "PLAN_EXPIRED",
      { planExpiresAt: user.planExpiresAt },
    );
  }

  /* ─── 4. Sufficient credits check ─────────────────────────── */
  if ((user.credits || 0) < cost) {
    throw new CreditError(
      "Insufficient credits",
      "INSUFFICIENT_CREDITS",
      { required: cost, available: user.credits || 0 },
    );
  }

  /* ─── 5. Atomic deduction (race-safe) ──────────────────────── */
  const updated = await User.findOneAndUpdate(
    { _id: userId, credits: { $gte: cost } },
    { $inc: { credits: -cost } },
    { new: true, select: "credits plan" },
  );

  if (!updated) {
    // Concurrent deduct-এ updated null → এখন insufficient
    throw new CreditError(
      "Insufficient credits",
      "INSUFFICIENT_CREDITS",
      { required: cost },
    );
  }

  console.log(
    `💳 [${agent}] -${cost} credits → user ${userId} (balance: ${updated.credits})`,
  );

  return {
    cost,
    remaining: updated.credits,
    plan: updated.plan,
  };
}

/* ──────────────────────────────────────────────────────────────── */
/*  UPDATE USER PAYMENT — core logic                             */
/*  Called by: auth.controller.js (HTTP)                         */
/*            billing/billing.service.js (direct)                */
/* ──────────────────────────────────────────────────────────────── */

export async function updateUserPaymentService({
  userId,
  plan,
  credits,
  orderId,
}) {
  /* ─── 1. Validation ─────────────────────────────────────────── */
  if (!userId) throw new Error("userId is required");
  if (!plan || typeof plan !== "string") throw new Error("plan is required");
  if (typeof credits !== "number" || credits <= 0) {
    throw new Error("credits must be a positive number");
  }
  if (!orderId) throw new Error("orderId is required");

  /* ─── 2. User খোঁজো ─────────────────────────────────────────── */
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  /* ─── 3. Idempotency guard ──────────────────────────────────── */
  if (user.lastProcessedOrderId === orderId) {
    return { user, alreadyProcessed: true };
  }

  /* ─── 4. Credits + Plan update ──────────────────────────────── */
  if (user.plan === plan) {
    user.credits = (user.credits || 0) + credits;
  } else {
    user.credits = credits;
  }
  user.totalCredits = (user.totalCredits || 0) + credits;

  user.plan = plan;
  user.planActivatedAt = new Date();
  user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  user.lastProcessedOrderId = orderId;

  await user.save();

  console.log(
    `✅ User ${user.email} → plan: ${plan}, credits: ${user.credits}`,
  );

  return { user, alreadyProcessed: false };
}