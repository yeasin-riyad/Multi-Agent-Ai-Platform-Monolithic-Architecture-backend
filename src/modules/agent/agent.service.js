import { graph } from "./graph/graph.js";
import Message from "../chat/message.model.js";
import Conversation from "../chat/conversation.model.js";

/**
 * Run the agent graph and handle persistence.
 * Directly uses chat module models — no HTTP.
 */
export const runAgent = async ({
  userId,
  agentType,
  prompt,
  conversationId,
  file,
}) => {
  /* ─── 1. Save user message (direct model call) ─────────────── */
  try {
    await Message.create({
      conversationId,
      role: "user",
      content: prompt,
    });
  } catch (err) {
    console.error("⚠️ Failed to save user message:", err.message);
  }

  /* ─── 2. Invoke graph ──────────────────────────────────────── */
  const result = await graph.invoke({
    prompt,
    conversationId,
    agent: agentType,
    userId,
    file,
  });

  /* ─── 3. Credit error → no assistant message ───────────────── */
  if (result.error) {
    return result;
  }

  /* ─── 4. Save assistant message ────────────────────────────── */
  try {
    await Message.create({
      conversationId,
      role: "assistant",
      content: result.aiResponse,
      images: result.images || [],
      artifacts: result.artifacts || [],
    });

    // Update conversation title if it's still "New Chat"
    await Conversation.updateOne(
      { _id: conversationId, title: "New Chat" },
      { title: prompt.slice(0, 40) || "New Chat" },
    );
  } catch (err) {
    console.error("⚠️ Failed to save assistant message:", err.message);
  }

  return result;
};