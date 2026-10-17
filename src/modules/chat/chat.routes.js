import express from "express";
import {
  createConversation,
  deleteConversation,
  getConversations,
  getMessages,
  updateConversation,
} from "./chat.controller.js";
import { authProtect } from "../../shared/middleware/auth.middleware.js";

const router = express.Router();

/* ─── All routes require authentication ──────────────────────── */
router.use(authProtect);

router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.patch("/conversations/:id", updateConversation);
router.delete("/conversations/:id", deleteConversation);
router.get("/conversations/:id/messages", getMessages);

export default router;