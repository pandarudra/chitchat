import { useEffect, useState, useRef } from "react";
import { Phone, PhoneOff, Video, User } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl } from "../../utils/constants";

function CallNotification() {
  const { call, declineCall, acceptCall } = useChat();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Show notification only for incoming calls
  useEffect(() => {
    if (call.status === "ringing") {
      setIsVisible(true);

      // Store audio reference for cleanup
      const audio = audioRef.current;

      // Play ringing sound
      if (audio) {
        audio.loop = true;
        audio.play().catch((error: unknown) => {
          console.log("Could not play ring sound:", error);
        });
      }

      // Auto-hide after 30 seconds if not answered
      const timeout = setTimeout(() => {
        setIsVisible(false);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      }, 30000);

      return () => {
        clearTimeout(timeout);
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    } else {
      setIsVisible(false);
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    }
  }, [call.status]);

  // Get other user info
  const otherUser = call.caller?.id === user?.id ? call.callee : call.caller;

  // Don't render if not an incoming call or if call is idle
  if (call.status !== "ringing" || !isVisible) return null;

  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[9999] animate-bounce">
      {/* Hidden audio element for ringing sound */}
      <audio ref={audioRef} preload="auto">
        {/* Using a data URL for a simple beep sound, or you can use a URL to a ring tone file */}
        <source
          src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEaAz2X0fOmeykDJoXQ8dyLOAYNaLjt4pxKCgpOqOH0wnUjBD6Wz/K7dyMELILM8+OLOAgObrzp36JNDAc+ltTyxnkpAylzx+/gpVELCFSv5feoWBUIU6nh9MN2IwQ+l9Dyw3cgBSSLy/Fhdy8FKm/E9+KlUAsHZZzW9LNLCoZQpOLzIHcoAyR0yO7oqVELB2em2fW1YQ==,M7+L0PPCdSEBJI=="
          type="audio/wav"
        />
      </audio>

      {/* Notification Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-72 sm:min-w-80 max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {call.callType === "video" ? (
              <Video className="w-5 h-5 text-green-500" />
            ) : (
              <Phone className="w-5 h-5 text-green-500" />
            )}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Incoming {call.callType} call
            </span>
          </div>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        </div>

        {/* Caller Info */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            {otherUser?.avatarUrl ? (
              <img
                src={getAvatarUrl(otherUser.avatarUrl)}
                alt={otherUser.displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-lg truncate">
              {otherUser?.displayName || "Unknown"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              {otherUser?.phoneNumber || "No number"}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between space-x-3">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Stop ringing sound
              const audio = audioRef.current;
              if (audio) {
                audio.pause();
                audio.currentTime = 0;
              }

              setIsVisible(false);

              if (call.callId) {
                declineCall(call.callId);
              }
            }}
            className="flex-1 flex items-center justify-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PhoneOff className="w-4 h-4" />
            <span className="sm:inline hidden">Decline</span>
            <span className="sm:hidden inline">✕</span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();

              // Stop ringing sound
              const audio = audioRef.current;
              if (audio) {
                audio.pause();
                audio.currentTime = 0;
              }

              setIsVisible(false);

              if (call.callId) {
                acceptCall(call.callId);
              }
            }}
            disabled={!call.callId}
            className="flex-1 flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Phone className="w-4 h-4" />
            <span className="sm:inline hidden">Accept</span>
            <span className="sm:hidden inline">✓</span>
          </button>
        </div>
      </div>

      {/* Ring Animation */}
      <div className="absolute inset-0 rounded-xl border-2 border-green-500 animate-ping opacity-75 pointer-events-none"></div>
    </div>
  );
}

export default CallNotification;
