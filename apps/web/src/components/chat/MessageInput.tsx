import React, { useState, useRef } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { useChat } from "../../context/ChatContext";
import { useVoiceRecording } from "../../hooks/useVoiceRecording";
import { VoiceRecorder } from "./VoiceRecorder";

export function MessageInput() {
  const { activeChat, sendMessage, sendAudioMessage } = useChat();
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording hook
  const {
    isRecording,
    recordingTime,
    audioBlob,
    startRecording,
    stopRecording,
    cancelRecording,
    error: recordingError,
  } = useVoiceRecording();

  // Check if current chat is blocked
  const isBlocked =
    activeChat?.isBlocked ||
    activeChat?.participants.find((p) => p.id === activeChat?.id)?.isBlocked;

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

  const handleEmojiClick = (emojiData: { emoji: string }) => {
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

  const handleVoiceRecord = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch (error) {
        console.log("Error starting recording:", error);
        toast.error(
          "Failed to start recording. Please check microphone permissions."
        );
      }
    }
  };

  const handleSendAudio = async () => {
    if (audioBlob && recordingTime > 0) {
      try {
        await sendAudioMessage(audioBlob, recordingTime);
        cancelRecording(); // Clear the recording
        toast.success("Voice message sent!");
      } catch (error) {
        toast.error("Failed to send voice message");
        console.error("Error sending voice message:", error);
      }
    }
  };

  const handleCancelAudio = () => {
    cancelRecording();
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
    <div className="border-t border-gray-200 p-2 sm:p-4 bg-white">
      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative min-w-0">
          <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-3 sm:px-4 py-2">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <Smile className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-none outline-none placeholder-gray-500 text-sm sm:text-base min-w-0"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <Paperclip className="h-4 w-4 sm:h-5 sm:w-5" />
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
                width={280}
                height={350}
              />
            </div>
          )}
        </div>

        <div className="flex-shrink-0">
          {message.trim() ? (
            <button
              type="submit"
              className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          ) : (
            <VoiceRecorder
              isRecording={isRecording}
              recordingTime={recordingTime}
              onStart={handleVoiceRecord}
              onStop={handleVoiceRecord}
              onCancel={handleCancelAudio}
              onSend={handleSendAudio}
              hasRecording={!!audioBlob}
              error={recordingError}
            />
          )}
        </div>
      </form>
    </div>
  );
}
