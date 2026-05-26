import { redisClient } from "../utils/redisClient";
import { Request, Response } from "express";
import { Resend } from "resend";
import { RESEND_API_KEY, IS_PRODUCTION } from "../constants/e";

const resend = new Resend(RESEND_API_KEY);

export const sendOtp = async (req: Request, res: Response): Promise<any> => {
  const { email } = req.body;
  if (!email)
    return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.setex(`otp:${email}`, 300, otp); // 5 min expiry

  console.log(`OTP sent to ${email}: ${otp}`);

  if (IS_PRODUCTION || RESEND_API_KEY) {
    try {
      await resend.emails.send({
        from: "ChitChat <chitchat@apps.rudrax.me>", // update with verified domain later
        to: email,
        subject: "Your ChitChat Verification Code",
        html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in 5 minutes.</p>`,
      });
    } catch (error) {
      console.error("Error sending email OTP:", error);
      return res.status(500).json({ error: "Failed to send OTP email" });
    }
  }
  return res.json({ message: "OTP sent" });
};

export const verifyOtp = async (req: Request, res: Response): Promise<any> => {
  const { email, otp } = req.body;
  const storedOtp = await redisClient.get(`otp:${email}`);
  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ error: "Invalid or expired OTP" });
  }
  await redisClient.del(`otp:${email}`); // Remove OTP after verification
  return res.json({ message: "OTP verified" });
};
