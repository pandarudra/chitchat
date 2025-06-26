import { UserModel } from "../models/User";
import { verifyJWT } from "../utils/jwt";

export const authenticate = async (req: any, res: any, next: any) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: "Authentication token is required." });
  }
  try {
    const userId = verifyJWT(token, "access") as string;
    const user = await UserModel.findOne({
      _id: userId,
    });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};
