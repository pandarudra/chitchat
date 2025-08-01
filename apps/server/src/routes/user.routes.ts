import express from "express";
import {
  isUserExists,
  onAddContact,
  onGetContacts,
  getUserOnlineStatus,
  onBlockContact,
  onUnblockContact,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.post("/add-contact", authenticate, onAddContact);
userRouter.get("/contacts", authenticate, onGetContacts);

userRouter.post("/is-user-exists", isUserExists);
userRouter.get("/online-status/:userId", authenticate, getUserOnlineStatus);

userRouter.post("/block-contact", authenticate, onBlockContact);
userRouter.post("/unblock-contact", authenticate, onUnblockContact);

export default userRouter;
