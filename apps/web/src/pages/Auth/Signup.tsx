import { useState } from "react";
import { useForm } from "react-hook-form";
import { User, Loader2 } from "lucide-react";
import { COUNTRY_CODES } from "../../utils/constants";
import { useAuth } from "../../context/AuthContext";

interface SignupFormData {
  name: string;
  countryCode: string;
  phoneNumber: string;
}

export function Signup() {
  const [submitting, setSubmitting] = useState(false);
  const { signup } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupFormData>({
    defaultValues: { name: "", countryCode: "+1", phoneNumber: "" },
  });

  const watchedDialCode = watch("countryCode");

  const onSubmit = async ({
    name,
    countryCode,
    phoneNumber,
  }: SignupFormData) => {
    const fullPhone = `${countryCode}${phoneNumber}`;
    try {
      setSubmitting(true);
      const {
        displayName,
        phoneNumber,
      }: {
        displayName: string;
        phoneNumber: string;
      } = { displayName: name, phoneNumber: fullPhone };

      await signup(displayName, phoneNumber);
    } catch (err) {
      console.error("Signup failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-green-500 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your ChitChat account
          </h2>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700"
            >
              Full Name
            </label>
            <input
              id="name"
              type="text"
              {...register("name", {
                required: "Name is required",
                minLength: {
                  value: 2,
                  message: "Name must be at least 2 characters",
                },
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Your Name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          {/* Country Code */}
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

          {/* Phone */}
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

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Sign Up"
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-green-600 hover:text-green-500"
            >
              Log in
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}
