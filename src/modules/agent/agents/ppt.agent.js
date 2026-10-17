import { getModel } from "../config/llmModels.js";
import { generatePpt } from "../utils/generatePpt.js";

export const pptAgent = async (state) => {
  try {
    const llm = await getModel("ppt");

    const prompt = `
You are an expert presentation designer.

Your task is to create structured content for a professional PowerPoint presentation.

IMPORTANT:
- Return ONLY valid JSON.
- Do NOT return Markdown.
- Do NOT return explanations.
- Do NOT wrap the JSON inside \`\`\`json.
- The response must be directly parseable using JSON.parse().

Use exactly this structure:

{
  "title": "",
  "subtitle": "",
  "slides": [
    {
      "title": "",
      "points": []
    }
  ]
}

Rules:

- Create 6-10 slides.
- Each slide must contain 3-6 concise bullet points.
- Keep bullet points informative and presentation-friendly.
- Do not write long paragraphs.
- The title slide should clearly represent the topic.
- The subtitle should briefly describe the presentation.
- Each slide should cover a meaningful part of the topic.
- Keep the presentation logically organized.
- The final slide should summarize the key takeaways.
- Avoid unnecessary filler.
- Use professional language.

Topic:

${state.prompt}
`;

    const response = await llm.invoke(prompt);

 

    let pptData;

    try {
      pptData = JSON.parse(response.content);
    } catch (error) {
      console.error(
        "Failed to parse PPT JSON:",
        error,
      );

      throw new Error(
        "AI returned invalid JSON for PowerPoint generation.",
      );
    }

    if (
      !pptData ||
      typeof pptData !== "object" ||
      !pptData.title ||
      !Array.isArray(pptData.slides)
    ) {
      throw new Error(
        "Invalid PowerPoint structure returned by AI.",
      );
    }

    if (pptData.slides.length === 0) {
      throw new Error(
        "No slides were generated.",
      );
    }

    const ppt = await generatePpt(pptData);

    return {
      aiResponse: `## 📊 PowerPoint Generated Successfully

**Title:** ${pptData.title}

**Slides:** ${pptData.slides.length}

Your PowerPoint presentation has been successfully generated and uploaded.

📥 [Open Presentation](${ppt.url})
`,
      artifacts: [
        {
          type: "ppt",
          title: pptData.title,
          filename: ppt.filename,
          url: ppt.url,
          publicId: ppt.publicId,
          contentType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
      ],
    };
  } catch (error) {
    console.error(
      "PPT Agent Error:",
      error,
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred.";

    return {
      aiResponse: `## ❌ PowerPoint Generation Failed

Sorry, I couldn't generate the PowerPoint presentation.

⚠️ **Error:** ${errorMessage}

Please try again with a different topic.`,
    };
  }
};