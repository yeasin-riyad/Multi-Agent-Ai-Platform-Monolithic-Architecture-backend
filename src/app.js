import cors from "cors";
import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import "./config/env.js";          // ⚠️ সবার আগে
import authRoutes from "./modules/auth/auth.route.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import billingRoutes from "./modules/billing/billing.routes.js";
import agentRoutes from "./modules/agent/agent.routes.js";


const app = express();

/* ──────────────────────────────────────────────────────────────── */
/*  Global middleware                                            */
/* ──────────────────────────────────────────────────────────────── */

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ──────────────────────────────────────────────────────────────── */
/*  Health check                                                 */
/* ──────────────────────────────────────────────────────────────── */

app.get("/", (req, res) => {
  res.status(200).json({ message: "🚀 AgentixAI Backend running" });
});

/* ──────────────────────────────────────────────────────────────── */
/*  Modules                                                      */
/* ──────────────────────────────────────────────────────────────── */

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/agent", agentRoutes);

/* ──────────────────────────────────────────────────────────────── */
/*  404                                                          */
/* ──────────────────────────────────────────────────────────────── */

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* ──────────────────────────────────────────────────────────────── */
/*  Global error handler                                         */
/* ──────────────────────────────────────────────────────────────── */

app.use((err, req, res, next) => {
  console.error("💥 Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

export default app;