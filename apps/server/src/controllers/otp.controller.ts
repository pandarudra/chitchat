import { redisClient } from "../utils/redisClient";
import { Request, Response } from "express";
import { sendOtpSms } from "../utils/sms";

export const sendOtp = async (req: Request, res: Response): Promise<any> => {
  const { phoneNumber } = req.body;
  if (!phoneNumber)
    return res.status(400).json({ error: "Phone number required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.setex(`otp:${phoneNumber}`, 300, otp); // 5 min expiry

  await sendOtpSms(phoneNumber, otp);
  return res.json({ message: "OTP sent" });
};

export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  const { phoneNumber, otp } = req.body;
  const storedOtp = await redisClient.get(`otp:${phoneNumber}`);
  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }
  await redisClient.del(`otp:${phoneNumber}`); // Remove OTP after verification
  // Proceed with login/signup logic
  return res.json({ message: "OTP verified" });
};
