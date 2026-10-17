import express from "express";

import {
  login,
  logout,
  getMe,
} from "./auth.controller.js";

import { authProtect } from "../../shared/middleware/auth.middleware.js";

const router = express.Router();

/* ─── Public ──────────────────────────────────────────────────── */
router.post("/login", login);
router.post("/logout", logout);

/* ─── Protected ───────────────────────────────────────────────── */
router.get("/me", authProtect, getMe);

export default router;