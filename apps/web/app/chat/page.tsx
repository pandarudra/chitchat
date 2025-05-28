"use client";
import React, { useState } from "react";
import { useSocket } from "../../context/SocketProvider";
import { SendHorizonal } from "lucide-react";

export default function Page() {
  const [messages, setMessages] = useState("");
  const [name, setName] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const { sendMessage, username } = useSocket();

  const SendToOne = () => {
    if (!messages || !name || !recipientId) {
      console.error("Please fill in all fields");
      return;
    }

    sendMessage(messages, recipientId, name);
    setMessages("");
    setName("");
    setRecipientId("");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-xl font-semibold text-gray-800 mb-6">
        Logged in as:{" "}
        <span className="text-blue-600">{username || "Guest"}</span>
      </div>

      <div className="w-full max-w-md  rounded-2xl shadow-lg  space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Your Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recipient Username
          </label>
          <input
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="Username of recipient"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <textarea
            value={messages}
            onChange={(e) => setMessages(e.target.value)}
            placeholder="Type your message..."
            className="w-full border border-gray-300 rounded-lg px-4 py-2 h-24 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={SendToOne}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-all duration-200"
        >
          <SendHorizonal className="w-5 h-5" />
          Send Message
        </button>
      </div>
    </div>
  );
}
