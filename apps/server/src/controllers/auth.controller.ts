import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { generateToken, verifyJWT } from "../utils/jwt";
import { Logger } from "../utils/logger";

export const onSignup = async (req: Request, res: Response): Promise<void> => {
  const { email, displayName } = req.body;

  if (!email || !displayName) {
    res.status(409).json({ error: "Email and display name are required." });
    return;
  }

  try {
    const alreadyExists = await UserModel.findOne({ email });
    if (alreadyExists) {
      res.status(400).json({ error: "User with this email already exists." });
      return;
    }

    // Generate a deterministic but randomised avatar via DiceBear
    const seed = displayName + Math.floor(Math.random() * 10000);
    const avatarUrl = `https://api.dicebear.com/9.x/adventurer/svg?seed=${seed}`;

    const newUser = new UserModel({
      email,
      displayName,
      avatarUrl,
      status: "Hey there! I am using ChitChat.",
      lastSeen: new Date(),
    });
    await newUser.save();

    // Reuse login to issue tokens immediately after signup
    req.body.email = newUser.email;
    return onLogin(req, res);
  } catch (error) {
    Logger.error("Error during signup", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onLogin = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ error: "Email is required for login." });
    return;
  }

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(404).json({ error: "User with this email does not exist." });
      return;
    }

    user.lastSeen = new Date();
    await user.save();

    const userId = (user._id as string).toString();
    const accessToken = generateToken(userId, "access");
    const refreshToken = generateToken(userId, "refresh");

    const cookieDefaults = {
      httpOnly: true,
      secure: true,
      sameSite: "none" as const,
    };

    res.cookie("ref_token", refreshToken, {
      ...cookieDefaults,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie("token", accessToken, {
      ...cookieDefaults,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({ message: "Login successful.", user });
  } catch (error) {
    Logger.error("Error during login", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onLogout = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(400).json({ error: "User ID is required for logout." });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    user.lastSeen = new Date();
    await user.save();

    res.clearCookie("token");
    res.clearCookie("ref_token");

    res.status(200).json({ message: `User ${userId} logged out successfully.` });
  } catch (error) {
    Logger.error("Error during logout", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onGetUser = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: "User not authenticated." });
    return;
  }
  res.status(200).json({ user: req.user });
};

export const onRefreshToken = async (req: Request, res: Response): Promise<void> => {
  const ref_token = req.cookies?.ref_token;

  if (!ref_token) {
    res.status(401).json({ error: "Refresh token is required." });
    return;
  }

  try {
    const userId = verifyJWT(ref_token, "refresh");
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const newAccessToken = generateToken(userId, "access");
    res.cookie("token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 15 * 60 * 1000,
    });

    res.status(200).json({ message: "Token refreshed successfully." });
  } catch (error) {
    Logger.error("Error during token refresh", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
