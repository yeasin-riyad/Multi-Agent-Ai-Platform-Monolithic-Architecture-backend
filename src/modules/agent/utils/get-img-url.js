import cloudinary from "../config/cloudinary.js";

export const getImgUrl = (
  filename,
  expiresIn = 3600,
) => {
  if (!filename) {
    throw new Error("Filename is required");
  }

  const expiresAt = Math.floor(
    Date.now() / 1000,
  ) + expiresIn;

  const url = cloudinary.url(filename, {
    resource_type: "image",
    type: "upload",
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
  });

  return url;
};