import { useRef, useState } from "react";
import { format, isValid } from "date-fns";
import { Check, CheckCheck, Play, Pause } from "lucide-react";
import type { Message } from "../../types";
import { AudioPlayer } from "./AudioPlayer";

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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoPlayPause = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
  };

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
              ? "bg-green-600 text-white"
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
              {message.type === "video" && (
                <div
                  className="relative rounded-lg overflow-hidden bg-black group cursor-pointer"
                  style={{ maxHeight: "300px" }}
                  onMouseEnter={() => setShowVideoControls(true)}
                  onMouseLeave={() => setShowVideoControls(false)}
                  onClick={handleVideoPlayPause}
                >
                  <video
                    ref={videoRef}
                    src={message.mediaUrl}
                    className="w-full h-auto rounded-lg"
                    style={{ maxHeight: "300px" }}
                    onEnded={handleVideoEnded}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                  />

                  {/* Custom Play/Pause Button with Animation */}
                  <div
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                      showVideoControls || !isVideoPlaying
                        ? "bg-transparent bg-opacity-30 opacity-100"
                        : "opacity-0"
                    }`}
                  >
                    <button
                      className={`
                        bg-white bg-opacity-90 hover:bg-opacity-100 
                        rounded-full p-3 shadow-lg 
                        transform transition-all duration-300 ease-in-out
                        ${
                          showVideoControls || !isVideoPlaying
                            ? "scale-100 translate-y-0"
                            : "scale-75 translate-y-2 opacity-50"
                        }
                        hover:scale-110 active:scale-95
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVideoPlayPause();
                      }}
                    >
                      {isVideoPlaying ? (
                        <Pause className="h-6 w-6 text-gray-800 transition-transform duration-200" />
                      ) : (
                        <Play className="h-6 w-6 text-gray-800 ml-0.5 transition-transform duration-200" />
                      )}
                    </button>
                  </div>

                  {/* Video Loading/Buffering Indicator */}
                  <div className="absolute top-2 right-2">
                    <div
                      className={`
                      w-2 h-2 bg-green-600 rounded-full 
                      ${isVideoPlaying ? "animate-pulse" : "opacity-50"}
                      transition-opacity duration-300
                    `}
                    />
                  </div>

                  {/* File Info Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                    <div className="text-white text-xs opacity-75">
                      {message.fileSize && (
                        <p>
                          {(message.fileSize / (1024 * 1024)).toFixed(1)} MB
                        </p>
                      )}
                    </div>
                  </div>
                </div>
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
                <AudioPlayer
                  audioUrl={message.mediaUrl || ""}
                  duration={message.duration}
                  isOwn={isOwn}
                />
              )}
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
