import { getModel } from "../config/llmModels.js";
import { generatePdf } from "../utils/generatePdf.js";

export const pdfAgent = async (state) => {
  try {
    const llm = await getModel("pdf");

    const prompt = `
You are an expert document writer.

Your task is to create structured content for a PDF document.

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
  "sections": [
    {
      "heading": "",
      "points": []
    }
  ]
}

Rules:

- Create clear and professional content.
- Create 4-8 sections.
- Each section must contain 3-6 concise bullet points.
- Keep each bullet point informative but concise.
- Do not include unnecessary filler.
- Make the document easy to read.
- The title should clearly represent the topic.
- The subtitle should briefly describe the document.

Topic:

${state.prompt}
`;

    const response = await llm.invoke(prompt);


    let pdfData;

    try {
      pdfData = JSON.parse(response.content);
    } catch (error) {
      console.error("Failed to parse PDF JSON:", error);

      throw new Error("AI returned invalid JSON for PDF generation.");
    }

    if (
      !pdfData ||
      typeof pdfData !== "object" ||
      !pdfData.title ||
      !Array.isArray(pdfData.sections)
    ) {
      throw new Error("Invalid PDF document structure returned by AI.");
    }

    const pdf = await generatePdf(pdfData);


    return {
      aiResponse: `## 📄 PDF Generated Successfully

**Title:** ${pdfData.title}

**Sections:** ${pdfData.sections.length}

Your PDF has been successfully generated and uploaded.

📥 [Open PDF](${pdf.url})
`,
      artifacts: [
        {
          type: "pdf",
          title: pdfData.title,
          filename: pdf.filename,
          url: pdf.url,
          publicId: pdf.publicId,
          contentType: "application/pdf",
        },
      ],
    };
  } catch (error) {
    console.error("PDF Agent Error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    return {
      aiResponse: `## ❌ PDF Generation Failed

Sorry, I couldn't generate the PDF.

⚠️ **Error:** ${errorMessage}

Please try again with a different topic.`,
    };
  }
};
