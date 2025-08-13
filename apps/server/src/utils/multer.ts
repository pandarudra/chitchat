import multer from "multer";
import path from "path";
import fs from "fs";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create subdirectories for different file types
const audioUploadsDir = path.join(uploadsDir, "audio");
const imageUploadsDir = path.join(uploadsDir, "images");
const videoUploadsDir = path.join(uploadsDir, "videos");

[audioUploadsDir, imageUploadsDir, videoUploadsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = uploadsDir;

    if (file.mimetype.startsWith("audio/")) {
      uploadDir = audioUploadsDir;
    } else if (file.mimetype.startsWith("image/")) {
      uploadDir = imageUploadsDir;
    } else if (file.mimetype.startsWith("video/")) {
      uploadDir = videoUploadsDir;
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    let prefix = "file";

    if (file.mimetype.startsWith("audio/")) {
      prefix = "audio";
    } else if (file.mimetype.startsWith("image/")) {
      prefix = "image";
    } else if (file.mimetype.startsWith("video/")) {
      prefix = "video";
    }

    cb(null, `${prefix}-${uniqueSuffix}${extension}`);
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for images and videos
  },
  fileFilter: (req, file, cb) => {
    // Accept audio, image, and video files
    if (
      file.mimetype.startsWith("audio/") ||
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only audio, image, and video files are allowed"));
    }
  },
});
