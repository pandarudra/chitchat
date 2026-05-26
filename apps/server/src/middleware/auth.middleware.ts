import { Request, Response, NextFunction } from "express";
import { UserModel } from "../models/User";
import { verifyJWT } from "../utils/jwt";
import { IUser } from "../models/User";

// Extend Express Request to carry the authenticated user document.
// Placing the augmentation here (in middleware) keeps it co-located with its
// only author, instead of scattering it across multiple controller files.
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/**
 * Verifies the `token` cookie, looks up the matching user, and attaches it to
 * `req.user`. Returns 401 if the cookie is missing or the JWT is invalid.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies?.token;

  if (!token) {
    res.status(401).json({ error: "Authentication token is required." });
    return;
  }

  try {
    const userId = verifyJWT(token, "access");
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
