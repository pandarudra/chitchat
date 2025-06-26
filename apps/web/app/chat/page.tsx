"use client";

import { useState, useEffect } from "react";
import { useSocket } from "../../hooks/useSocket";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import { SendHorizonal } from "lucide-react";

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ from: string; content: string }[]>(
    []
  );
  const [recipientId, setRecipientId] = useState<string>("");

  const { sendMessage, socket } = useSocket();
  const { isAuthenticated, loading, Logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      router.push("/auth/signup");
    }
  }, [isAuthenticated, loading]);

  useEffect(() => {
    if (!socket) return;

    socket.on("one_to_one_message", (data: any) => {
      setMessages((prev) => [
        ...prev,
        { from: data.from, content: data.message },
      ]);
    });

    return () => {
      socket.off("one_to_one_message");
    };
  }, [socket]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message || !recipientId) {
      alert("Please fill in all fields");
      return;
    }

    sendMessage(message, recipientId);
    setMessages((prev) => [...prev, { from: "You", content: message }]);
    setMessage("");
  };

  const onLogout = async () => {
    try {
      await Logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-1/4 bg-white border-r border-gray-200 p-4 hidden md:block">
        <h2 className="text-xl font-semibold mb-4">Contacts</h2>
        <input
          type="text"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          placeholder="Enter phone number"
          className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />
        <button
          onClick={onLogout}
          className="w-full bg-red-500 text-white rounded-lg py-2 hover:bg-red-600"
        >
          Logout
        </button>
      </aside>

      {/* Chat Section */}
      <main className="flex flex-col flex-1 h-full">
        {/* Chat Header */}
        <div className="bg-white shadow px-6 py-4 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-700">Chat</h1>
          {recipientId && (
            <p className="text-sm text-gray-500">Talking to: {recipientId}</p>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-sm px-4 py-2 rounded-lg ${
                msg.from === "You"
                  ? "bg-blue-500 text-white self-end ml-auto"
                  : "bg-gray-200 text-black self-start mr-auto"
              }`}
            >
              {msg.content}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSendMessage}
          className="bg-white border-t border-gray-200 p-4 flex items-center gap-4"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2"
          >
            <SendHorizonal />
          </button>
        </form>
      </main>
    </div>
  );
}
