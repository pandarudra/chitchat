import { format } from "date-fns";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  senderName?: string;
}

export function MessageBubble({
  message,
  isOwn,
  showAvatar,
  senderName,
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
              : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          {message.type === "text" ? (
            <p className="text-sm">{message.content}</p>
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
              {message.content && <p className="text-sm">{message.content}</p>}
            </div>
          )}

          <div
            className={`flex items-center justify-end space-x-1 mt-1 ${
              isOwn ? "text-green-100" : "text-gray-500"
            }`}
          >
            <span className="text-xs">
              {format(message.timestamp, "HH:mm")}
            </span>
            {getStatusIcon()}
          </div>
        </div>
      </div>
    </div>
  );
}
