import express from "express";
import {
  isUserExists,
  onAddContact,
  onGetContacts,
  getUserOnlineStatus,
  onBlockContact,
  onUnblockContact,
  onPinContact,
  onUnpinContact,
  updateProfile,
  uploadMiddleware,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.post("/add-contact", authenticate, onAddContact);
userRouter.get("/contacts", authenticate, onGetContacts);

userRouter.post("/is-user-exists", isUserExists);
userRouter.get("/online-status/:userId", authenticate, getUserOnlineStatus);

userRouter.post("/block-contact", authenticate, onBlockContact);
userRouter.post("/unblock-contact", authenticate, onUnblockContact);

userRouter.post("/pin-contact", authenticate, onPinContact);
userRouter.post("/unpin-contact", authenticate, onUnpinContact);

userRouter.put("/profile", authenticate, uploadMiddleware, updateProfile);

export default userRouter;
