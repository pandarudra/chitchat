import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { generateToken, verifyJWT } from "../utils/jwt";

// Extend Express Request interface to include 'user'
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const onSignup = async (req: Request, res: Response): Promise<any> => {
  const { phoneNumber, displayName } = req.body;

  if (!phoneNumber || !displayName) {
    return res
      .status(409)
      .json({ error: "Phone number and display name are required." });
  }

  try {
    // random avatar URL using dicebear
    const seed = displayName + Math.floor(Math.random() * 10000);
    const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;

    const alreadyExists = await UserModel.findOne({ phoneNumber });
    if (alreadyExists) {
      return res
        .status(400)
        .json({ error: "User with this phone number already exists." });
    }

    const newUser = new UserModel({
      phoneNumber,
      displayName,
      avatarUrl,
      status: "Hey there! I am using ChitChat.",
      lastSeen: new Date(),
    });
    await newUser.save();

    req.body.phoneNumber = newUser.phoneNumber;
    return onLogin(req, res);
  } catch (error) {
    console.error("Error during signup:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const onLogin = async (req: Request, res: Response): Promise<any> => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return res
      .status(400)
      .json({ error: "Phone number is required for login." });
  }
  try {
    const user = await UserModel.findOne({ phoneNumber });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User with this phone number does not exist." });
    }
    // Update last seen time

    //otp generation and verification logic would go here
    // For now, we will just update the last seen time
    user.lastSeen = new Date();
    await user.save();
    const userId = user._id;

    const token = generateToken(userId as string, "access");
    const ref_token = generateToken(userId as string, "refresh");

    // refresh token
    res.cookie("ref_token", ref_token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // access token
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.status(200).json({
      message: "Login successful...",
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const onLogout = async (req: Request, res: Response): Promise<any> => {
  const userId = req.user?._id;
  if (!userId) {
    return res.status(400).json({ error: "User ID is required for logout." });
  }
  // Clear the cookie
  res.clearCookie("token");
  res.clearCookie("ref_token");

  // lastSeen update logic
  const user = await UserModel.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }
  user.lastSeen = new Date();
  await user.save();

  return res
    .status(200)
    .json({ message: `User ${userId} logged out successfully.` });
};

export const onGetUser = async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({ error: "User not authenticated." });
  }
  return res.status(200).json({
    user: req.user,
  });
};

export const onRefreshToken = async (
  req: Request,
  res: Response
): Promise<any> => {
  const ref_token = req.cookies?.ref_token;
  if (!ref_token) {
    return res.status(401).json({ error: "Refresh token is required." });
  }
  try {
    const userId = verifyJWT(ref_token, "refresh") as string;
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Generate new access token
    const newAccessToken = generateToken(userId, "access");

    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    return res.status(200).json({
      message: "Token refreshed successfully.",
    });
  } catch (error) {
    console.error("Error during token refresh:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
