import { useState, useRef } from "react";
import { Send, Paperclip, Smile } from "lucide-react";
import toast from "react-hot-toast";
import EmojiPicker from "emoji-picker-react";
import { useChat } from "../../context/ChatContext";
import { useVoiceRecording } from "../../hooks/useVoiceRecording";
import { VoiceRecorder } from "./VoiceRecorder";

export function MessageInput() {
  const {
    activeChat,
    sendMessage,
    sendAIMessage,
    sendAudioMessage,
    sendMediaMessage,
  } = useChat();
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

  // Check if this is an AI chat
  const isAIChat =
    activeChat?.isAI || activeChat?.participants.some((p) => p.isAI);

  const getPlaceholderText = () => {
    if (isAIChat) {
      return "Chat with Susi... 🤖✨";
    }
    return "Type a message...";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isBlocked) {
      return;
    }

    if (message.trim()) {
      if (isAIChat) {
        sendAIMessage(message.trim());
      } else {
        sendMessage(message.trim());
      }

      setMessage("");
    }
  };

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) {
      return;
    }

    if (isBlocked) {
      toast.error("Cannot send media to blocked contact");
      return;
    }

    try {
      // Check file type
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error("Please select an image or video file");
        return;
      }

      // Check file size (limit to 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 50MB");
        return;
      }

      toast.loading("Uploading file...", { id: "upload" });

      if (isImage) {
        await sendMediaMessage(file, "image");
        toast.success("Image sent successfully!", { id: "upload" });
      } else if (isVideo) {
        await sendMediaMessage(file, "video");
        toast.success("Video sent successfully!", { id: "upload" });
      }
    } catch {
      toast.error("Failed to send file. Please try again.", { id: "upload" });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
      } catch {
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
      } catch {
        toast.error("Failed to send voice message");
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
              placeholder={getPlaceholderText()}
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
              accept="image/*,video/*"
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
