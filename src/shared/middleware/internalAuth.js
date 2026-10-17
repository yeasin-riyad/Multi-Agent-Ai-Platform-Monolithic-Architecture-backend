export const internalAuth = (req, res, next) => {
  const secret = req.headers["x-internal-secret"];

  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    console.warn("🚫 Unauthorized internal call from:", req.ip);
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};

export default internalAuth;