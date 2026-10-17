import { Annotation } from "@langchain/langgraph";

export const agentState = Annotation.Root({
  /* ─── Input ──────────────────────────────────────────────────── */
  prompt: Annotation(),
  conversationId: Annotation(),
  userId: Annotation(),
  agent: Annotation(), // "chat" | "search" | "auto" | ...

  /* ─── Output ─────────────────────────────────────────────────── */
  aiResponse: Annotation(),
  images: Annotation(),
  artifacts: Annotation(),
  searchResults: Annotation(),

  /* ─── Credit tracking ────────────────────────────────────────── */
  creditCharged: Annotation(),      // (deducted amount)
  creditRemaining: Annotation(),    // (balance after deduct)

  /* ─── Error (credit fail, invalid agent, etc.) ───────────────── */
  error: Annotation(),    
  file:Annotation()        
});