import fs from "fs/promises";
import { getModel } from "../config/llmModels.js";
import { HumanMessage } from "@langchain/core/messages";

export const imageAnalyzer = async (state) => {
  let filePath = null;

  try {
    /* ─── 1. Validate file ────────────────────────────────── */
    if (!state.file?.path) {
      return {
        ...state,
        aiResponse:
          "## 📷 No Image Provided\n\nPlease upload an image to analyze.",
        artifacts: [],
      };
    }

    filePath = state.file.path;

    /* ─── 2. Get LLM ──────────────────────────────────────── */
    const llm = await getModel("imageAnalyzer");

    /* ─── 3. Build analysis strategy ──────────────────────── */
    const systemPromptResponse = await llm.invoke(`
You are an AgentixAI Image Analyzer vision and multimodal analysis expert.

Analyze the user's request and provide instructions on how to thoroughly examine the provided image.

Requirements:
- Detailed visual breakdown
- Accurate context interpretation
- Professional structure
- Clear and concise formatting

Return ONLY the final analysis strategy or optimized instruction prompt.
Do not explain anything.
Do not use markdown.

User Request:
${state.prompt || "Analyze this image and describe what you see in detail."}
`);

    const analysisPrompt = systemPromptResponse.content.toString().trim();

    /* ─── 4. Read image file ───────────────────────────────── */
    const imageBuffer = await fs.readFile(filePath);

    if (imageBuffer.length === 0) {
      throw new Error("Image file buffer is empty");
    }

    /* ─── 5. Convert to base64 ─────────────────────────────── */
    const base64Image = imageBuffer.toString("base64");
    const mimeType = state.file.mimetype || "image/jpeg";

    /* ─── 6. Build multimodal message ─────────────────────── */
    const message = new HumanMessage({
      content: [
        {
          type: "text",
          text: analysisPrompt,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        },
      ],
    });

    /* ─── 7. Invoke model ─────────────────────────────────── */
    const response = await llm.invoke([message]);
    const analysisResult = response.content.toString().trim();

    return {
      ...state,
      aiResponse: `
## 🔍 Image Analysis Results

${analysisResult}
      `.trim(),
      images: state.images || [],
      artifacts: [],
    };
  } catch (error) {
    console.error("Image Analysis Agent Error:", error);

    return {
      ...state,
      aiResponse: `## ❌ Image Analysis Failed

😔 Sorry, I couldn't analyze your image.

⚠️ **Error:** ${error.message}

🔄 **Please try again** with a valid image file.`,
      artifacts: [],
    };
  } finally {
    /* ─── 8. Cleanup temp file ─────────────────────────────── */
    if (filePath) {
      try {
        await fs.unlink(filePath);
        console.log(`🧹 Cleaned up: ${filePath}`);
      } catch (err) {
        console.error(`Cleanup failed for ${filePath}:`, err.message);
      }
    }
  }
};