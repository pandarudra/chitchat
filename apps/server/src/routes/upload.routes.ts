import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  uploadAudio,
  uploadImage,
  uploadVideo,
} from "../controllers/media.controller";
import { upload } from "../utils/multer";

const uploadRouter = Router();

// Upload audio file
uploadRouter.post("/audio", authenticate, upload.single("audio"), uploadAudio);

// Upload image file
uploadRouter.post("/image", authenticate, upload.single("image"), uploadImage);

// Upload video file
uploadRouter.post("/video", authenticate, upload.single("video"), uploadVideo);

export default uploadRouter;
