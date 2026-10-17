import Message from "./message.model.js";
import Conversation from "./conversation.model.js";
import mongoose from "mongoose";

/* ================================================================ */
/*  Helper — consistent error response                            */
/* ================================================================ */

const sendError = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

/* ================================================================ */
/*  CREATE CONVERSATION                                           */
/* ================================================================ */

export const createConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, "Missing user");
    }

    /* ─── Debounce: 3s-এ same "New Chat" থাকলে return ─────────── */
    const recent = await Conversation.findOne({
      userId,
      title: "New Chat",
      createdAt: { $gte: new Date(Date.now() - 3000) },
    }).sort({ createdAt: -1 });

    if (recent) {
      return res.status(200).json(recent);
    }

    const conversation = await Conversation.create({
      userId,
      title: "New Chat",
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error("createConversation error:", error);
    return sendError(
      res,
      500,
      `create conversation error: ${error.message}`,
    );
  }
};

/* ================================================================ */
/*  UPDATE CONVERSATION                                           */
/*  PATCH /conversations/:id                                      */
/* ================================================================ */

export const updateConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params; // ⭐ URL থেকে, body থেকে না
    const { title } = req.body;

    if (!userId) {
      return sendError(res, 401, "Missing user");
    }

    if (!title?.trim()) {
      return sendError(res, 400, "title is required");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    /* ─── Ownership check সহ update ────────────────────────────── */
    const updated = await Conversation.findOneAndUpdate(
      { _id: id, userId }, // ⭐ user-এর নিজের কিনা check
      { title: title.trim() },
      { new: true },
    );

    if (!updated) {
      return sendError(res, 404, "Conversation not found");
    }

    return res.status(200).json(updated);
  } catch (error) {
    console.error("updateConversation error:", error);
    return sendError(
      res,
      500,
      `update conversation error: ${error.message}`,
    );
  }
};

/* ================================================================ */
/*  GET CONVERSATIONS                                             */
/* ================================================================ */

export const getConversations = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return sendError(res, 401, "Missing user");
    }

    const conversations = await Conversation.find({ userId })
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json(conversations);
  } catch (error) {
    console.error("getConversations error:", error);
    return sendError(
      res,
      500,
      `get conversation error: ${error.message}`,
    );
  }
};

/* ================================================================ */
/*  GET MESSAGES                                                  */
/*  GET /conversations/:id/messages                               */
/* ================================================================ */

export const getMessages = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return sendError(res, 401, "Missing user");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    /* ─── Ownership check ──────────────────────────────────────── */
    const conversation = await Conversation.findOne({
      _id: id,
      userId,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error("getMessages error:", error);
    return sendError(
      res,
      500,
      `get messages error: ${error.message}`,
    );
  }
};

/* ================================================================ */
/*  DELETE CONVERSATION                                           */
/*  DELETE /conversations/:id                                     */
/* ================================================================ */

export const deleteConversation = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      return sendError(res, 401, "Missing user");
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, "Invalid conversation ID");
    }

    /* ─── Ownership check সহ delete ────────────────────────────── */
    const conversation = await Conversation.findOne({
      _id: id,
      userId,
    });

    if (!conversation) {
      return sendError(res, 404, "Conversation not found");
    }

    /* ─── Messages প্রথমে delete, তারপর conversation ───────────── */
    await Message.deleteMany({ conversationId: id });
    await Conversation.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully",
      conversationId: id,
    });
  } catch (error) {
    console.error("deleteConversation error:", error);
    return sendError(
      res,
      500,
      `delete conversation error: ${error.message}`,
    );
  }
};