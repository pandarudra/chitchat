import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/otp.controller";

const OtpRouter = Router();

OtpRouter.post("/send", sendOtp);
OtpRouter.post("/verify", verifyOtp);

export default OtpRouter;
