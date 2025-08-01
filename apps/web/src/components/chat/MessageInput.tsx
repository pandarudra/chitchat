import React, { useState, useRef } from "react";
import { Send, Paperclip, Smile, Mic } from "lucide-react";

import EmojiPicker from "emoji-picker-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";

export function MessageInput() {
  const { activeChat, sendMessage } = useChat();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current chat is blocked - multiple ways to check
  const otherParticipant = activeChat?.participants.find(
    (p) => p.id !== user?.id
  );
  const isBlocked =
    activeChat?.isBlocked ||
    otherParticipant?.isBlocked ||
    activeChat?.participants.some((p) => p.isBlocked);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      // Show error message or toast
      console.warn("Cannot send message to blocked contact");
      return;
    }

    if (message.trim()) {
      sendMessage(message.trim());
      setMessage("");
    }
  };

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChat) {
      // Handle file upload logic here
      console.log("File selected:", file);
    }
  };

  const handleVoiceRecord = () => {
    setIsRecording(!isRecording);
    // Handle voice recording logic here
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (isBlocked) {
    return (
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-sm">You cannot send messages to this contact.</p>
          <p className="text-xs">This contact has been blocked.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none placeholder-gray-500"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
          </div>

          {showEmojiPicker && (
            <div className="absolute bottom-full mb-2 left-0 z-10">
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                width={300}
                height={400}
              />
            </div>
          )}
        </div>

        {message.trim() ? (
          <button
            type="submit"
            className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleVoiceRecord}
            className={`p-2 rounded-full transition-colors ${
              isRecording
                ? "bg-red-500 text-white"
                : "bg-gray-500 text-white hover:bg-gray-600"
            }`}
          >
            <Mic className="h-5 w-5" />
          </button>
        )}
      </form>
    </div>
  );
}
