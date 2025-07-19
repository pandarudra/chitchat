import express from "express";
import {
  isUserExists,
  onAddContact,
  onGetContacts,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.post("/add-contact", authenticate, onAddContact);
userRouter.get("/contacts", authenticate, onGetContacts);
userRouter.post("/is-user-exists", isUserExists);

export default userRouter;
