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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-emerald-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-md w-full relative z-10">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-border">
          <div className="text-center mb-10">
            <div className="mx-auto h-16 w-16 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-primary/20">
              <MessageSquareMore className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-2 uppercase">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm font-medium">
              Enter your email to sign in to your account
            </p>
          </div>

          {!showOtp ? (
            <form onSubmit={handleSubmit(onSendOtp)} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground"
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
                    className="block w-full px-4 py-3 bg-muted border border-border/80 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-muted-foreground text-foreground"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-xs font-semibold text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-97 cursor-pointer"
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

              <p className="text-center text-sm text-muted-foreground pt-4">
                Don't have an account?{" "}
                <a
                  href="/signup"
                  className="font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  Sign up
                </a>
              </p>
            </form>
          ) : (
            <form onSubmit={onVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label
                  htmlFor="otp"
                  className="block text-xs font-semibold uppercase tracking-wider mb-2 text-center text-muted-foreground"
                >
                  Enter Verification Code
                </label>
                <p className="text-center text-xs text-muted-foreground mb-4">
                  We sent a code to <span className="font-semibold text-foreground">{email}</span>
                </p>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full text-center tracking-[0.5em] text-2xl px-4 py-3 bg-muted border border-border/80 rounded-xl focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all text-foreground font-bold"
                  placeholder="------"
                  maxLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={sending || otp.length < 6}
                className="w-full flex items-center justify-center py-3 px-4 text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md active:scale-97 cursor-pointer"
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
