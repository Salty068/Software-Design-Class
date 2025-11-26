import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

function sendError(res, status, error) {
  return res.status(status).json({ error });
}

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return sendError(res, 401, "Authentication required");
  }

  const token = authHeader.slice("Bearer ".length).trim();

  if (!token) {
    return sendError(res, 401, "Authentication required");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error("JWT verification failed:", error);
    if (error?.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired");
    }
    return sendError(res, 401, "Invalid token");
  }
};

export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return sendError(res, 401, "Invalid or expired token");
    }

    if (!roles.includes(req.user.role)) {
      return sendError(res, 403, "Insufficient permissions");
    }

    return next();
  };
};

export const auth = (req, res, next) => {
  if (!req.headers.authorization) {
    return sendError(res, 401, "Unauthorized");
  }

  return next();
};
