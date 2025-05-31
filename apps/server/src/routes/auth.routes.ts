import express from "express";
import {
  onGetUser,
  onLogin,
  onLogout,
  onSignup,
} from "../controllers/auth.controller";
import { authenticate } from "../utils/jwt";
const authRouter = express.Router();

authRouter.post("/signup", onSignup);
authRouter.post("/login", onLogin);
authRouter.get("/logout", authenticate, onLogout);
authRouter.get("/me", authenticate, onGetUser);

export default authRouter;
