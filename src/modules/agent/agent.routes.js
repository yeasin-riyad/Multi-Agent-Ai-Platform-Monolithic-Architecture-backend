import express from "express";
import multer from "./config/multer.js"; 
import { runAgentController } from "./agent.controller.js";
import authProtect from "../../shared/middleware/auth.middleware.js";

const router = express.Router();

/**
 * POST /api/agent/:agent
 *
 * Agent types:
 *   chat | coding | pdf | ppt | vision | search | auto | pdfRag | imageAnalyzer
 *
 * Content-Type: multipart/form-data
 *   - prompt         (string)
 *   - conversationId (string)
 *   - file           (optional — PDF or image)
 *
 * Auth: Cookie: token=JWT (authProtect middleware verify করবে)
 */
router.post(
  "/:agent",
  authProtect,           // ⭐ JWT verify → req.user set
  multer.single("file"), // ⭐ req.file set
  runAgentController,    // ⭐ Controller
);

export default router;