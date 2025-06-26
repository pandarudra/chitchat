import express from "express";
import {
  onGetUser,
  onLogin,
  onLogout,
  onRefreshToken,
  onSignup,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const authRouter = express.Router();

authRouter.post("/signup", onSignup);
authRouter.post("/login", onLogin);
authRouter.get("/logout", authenticate, onLogout);
authRouter.get("/me", authenticate, onGetUser);
authRouter.get("/refresh_my_token", onRefreshToken);

export default authRouter;
