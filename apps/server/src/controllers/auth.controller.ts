import { Request, Response } from "express";
import { UserModel } from "../models/User";
import { generateToken } from "../utils/jwt";

// Extend Express Request interface to include 'user'
declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

export const onSignup = async (req: Request, res: Response): Promise<any> => {
  const { phoneNumber, displayName, avatarUrl } = req.body;

  if (!phoneNumber || !displayName) {
    return res
      .status(409)
      .json({ error: "Phone number and display name are required." });
  }

  try {
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
    return res.status(201).json({
      message: "User created successfully.",
      user: newUser,
    });
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

    const token = generateToken(userId as string);

    return res.status(200).json({
      message: "Login successful...",
      token,
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const onLogout = async (req: Request, res: Response): Promise<any> => {
  return res.status(200).json({ message: "Logout successful." });
};

export const onGetUser = async (req: Request, res: Response): Promise<any> => {
  return res.status(200).json({
    user: req.user,
  });
};
