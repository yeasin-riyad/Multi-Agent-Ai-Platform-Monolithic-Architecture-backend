import Message from "../../chat/message.model.js";

export const getMessages = async (conversationId) => {
  try {
    if (!conversationId) {
      console.warn("⚠️ [getMessages] No conversationId provided");
      return [];
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return messages;
  } catch (error) {
    console.error("❌ [getMessages] Error:", error.message);
    return [];
  }
};

export default getMessages;