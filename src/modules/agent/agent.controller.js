import { runAgent } from "./agent.service.js";

export const runAgentController = async (req, res) => {
  try {
    /* ─── Input from request ──────────────────────────────────── */
    const userId = req.user?.userId;
    const agentType = req.params.agent;
    const { prompt, conversationId } = req.body;
    const file = req.file;

    /* ─── Validation ──────────────────────────────────────────── */
    if (!userId) {
      return res.status(401).json({ message: "User ID missing" });
    }

    if (!prompt?.trim() && !file) {
      return res
        .status(400)
        .json({ message: "prompt or file is required" });
    }

    if (!conversationId) {
      return res
        .status(400)
        .json({ message: "conversationId is required" });
    }

    /* ─── Call service ────────────────────────────────────────── */
    const result = await runAgent({
      userId,
      agentType,
      prompt: prompt?.trim() || "",
      conversationId,
      file,
    });

    /* ─── Handle credit / graph error ─────────────────────────── */
    if (result.error) {
      const statusMap = {
        INSUFFICIENT_CREDITS: 402,
        PLAN_EXPIRED: 403,
        USER_NOT_FOUND: 404,
        SERVICE_UNAVAILABLE: 503,
        INVALID_AGENT: 400,
        MISSING_USER_ID: 400,
        MISSING_AGENT: 400,
        UNKNOWN_AGENT: 400,
        INVALID_USER_ID: 400,
      };
      const status = statusMap[result.error.code] || 500;

      console.warn(
        `🚫 [agent] [${result.error.code}] ${result.error.message}`,
      );

      return res.status(status).json({
        success: false,
        code: result.error.code,
        message: result.error.message,
        ...result.error.details,
        answer: result.aiResponse,
        images: [],
        artifacts: [],
        creditRemaining: result.creditRemaining,
      });
    }

    /* ─── Success ─────────────────────────────────────────────── */
    return res.status(200).json({
      success: true,
      answer: result.aiResponse,
      images: result.images || [],
      artifacts: result.artifacts || [],
      creditCharged: result.creditCharged,
      creditRemaining: result.creditRemaining,
    });
  } catch (error) {
    console.error("💥 [agent.controller] CRASH:", {
      message: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      message: error.message || "Agent execution failed",
    });
  }
};