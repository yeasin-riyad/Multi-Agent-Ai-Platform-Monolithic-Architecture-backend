import pptxgen from "pptxgenjs";
import { uploadPpt } from "./uploader.js";

export const generatePpt = async (data) => {
  if (!data?.title) {
    throw new Error("Presentation title is required");
  }

  if (!Array.isArray(data.slides) || data.slides.length === 0) {
    throw new Error("Presentation must contain at least one slide");
  }

  const pptx = new pptxgen();

  /*
   * =====================================================
   * PRESENTATION SETTINGS
   * =====================================================
   */

  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Agentix";
  pptx.company = "Agentix";
  pptx.subject = data.title;
  pptx.title = data.title;
  pptx.lang = "en-US";

  /*
   * =====================================================
   * THEME COLORS
   * =====================================================
   */

  const COLORS = {
    primary: "4F46E5",
    primaryDark: "312E81",
    primaryLight: "EEF2FF",

    secondary: "0EA5E9",

    dark: "0F172A",
    text: "334155",
    muted: "64748B",

    white: "FFFFFF",
    background: "F8FAFC",

    border: "E2E8F0",

    success: "10B981",
    warning: "F59E0B",
  };

  /*
   * =====================================================
   * TITLE SLIDE
   * =====================================================
   */

  const titleSlide = pptx.addSlide();

  titleSlide.background = {
    color: COLORS.background,
  };

  /*
   * Large left accent block
   */

  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 4.2,
    h: 7.5,
    line: {
      color: COLORS.primary,
      transparency: 100,
    },
    fill: {
      color: COLORS.primary,
    },
  });

  /*
   * Decorative secondary block
   */

  titleSlide.addShape(pptx.ShapeType.rect, {
    x: 3.5,
    y: 0,
    w: 0.7,
    h: 7.5,
    line: {
      color: COLORS.primaryDark,
      transparency: 100,
    },
    fill: {
      color: COLORS.primaryDark,
    },
  });

  /*
   * Decorative circles
   */

  titleSlide.addShape(pptx.ShapeType.ellipse, {
    x: 0.7,
    y: 0.8,
    w: 1.1,
    h: 1.1,
    line: {
      color: COLORS.white,
      transparency: 100,
    },
    fill: {
      color: COLORS.white,
      transparency: 85,
    },
  });

  titleSlide.addShape(pptx.ShapeType.ellipse, {
    x: 2.2,
    y: 5.7,
    w: 1.5,
    h: 1.5,
    line: {
      color: COLORS.white,
      transparency: 100,
    },
    fill: {
      color: COLORS.white,
      transparency: 90,
    },
  });

  /*
   * Agentix branding
   */

  titleSlide.addText("AGENTIX", {
    x: 0.7,
    y: 2.1,
    w: 2.7,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    charSpacing: 2,
    margin: 0,
  });

  /*
   * Small accent line
   */

  titleSlide.addShape(pptx.ShapeType.line, {
    x: 0.7,
    y: 2.65,
    w: 1.2,
    h: 0,
    line: {
      color: COLORS.white,
      width: 2,
    },
  });

  /*
   * Main title
   */

  titleSlide.addText(data.title, {
    x: 4.7,
    y: 2.15,
    w: 7.7,
    h: 1.4,
    fontSize: 32,
    bold: true,
    color: COLORS.dark,
    margin: 0,
    breakLine: false,
    fit: "shrink",
  });

  /*
   * Subtitle
   */

  if (data.subtitle) {
    titleSlide.addText(data.subtitle, {
      x: 4.7,
      y: 3.65,
      w: 7,
      h: 0.8,
      fontSize: 16,
      color: COLORS.muted,
      margin: 0,
      breakLine: false,
      fit: "shrink",
    });
  }

  /*
   * Bottom accent
   */

  titleSlide.addShape(pptx.ShapeType.line, {
    x: 4.7,
    y: 5.0,
    w: 2.2,
    h: 0,
    line: {
      color: COLORS.primary,
      width: 3,
    },
  });

  /*
   * Page indicator
   */

  titleSlide.addText("01", {
    x: 11.5,
    y: 6.65,
    w: 0.7,
    h: 0.3,
    fontSize: 10,
    bold: true,
    color: COLORS.primary,
    align: "right",
    margin: 0,
  });

  /*
   * =====================================================
   * CONTENT SLIDES
   * =====================================================
   */

  data.slides.forEach((slideData, index) => {
    const slide = pptx.addSlide();

    /*
     * Background
     */

    slide.background = {
      color: COLORS.white,
    };

    /*
     * =================================================
     * TOP HEADER
     * =================================================
     */

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: 13.333,
      h: 0.16,
      line: {
        color: COLORS.primary,
        transparency: 100,
      },
      fill: {
        color: COLORS.primary,
      },
    });

    /*
     * Small accent square
     */

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.7,
      y: 0.58,
      w: 0.12,
      h: 0.65,
      line: {
        color: COLORS.primary,
        transparency: 100,
      },
      fill: {
        color: COLORS.primary,
      },
    });

    /*
     * Slide title
     */

    slide.addText(slideData.title || `Slide ${index + 1}`, {
      x: 1.0,
      y: 0.52,
      w: 10.5,
      h: 0.7,
      fontSize: 25,
      bold: true,
      color: COLORS.dark,
      margin: 0,
      fit: "shrink",
    });

    /*
     * =================================================
     * HEADER DIVIDER
     * =================================================
     */

    slide.addShape(pptx.ShapeType.line, {
      x: 0.7,
      y: 1.45,
      w: 11.9,
      h: 0,
      line: {
        color: COLORS.border,
        width: 1,
      },
    });

    /*
     * =================================================
     * CONTENT CARD
     * =================================================
     */

    slide.addShape(pptx.ShapeType.roundRect, {
      x: 0.7,
      y: 1.8,
      w: 11.9,
      h: 4.45,
      rectRadius: 0.08,
      line: {
        color: COLORS.border,
        width: 1,
      },
      fill: {
        color: COLORS.background,
      },
    });

    /*
     * Left accent bar on content card
     */

    slide.addShape(pptx.ShapeType.rect, {
      x: 0.7,
      y: 1.8,
      w: 0.08,
      h: 4.45,
      line: {
        color: COLORS.primary,
        transparency: 100,
      },
      fill: {
        color: COLORS.primary,
      },
    });

    /*
     * =================================================
     * BULLET POINTS
     * =================================================
     */

    const points = Array.isArray(slideData.points)
      ? slideData.points
      : [];

    const maxPoints = Math.min(points.length, 6);

    /*
     * -------------------------------------------------
     * BULLET ALIGNMENT
     * -------------------------------------------------
     *
     * Every bullet row uses exactly the same rowY.
     *
     * Text:
     *   y = rowY
     *
     * Bullet:
     *   y = rowY + (textHeight - bulletSize) / 2
     *
     * This mathematically centers the bullet vertically
     * with the text.
     * -------------------------------------------------
     */

    const bulletStartY = 2.35;
    const bulletRowHeight = 0.62;

    const bulletSize = 0.28;

    const bulletX = 1.05;
    const bulletTextX = 1.5;

    const bulletTextWidth = 6.35;
    const bulletTextHeight = 0.46;

    points
      .slice(0, maxPoints)
      .forEach((point, pointIndex) => {
        const rowY =
          bulletStartY +
          pointIndex * bulletRowHeight;

        /*
         * =================================================
         * BULLET CIRCLE (decorative dot)
         * =================================================
         *
         * Kept for visual rhythm — no number inside.
         */

        slide.addShape(pptx.ShapeType.ellipse, {
          x: bulletX,

          /*
           * Center bullet vertically against text.
           *
           * 0.46 text height
           * 0.28 bullet height
           *
           * Difference = 0.18
           * Half = 0.09
           */

          y:
            rowY +
            (bulletTextHeight - bulletSize) / 2,

          w: bulletSize,
          h: bulletSize,

          line: {
            color: COLORS.primary,
            transparency: 100,
          },

          fill: {
            color: COLORS.primary,
          },
        });

        /*
         * =================================================
         * BULLET CONTENT
         * =================================================
         *
         * IMPORTANT:
         *
         * The text uses the exact same rowY as the bullet.
         * This keeps every bullet + text pair aligned.
         */

        slide.addText(String(point), {
          x: bulletTextX,
          y: rowY,

          w: bulletTextWidth,
          h: bulletTextHeight,

          fontSize: 15,

          color: COLORS.text,

          margin: 0,

          breakLine: false,

          fit: "shrink",

          valign: "mid",
        });
      });

    /*
     * =================================================
     * FOOTER
     * =================================================
     */

    /*
     * Footer line
     */

    slide.addShape(pptx.ShapeType.line, {
      x: 0.7,
      y: 6.65,
      w: 11.9,
      h: 0,
      line: {
        color: COLORS.border,
        width: 1,
      },
    });

    /*
     * Branding
     */

    slide.addText("AGENTIX", {
      x: 0.7,
      y: 6.82,
      w: 1.5,
      h: 0.25,
      fontSize: 8,
      bold: true,
      color: COLORS.primary,
      charSpacing: 1.5,
      margin: 0,
    });

    /*
     * Slide number
     */

    const slideNumber =
      String(index + 2).padStart(2, "0");

    slide.addText(slideNumber, {
      x: 11.7,
      y: 6.8,
      w: 0.9,
      h: 0.25,
      fontSize: 9,
      bold: true,
      color: COLORS.muted,
      align: "right",
      margin: 0,
    });
  });

  /*
   * =====================================================
   * GENERATE PPTX BUFFER
   * =====================================================
   */

  const buffer = await pptx.write({
    outputType: "nodebuffer",
  });

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "Failed to generate PowerPoint buffer",
    );
  }

  if (buffer.length === 0) {
    throw new Error(
      "Generated PowerPoint is empty",
    );
  }

  /*
   * =====================================================
   * SAFE FILENAME
   * =====================================================
   */

  const filename =
    data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") ||
    `presentation-${Date.now()}`;

  /*
   * =====================================================
   * UPLOAD TO CLOUDINARY
   * =====================================================
   */

  const result = await uploadPpt(
    filename,
    buffer,
  );

  /*
   * =====================================================
   * RETURN ARTIFACT
   * =====================================================
   */

  return {
    url: result.secure_url,
    publicId: result.public_id,
    filename: `${filename}.pptx`,
  };
};