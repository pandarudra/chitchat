"use client";

import { useState } from "react";
import { SendHorizonal } from "lucide-react";
import { useSocket } from "../../hooks/useSocket";
import React from "react";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";

export default function ChatPage() {
  const [message, setMessage] = useState("");

  const [recipientId, setRecipientId] = useState<string>("");
  const { sendMessage } = useSocket();
  const { isAuthenticated, loading, Logout } = useAuth();
  const router = useRouter();

  // if not authenticated, redirect to login
  React.useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/signup");
      return;
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-700">Loading...</div>
      </div>
    );
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !recipientId) {
      alert("Please fill in all fields");
      return;
    }

    sendMessage(message, recipientId);
    console.log("Message sent:", { recipientId, message });
    setMessage("");
  };

  const onLogout = async () => {
    try {
      await Logout();
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Logout failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 space-y-5">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">
          Send Message
        </h1>

        <form onSubmit={handleSendMessage} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recipient phone No.
            </label>
            <input
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              placeholder="Phone No. of recipient"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
          >
            <SendHorizonal className="w-5 h-5" />
            Send Message
          </button>
        </form>

        <button onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
