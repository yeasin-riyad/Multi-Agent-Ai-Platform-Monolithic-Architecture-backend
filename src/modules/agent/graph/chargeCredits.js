import deductCredits, { CreditError } from "../utils/deductCredits.js";
import { formatCreditError } from "../utils/creditErrorFormatter.js";

export const chargeCreditsNode = async (state) => {
  // userId না থাকলে skip
  if (!state.userId) {
    console.warn("⚠️ [chargeCredits] No userId — skipping");
    return state;
  }

  // ⚠️ এখানে state.agent অবশ্যই resolved (chat/search/coding/...)
  // "auto" হওয়া উচিত নয় কারণ router আগেই resolve করেছে
  const agent = state.agent;

  if (!agent || agent === "auto") {
    console.error(
      `🚫 [chargeCredits] Invalid agent after router: "${agent}"`,
    );
    return {
      ...state,
      aiResponse:
        "## ❌ Something went wrong\n\nCould not determine which agent to use.",
      error: { code: "INVALID_AGENT", message: `agent="${agent}"` },
    };
  }

  try {
    const result = await deductCredits({
      userId: state.userId,
      agent,
    });

    console.log(
      `💳 [chargeCredits] Charged ${result.cost} credits for [${agent}], ` +
        `remaining: ${result.remaining}`,
    );

    return {
      ...state,
      creditCharged: result.cost,
      creditRemaining: result.remaining,
    };
  } catch (error) {
    if (error instanceof CreditError) {
      console.warn(
        `🚫 [chargeCredits] [${error.code}] ${error.message}`,
      );

      return {
        ...state,
        aiResponse: formatCreditError(error),
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      };
    }

    console.error("[chargeCredits] Unexpected:", error);
    return {
      ...state,
      aiResponse:
        "## ❌ Something went wrong\n\nCould not process your credits. Please try again.",
      error: { code: "UNKNOWN", message: error.message },
    };
  }
};