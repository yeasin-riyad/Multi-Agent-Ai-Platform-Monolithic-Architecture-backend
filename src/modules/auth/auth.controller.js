import { getAuth } from "firebase-admin/auth";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

import { app as firebaseApp } from "../../config/firebase.js";
import User from "./user.model.js";
import { deductCreditsService, updateUserPaymentService } from "./auth.service.js";
import connectDb from "../../config/db.js";

/* ──────────────────────────────────────────────────────────────── */
/*  Agent cost mapping                                            */
/* ──────────────────────────────────────────────────────────────── */



/* ================================================================ */
/*  LOGIN                                                         */
/* ================================================================ */
const isProduction = process.env.NODE_ENV === "production";

export const login = async (req, res) => {
  try {
    await connectDb();
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Firebase token missing" });
    }

    
    const decoded = await getAuth(firebaseApp).verifyIdToken(token);
    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        name: decoded.name || "User",
        email: decoded.email,
        avatar: decoded.picture || "",
      });
    }

    const jwtPayload = {
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      credits: user.credits,
      plan: user.plan,
    };

    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `login error ${error.message}` });
  }
};

/* ================================================================ */
/*  LOGOUT                                                        */
/* ================================================================ */

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return res.status(200).json({ message: "Logout Successfully" });
  } catch (error) {
    return res.status(500).json({ message: `logout error ${error.message}` });
  }
};

/* ================================================================ */
/*  GET ME                                                        */
/* ================================================================ */

export const getMe = async (req, res) => {
  try {
    // req.user protect middleware থেকে আসে, অথবা header থেকে
    const userId = req.user?.userId || req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await User.findById(userId).select("-__v");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Auto-expire check
    const planExpired =
      user.plan !== "free" &&
      user.planExpiresAt &&
      user.planExpiresAt < new Date();

    return res.status(200).json({
      _id: user._id,
      firebaseUid: user.firebaseUid,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      plan: user.plan,
      credits: user.credits,
      totalCredits: user.totalCredits,
      planActivatedAt: user.planActivatedAt,
      planExpiresAt: user.planExpiresAt,
      planExpired,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error("getMe error:", error);
    return res.status(500).json({
      message: `getMe error: ${error.message}`,
    });
  }
};

/* ================================================================ */
/*  UPDATE USER PAYMENT                                           */
/*  Billing module → successful payment-এ এটা call করে             */
/* ================================================================ */

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId, orderId } = req.body;
    const result = await updateUserPaymentService({
      userId,
      plan,
      credits,
      orderId,
    });

    return res.status(200).json({
      success: true,
      message: result.alreadyProcessed
        ? "Order already processed"
        : "User payment updated successfully",
      alreadyProcessed: result.alreadyProcessed,
      user: result.user,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

/* ================================================================ */
/*  DEDUCT CREDITS                                                */
/*  Agent module → agent run-এর আগে এটা call করে                   */
/* ================================================================ */

export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body;

    const result = await deductCreditsService({ userId, agent });

    return res.status(200).json({
      success: true,
      message: `${result.cost} credit${result.cost > 1 ? "s" : ""} deducted`,
      agent,
      cost: result.cost,
      remaining: result.remaining,
      plan: result.plan,
    });
  } catch (error) {
    if (error instanceof CreditError) {
      // Map domain error → HTTP status
      const statusMap = {
        MISSING_USER_ID: 400,
        MISSING_AGENT: 400,
        UNKNOWN_AGENT: 400,
        INVALID_USER_ID: 400,
        USER_NOT_FOUND: 404,
        PLAN_EXPIRED: 403,
        INSUFFICIENT_CREDITS: 402,
      };
      const status = statusMap[error.code] || 500;

      return res.status(status).json({
        message: error.message,
        code: error.code,
        ...error.details,
      });
    }

    console.error("deductCredits controller error:", error);
    return res.status(500).json({ message: error.message });
  }
};




export const demoLogin = async (req, res) => {
  try {
    // 1. Ensure MongoDB is connected
    await connectDb();

    // 2. Validate environment variables
    if (!process.env.FIREBASEUID) {
      return res.status(500).json({
        success: false,
        message: "Demo account configuration is missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT secret is missing.",
      });
    }

    // 3. Find predefined demo account
    let user = await User.findOne({
      firebaseUid: process.env.FIREBASEUID,
    });

    // 4. Create demo account if it doesn't exist
    if (!user) {
      user = await User.create({
        firebaseUid: process.env.FIREBASEUID,
        name: "Demo User",
        email: "demo@intervexa.ai",
        avatar: "",
        credits: 200,
      });
    }

    // 5. Generate JWT payload
    const jwtPayload = {
      userId: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      credits: user.credits,
      plan: user.plan,
    };

    // 6. Generate JWT token
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // 7. Set authentication cookie
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 8. Return user
    return res.status(200).json(user);

  } catch (error) {
    console.error("Demo Login Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Demo login failed",
    });
  }
};
