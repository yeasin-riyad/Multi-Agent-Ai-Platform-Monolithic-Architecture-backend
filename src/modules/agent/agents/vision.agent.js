
import crypto from "node:crypto";

import { getModel } from "../config/llmModels.js";
import { uploadImage } from "../utils/uploader.js";
import { getImgUrl } from "../utils/get-img-url.js";

export const visionAgent = async (state) => {
  try {
    // 1. Get LLM
    const llm = await getModel("vision");

    // 2. Generate image prompt
    const res = await llm.invoke(`
You are an Elite AI image prompt engineer.

Convert the user's request into a highly detailed
image generation prompt.

Requirements:

- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photorealistic
- Depth of field
- Professional photography
- Stunning visuals
- Realistic textures
- Natural lighting
- Accurate proportions
- Detailed environment
- High dynamic range

Return ONLY the final image generation prompt.
Do not explain anything.
Do not use markdown.

User Request:

${state.prompt}
`);

    const prompt = res.content.toString().trim();

    

    // 3. Generate image
    const imageResponse = await fetch(
      `https://gen.pollinations.ai/image/${encodeURIComponent(
        prompt,
      )}?model=flux`,
      {
        headers: {
          Authorization: `Bearer ${process.env.POLLINATIONS_API_KEY}`,
        },
      },
    );

    // Check response
    

 

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();

      console.error(
        "Pollinations error:",
        errorText,
      );

      throw new Error(
        `Image generation failed: ${imageResponse.status}`,
      );
    }

    // 4. Check content type
    const contentType =
      imageResponse.headers.get("content-type");

    if (!contentType?.startsWith("image/")) {
      const responseText =
        await imageResponse.text();

      console.error(
        "Expected image but received:",
        responseText,
      );

      throw new Error(
        `Expected image response but received ${contentType}`,
      );
    }

    // 5. Convert image to Buffer
    const arrayBuffer =
      await imageResponse.arrayBuffer();

    const imageBuffer = Buffer.from(arrayBuffer);

  
    if (imageBuffer.length === 0) {
      throw new Error(
        "Generated image buffer is empty",
      );
    }

    // 6. Generate unique filename
    const filename =
      `ai-generated-images/image-${crypto.randomUUID()}`;

    // 7. Upload to Cloudinary
    const uploadResult = await uploadImage(
      filename,
      imageBuffer,
      contentType,
    );


    // 8. Generate signed URL
    // URL expires after 10 minutes
    const imageUrl = getImgUrl(
      uploadResult.public_id,
      60 * 10,
    );

    // 9. Return success response
    return {
      ...state,

      aiResponse: `
## 🎨 Image Generated Successfully! ✨

Your image has been successfully generated and uploaded.

🖼️ **Generated Image**

![Generated Image](${imageUrl})

🔗 **[Download Image](${imageUrl})**

⏳ **Link expires in:** 10 minutes

🤖 **AI Model:** Flux

✨ **Status:** Successfully Generated
      `.trim(),
    };
  } catch (error) {
    console.error(
      "Vision Agent Error:",
      error,
    );

    // Convert error into a readable message
    const errorMessage =
      error instanceof Error
        ? error.message
        : "An unknown error occurred while generating the image.";

    // Return error inside agent state
    return {
      ...state,

      aiResponse: `
## ❌ Image Generation Failed

😔 Sorry, I couldn't generate your image.

⚠️ **Error:**
${errorMessage}

🔄 **Please try again** with a different prompt.
      `.trim(),
    };
  }
};
