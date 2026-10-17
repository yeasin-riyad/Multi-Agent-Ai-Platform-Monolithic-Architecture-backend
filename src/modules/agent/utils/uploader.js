





import cloudinary from "../config/cloudinary.js";

export const uploadImage = async (
  filename,
  buffer,
  contentType,
) => {
  if (!filename) {
    throw new Error("Filename is required");
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new Error("A valid image buffer is required");
  }

  if (!contentType) {
    throw new Error("Content type is required");
  }

  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: filename,
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        },
      );

    uploadStream.end(buffer);
  });
};

export const uploadPdf = async (
  filename,
  buffer,
  contentType = "application/pdf",
) => {
  if (!filename) {
    throw new Error("PDF filename is required");
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new Error("A valid PDF buffer is required");
  }

  if (buffer.length === 0) {
    throw new Error("PDF buffer is empty");
  }

  if (contentType !== "application/pdf") {
    throw new Error(
      `Invalid PDF content type: ${contentType}`,
    );
  }

  const cleanFilename = filename.replace(
    /\.pdf$/i,
    "",
  );

  return new Promise((resolve, reject) => {
    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          public_id: cleanFilename,
          format: "pdf",
        },
        (error, result) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(result);
        },
      );

    uploadStream.end(buffer);
  });
};


export const uploadPpt = async (
  filename,
  buffer,
) => {
  if (!filename) {
    throw new Error(
      "PPT filename is required",
    );
  }

  if (!Buffer.isBuffer(buffer)) {
    throw new Error(
      "A valid PPT buffer is required",
    );
  }

  if (buffer.length === 0) {
    throw new Error(
      "PPT buffer is empty",
    );
  }

  return new Promise(
    (resolve, reject) => {
      const uploadStream =
        cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            public_id: `pptx/${filename}.pptx`,
          },
          (
            error,
            result,
          ) => {
            if (error) {
              reject(error);
              return;
            }

            resolve(result);
          },
        );

      uploadStream.end(buffer);
    },
  );
};