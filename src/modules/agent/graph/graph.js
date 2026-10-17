import { StateGraph, END } from "@langchain/langgraph";
import { agentState } from "./state.js";
import { router } from "./router.js";
import { chargeCreditsNode } from "./chargeCredits.js";
import { chatAgent } from "../agents/chat.agent.js";
import { searchAgent } from "../agents/search.agent.js";
import { codingAgent } from "../agents/coding.agent.js";
import { pdfAgent } from "../agents/pdf.agent.js";
import { pptAgent } from "../agents/ppt.agent.js";
import { visionAgent } from "../agents/vision.agent.js";
import { pdfRag } from "../agents/pdfRag.agent.js";
import { imageAnalyzer } from "../agents/imageAnalyzer.agent.js";

const workflow = new StateGraph(agentState);

/* ─── Nodes ──────────────────────────────────────────────────── */

workflow.addNode("router", router);
workflow.addNode("chargeCredits", chargeCreditsNode);
workflow.addNode("chat", chatAgent);
workflow.addNode("search", searchAgent);
workflow.addNode("coding", codingAgent);
workflow.addNode("pdf", pdfAgent);
workflow.addNode("ppt", pptAgent);
workflow.addNode("vision", visionAgent);
workflow.addNode("pdfRag", pdfRag);
workflow.addNode("imageAnalyzer",imageAnalyzer);



/* ─── Entry → router ─────────────────────────────────────────── */

workflow.addEdge("__start__", "router");

/* ─── Router → chargeCredits (always) ────────────────────────── */

workflow.addEdge("router", "chargeCredits");

/* ─── chargeCredits → selected agent (or END on error) ───────── */

workflow.addConditionalEdges(
  "chargeCredits",
  (state) => {
    // Credit error → END (no agent run)
    if (state.error) return "__end__";

    // Otherwise dispatch to the selected agent
    switch (state.agent) {
      case "chat":   return "chat";
      case "search": return "search";
      case "coding": return "coding";
      case "pdf":    return "pdf";
      case "ppt":    return "ppt";
      case "vision": return "vision";
      case "pdfRag": return "pdfRag";
      case "imageAnalyzer": return "imageAnalyzer";
      default:       return "chat";
    }
  },
  {
    chat: "chat",
    search: "search",
    coding: "coding",
    pdf: "pdf",
    ppt: "ppt",
    vision: "vision",
    pdfRag:"pdfRag",
    imageAnalyzer:"imageAnalyzer",
    __end__: "__end__",
  },
);

/* ─── Agent → next (or END) ──────────────────────────────────── */

workflow.addEdge("search", "chat");   // search → chat (context)
workflow.addEdge("chat", "__end__");
workflow.addEdge("coding", "__end__");
workflow.addEdge("pdf", "__end__");
workflow.addEdge("ppt", "__end__");
workflow.addEdge("vision", "__end__");
workflow.addEdge("pdfRag", "__end__");
workflow.addEdge("imageAnalyzer", "__end__");



export const graph = workflow.compile();