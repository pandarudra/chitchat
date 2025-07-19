import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER!;
const client = twilio(accountSid, authToken);

export const sendOtpSms = async (phoneNumber: string, otp: string) => {
  await client.messages.create({
    body: `Your ChitChat OTP is: ${otp}`,
    from: twilioPhone,
    to: phoneNumber,
  });
};
