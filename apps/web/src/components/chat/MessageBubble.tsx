import { format, isValid } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  senderName?: string;
  ifblocked?: boolean; // Optional prop to handle blocked contacts
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  senderName,
  ifblocked,
}: MessageBubbleProps) {
  const getStatusIcon = () => {
    if (!isOwn) return null;

    switch (message.status) {
      case "sent":
        return <Check className="h-4 w-4 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-4 w-4 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  // Ensure we have a valid timestamp
  const messageTime =
    message.timestamp && isValid(message.timestamp)
      ? format(message.timestamp, "HH:mm")
      : "";

  // Ensure content is a string
  const messageContent =
    typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content);
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-xs lg:max-w-md ${isOwn ? "order-2" : "order-1"}`}>
        {/* Sender name for group chats */}
        {!isOwn && senderName && showAvatar && (
          <p className="text-xs text-gray-500 mb-1 px-3">{senderName}</p>
        )}

        <div
          className={`px-4 py-2 rounded-lg ${
            isOwn
              ? "bg-green-500 text-white"
              : ifblocked
                ? "hidden"
                : "bg-white text-gray-800"
          }`}
        >
          {message.type === "text" ? (
            <p className="text-sm">{messageContent}</p>
          ) : (
            <div className="space-y-2">
              {message.type === "image" && (
                <img
                  src={message.mediaUrl}
                  alt="Shared image"
                  className="rounded-lg max-w-full h-auto"
                />
              )}
              {message.type === "file" && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                    <span className="text-xs">📄</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{message.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {message.fileSize
                        ? `${(message.fileSize / 1024).toFixed(1)} KB`
                        : ""}
                    </p>
                  </div>
                </div>
              )}
              {message.type === "audio" && (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-xs">🎵</span>
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              {messageContent && <p className="text-sm">{messageContent}</p>}
            </div>
          )}

          <div
            className={`flex items-center justify-end space-x-1 mt-1 ${
              isOwn ? "text-green-100" : "text-gray-500"
            }`}
          >
            <span className="text-xs">{messageTime}</span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}
