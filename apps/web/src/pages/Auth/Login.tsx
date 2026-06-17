import { useState } from "react";
import { useForm } from "react-hook-form";
import { MessageSquareMore, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface LoginFormData {
  email: string;
}

export function Login() {
  const [sending, setSending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const { login, requestOtp, verifyOtp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
    },
  });

  // Step 1: Send OTP
  const onSendOtp = async (data: LoginFormData) => {
    setEmail(data.email);

    try {
      setSending(true);
      const res = await api.post("/api/user/is-user-exists", {
        email: data.email,
      });

      if (res.data.exists) {
        await requestOtp(data.email);
        setShowOtp(true);
        toast.success("Verification code sent to your email.");
      } else {
        toast.error("User does not exist. Please sign up first.");
      }
    } catch (err) {
      console.error("Failed to send OTP:", err);
      toast.error("Failed to send verification code.");
    } finally {
      setSending(false);
    }
  };

  // Step 2: Verify OTP and Login
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      await verifyOtp(email, otp);
      await login(email);
      toast.success("Welcome back!");
    } catch (err) {
      console.error("OTP verification failed:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4 overflow-hidden relative">
      {/* Subtle background accents */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute -bottom-8 right-10 w-72 h-72 bg-accent-teal/5 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-canvas border border-hairline rounded-lg p-8 sm:p-10 shadow-sm">
          <div className="text-center mb-10">
            <div className="mx-auto h-16 w-16 bg-surface-card rounded-md flex items-center justify-center mb-6 border border-hairline">
              <MessageSquareMore className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-display-md font-display font-400 text-ink mb-2">
              Welcome back
            </h1>
            <p className="text-body text-body-strong">
              Enter your email to sign in to your account
            </p>
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit(onSendOtp)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-caption-uppercase text-muted mb-2"
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    {...register("email", {
                      required: "Email is required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email address",
                      },
                    })}
                    className="block w-full px-4 py-3 bg-canvas border border-hairline rounded-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted text-ink"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-caption text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-button font-sans font-500 rounded-md text-on-primary bg-primary hover:bg-primary-active disabled:opacity-50 disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue with Email
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-body text-body-strong pt-4">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="font-sans font-500 text-primary hover:text-primary-active transition-colors"
                >
                  Sign up
                </a>
              </p>
            </form>
          ) : (
            <form
              onSubmit={onVerifyOtp}
              className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div>
                <label
                  htmlFor="otp"
                  className="block text-caption-uppercase text-muted mb-2 text-center"
                >
                  Enter Verification Code
                </label>
                <p className="text-center text-body text-body mb-4">
                  We sent a code to{" "}
                  <span className="font-sans font-500 text-ink">{email}</span>
                </p>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center tracking-[0.5em] text-2xl px-4 py-3 bg-canvas border border-hairline rounded-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-ink font-bold"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={sending || otp.length < 6}
                className="w-full flex items-center justify-center py-3 px-4 text-button font-sans font-500 rounded-md text-on-primary bg-primary hover:bg-primary-active disabled:opacity-50 disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Verify & Sign In"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
