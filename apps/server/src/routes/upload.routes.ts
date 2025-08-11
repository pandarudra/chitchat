import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import { uploadAudio } from "../controllers/media.controller";
import { upload } from "../utils/multer";

const uploadRouter = Router();

// Upload audio file
uploadRouter.post("/audio", authenticate, upload.single("audio"), uploadAudio);

export default uploadRouter;
