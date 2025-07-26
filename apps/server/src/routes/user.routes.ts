import express from "express";
import {
  isUserExists,
  onAddContact,
  onGetContacts,
  getUserOnlineStatus,
  onBlockContact,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.post("/add-contact", authenticate, onAddContact);
userRouter.get("/contacts", authenticate, onGetContacts);
userRouter.post("/block-contact", authenticate, onBlockContact);
userRouter.post("/is-user-exists", isUserExists);
userRouter.get("/online-status/:userId", authenticate, getUserOnlineStatus);

export default userRouter;
