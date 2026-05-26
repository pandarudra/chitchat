import twilio from "twilio";
import { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } from "../constants/e";

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

export const sendOtpSms = async (phoneNumber: string, otp: string) => {
  await client.messages.create({
    body: `Your ChitChat OTP is: ${otp}`,
    from: TWILIO_PHONE_NUMBER,
    to: phoneNumber,
  });
};
