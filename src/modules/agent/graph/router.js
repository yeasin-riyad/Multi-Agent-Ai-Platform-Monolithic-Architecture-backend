// graph/router.js
import { getModel } from "../config/llmModels.js";

export const router = async (state) => {
  /* ─────────────────────────────────────────────────────────── */
  /*  1. FILE DETECTION — সবার আগে                              */
  /* ─────────────────────────────────────────────────────────── */

  const hasFile = !!state.file;

  if (hasFile) {
    const mimeType = state.file?.mimetype || "";

    // PDF upload → pdfRag
    if (mimeType === "application/pdf") {
      console.log("🔀 [router] PDF detected → pdfRag");
      return { ...state, agent: "pdfRag" };
    }

    // Image upload → imageAnalyzer
    if (mimeType.startsWith("image/")) {
      console.log("🔀 [router] Image detected → imageAnalyzer");
      return { ...state, agent: "imageAnalyzer" };
    }

    // Unknown file type — fallback
    console.warn(`⚠️ [router] Unknown file type: ${mimeType}`);
  }

  /* ─────────────────────────────────────────────────────────── */
  /*  2. User explicitly picked an agent                        */
  /* ─────────────────────────────────────────────────────────── */

  if (state.agent && state.agent !== "auto") {
    return { ...state, agent: state.agent };
  }

  /* ─────────────────────────────────────────────────────────── */
  /*  3. Auto mode — LLM decides                                */
  /* ─────────────────────────────────────────────────────────── */

  const llm = await getModel("router");

  const prompt = `
You are an agent router.

Available agents:
- chat
- search
- coding
- pdf
- ppt
- vision
- pdfRag
- imageAnalyzer

Rules:

chat:
General conversation, explanations, learning, questions.

search:
Current events, latest information, news, recent developments, internet lookup.

coding:
Generate code, debug code, build projects, architecture, API design.

pdf:
Generate PDFs from a prompt (no uploaded file).

ppt:
Generate PPTs from a prompt (no uploaded file).

vision:
Generate image, create image, edit image.

pdfRag:
Questions about an uploaded PDF file, document analysis.

imageAnalyzer:
Analyze an uploaded image, extract text from image, describe image.

Return only one word:

chat
search
coding
pdf
ppt
vision
pdfRag
imageAnalyzer

User Query:
${state.prompt}
  `;

  const response = await llm.invoke(prompt);
  const raw = response.content.toString().trim().toLowerCase();

  const validAgents = [
    "chat",
    "search",
    "coding",
    "pdf",
    "ppt",
    "vision",
    "pdfrag",
    "imageanalyzer",
  ];

  const found = validAgents.find((a) => raw.includes(a));

  const agentMap = {
    chat: "chat",
    search: "search",
    coding: "coding",
    pdf: "pdf",
    ppt: "ppt",
    vision: "vision",
    pdfrag: "pdfRag",
    imageanalyzer: "imageAnalyzer",
  };

  const resolved = agentMap[found] || "chat";

  console.log(`🔀 [router] Auto-resolved to: ${resolved}`);

  return {
    ...state,
    agent: resolved,
  };
};