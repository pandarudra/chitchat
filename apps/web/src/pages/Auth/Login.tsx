import { useState } from "react";
import { useForm } from "react-hook-form";
import { Phone, Loader2 } from "lucide-react";
import { COUNTRY_CODES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface LoginFormData {
  countryCode: string;
  phoneNumber: string;
}

export function Login() {
  const [sending, setSending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [phone, setPhone] = useState("");
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    defaultValues: {
      countryCode: "+1",
      phoneNumber: "",
    },
  });

  const watchedDialCode = watch("countryCode");

  // Step 1: Send OTP
  const onSendOtp = async ({ countryCode, phoneNumber }: LoginFormData) => {
    const fullPhone = `${countryCode}${phoneNumber}`;
    setPhone(fullPhone);

    try {
      const res = await api.post("/api/user/is-user-exists", {
        phoneNumber: fullPhone,
      });

      if (res.data.exists) {
        setSending(true);
        await api.post("/api/otp/send", { phoneNumber: fullPhone });
      } else {
        // Handle user not found case
        console.error("User does not exist.");
        toast.error("User does not exist. Please sign up first.");
        return;
      }
      setShowOtp(true);
    } catch (err) {
      console.error("Failed to send OTP:", err);
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Step 2: Verify OTP and Login
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      const res = await api.post("/api/otp/verify", {
        phoneNumber: phone,
        otp,
      });
      if (res.data.message === "OTP verified") {
        await login(phone); // Now call your login API
        toast.success("Login successful!");
      } else {
        // Show error
        toast.error("OTP verification failed. Please try again.");
        return;
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      toast.error("OTP verification failed. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-green-500 rounded-full flex items-center justify-center">
            <Phone className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome to ChitChat
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your phone number to continue
          </p>
        </div>

        {!showOtp ? (
          <form onSubmit={handleSubmit(onSendOtp)} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="countryCode"
                className="block text-sm font-medium text-gray-700"
              >
                Country Code
              </label>
              <select
                id="countryCode"
                {...register("countryCode", {
                  required: "Country code is required",
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                {COUNTRY_CODES.map((c, idx) => (
                  <option key={`${c.code}-${idx}`} value={c.dial_code}>
                    {c.dial_code} &nbsp; {c.code}
                  </option>
                ))}
              </select>
              {errors.countryCode && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.countryCode.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="phoneNumber"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {watchedDialCode}
                  </span>
                </div>
                <input
                  id="phoneNumber"
                  type="tel"
                  placeholder="1234567890"
                  {...register("phoneNumber", {
                    required: "Phone number is required",
                    pattern: {
                      value: /^[0-9]{6,15}$/,
                      message: "Enter a valid phone number",
                    },
                  })}
                  className="block w-full pl-16 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
              {errors.phoneNumber && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.phoneNumber.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={sending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Send OTP"
              )}
            </button>

            <p className="text-center text-sm text-gray-600">
              Don’t have an account?{" "}
              <a
                href="/signup"
                className="font-medium text-green-600 hover:text-green-500"
              >
                Sign up
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={onVerifyOtp} className="mt-8 space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-gray-700"
              >
                Enter OTP
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Enter OTP"
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Verify OTP"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
