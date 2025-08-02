import { Request, Response } from "express";

export const uploadAudio = (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No audio file provided" });
      return;
    }

    const { duration } = req.body;
    const audioUrl = `/uploads/audio/${req.file.filename}`;

    res.json({
      success: true,
      audioUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      duration: parseInt(duration || "0"),
    });
  } catch (error) {
    console.error("Error uploading audio file:", error);
    res.status(500).json({ error: "Failed to upload audio file" });
  }
};
