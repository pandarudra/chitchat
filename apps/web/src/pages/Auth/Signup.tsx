import { useState } from "react";
import { useForm } from "react-hook-form";
import { MessageSquarePlus, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../lib/api";
import toast from "react-hot-toast";

interface SignupFormData {
  displayName: string;
  email: string;
}

export function Signup() {
  const [sending, setSending] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [formData, setFormData] = useState<SignupFormData | null>(null);
  const { signup, requestOtp, verifyOtp } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      displayName: "",
      email: "",
    },
  });

  // Step 1: Send OTP
  const onSendOtp = async (data: SignupFormData) => {
    setFormData(data);
    try {
      setSending(true);
      const res = await api.post("/api/user/is-user-exists", {
        email: data.email,
      });

      if (res.data.exists) {
        toast.error("User with this email already exists.");
        return;
      }

      await requestOtp(data.email);
      setShowOtp(true);
      toast.success("Verification code sent to your email.");
    } catch (err) {
      console.error("Failed to send OTP:", err);
      toast.error("Failed to send verification code.");
    } finally {
      setSending(false);
    }
  };

  // Step 2: Verify OTP and Signup
  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    try {
      setSending(true);
      await verifyOtp(formData.email, otp);
      await signup(formData.displayName, formData.email);
      toast.success("Account created successfully!");
    } catch (err) {
      console.error("OTP verification failed:", err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-ink flex items-center justify-center p-4 overflow-hidden relative">
      {/* Subtle background accents */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-accent-teal/5 rounded-full mix-blend-multiply filter blur-3xl opacity-15"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-canvas border border-hairline rounded-lg p-8 sm:p-10 shadow-sm">
          <div className="text-center mb-10">
            <div className="mx-auto h-16 w-16 bg-surface-card rounded-md flex items-center justify-center mb-6 border border-hairline">
              <MessageSquarePlus className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-display-md font-display font-400 text-ink mb-2">
              Create an account
            </h1>
            <p className="text-body text-body-strong">
              Join ChitChat and start connecting
            </p>
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit(onSendOtp)} className="space-y-5">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-caption-uppercase text-muted mb-2"
                >
                  Full Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  placeholder="John Doe"
                  {...register("displayName", {
                    required: "Name is required",
                    minLength: {
                      value: 2,
                      message: "Name must be at least 2 characters",
                    },
                  })}
                  className="block w-full px-4 py-3 bg-canvas border border-hairline rounded-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted text-ink"
                />
                {errors.displayName && (
                  <p className="mt-2 text-caption text-error">
                    {errors.displayName.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-caption-uppercase text-muted mb-2"
                >
                  Email Address
                </label>
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
                {errors.email && (
                  <p className="mt-2 text-caption text-error">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-button font-sans font-500 rounded-md text-on-primary bg-primary hover:bg-primary-active disabled:opacity-50 disabled:bg-primary-disabled disabled:text-muted disabled:cursor-not-allowed transition-all shadow-sm mt-6 active:scale-95 cursor-pointer"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-body text-body-strong pt-4">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="font-sans font-500 text-primary hover:text-primary-active transition-colors"
                >
                  Sign in
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
                  <span className="font-sans font-500 text-ink">
                    {formData?.email}
                  </span>
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
                  "Create Account"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
