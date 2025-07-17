import express from "express";
import { onAddContact, onGetContacts } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.post("/add-contact", authenticate, onAddContact);
userRouter.get("/contacts", authenticate, onGetContacts);

export default userRouter;
