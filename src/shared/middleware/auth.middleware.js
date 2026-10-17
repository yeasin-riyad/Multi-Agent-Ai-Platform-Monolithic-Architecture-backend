import jwt from "jsonwebtoken";

export const authProtect = (req, res, next) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null);

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      name: decoded.name,
      email: decoded.email,
      avatar: decoded.avatar,
    };

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid token" });
  }
};

export default authProtect;