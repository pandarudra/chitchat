"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useAuth } from "../../../hooks/useAuth";

export default function Login() {
  const { isAuthenticated, Login, loading } = useAuth();
  const router = useRouter();
  const [phoneNumber, setphoneNumber] = React.useState("");

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push("/chat");
      return;
    }
  }, [isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-700">Loading...</div>
      </div>
    );
  }

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Login(phoneNumber);
      router.push("/chat");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form
        onSubmit={onLogin}
        className="max-w-md w-full bg-white rounded-lg shadow-md p-6 space-y-6"
      >
        <h2 className="text-2xl font-bold text-gray-800">Login</h2>

        <div className="flex flex-col">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            required
            placeholder="+1234567890"
            value={phoneNumber}
            onChange={(e) => setphoneNumber(e.target.value)}
            className="mt-1 p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition duration-200"
        >
          Login
        </button>
      </form>
    </div>
  );
}
