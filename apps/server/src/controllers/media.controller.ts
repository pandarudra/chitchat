import { Request, Response } from "express";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const uploadAudio = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No audio file provided" });
      return;
    }

    const { duration } = req.body;
    const localFilePath = path.resolve(req.file.path);

    // 1. Upload local file to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video", // required for audio/video files
      folder: "chat-audio",
    });

    // 2. Delete the local file
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Error deleting local file:", err);
    });

    // 3. Respond with Cloudinary file URL
    res.json({
      success: true,
      audioUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      duration: parseInt(duration || "0"),
      cloudinaryPublicId: result.public_id,
    });
  } catch (error) {
    console.error("Error uploading audio file:", error);
    res.status(500).json({ error: "Failed to upload audio file" });
  }
};

export const uploadImage = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    const localFilePath = path.resolve(req.file.path);

    // 1. Upload local file to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "image",
      folder: "chat-images",
    });

    // 2. Delete the local file
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Error deleting local file:", err);
    });

    // 3. Respond with Cloudinary file URL
    res.json({
      success: true,
      imageUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      cloudinaryPublicId: result.public_id,
    });
  } catch (error) {
    console.error("Error uploading image file:", error);
    res.status(500).json({ error: "Failed to upload image file" });
  }
};

export const uploadVideo = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No video file provided" });
      return;
    }

    const localFilePath = path.resolve(req.file.path);

    // 1. Upload local file to Cloudinary
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",
      folder: "chat-videos",
    });

    // 2. Delete the local file
    fs.unlink(localFilePath, (err) => {
      if (err) console.error("Error deleting local file:", err);
    });

    // 3. Respond with Cloudinary file URL
    res.json({
      success: true,
      videoUrl: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      cloudinaryPublicId: result.public_id,
    });
  } catch (error) {
    console.error("Error uploading video file:", error);
    res.status(500).json({ error: "Failed to upload video file" });
  }
};
