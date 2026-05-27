import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video, User } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl } from "../../utils/constants";
import { useRingtone } from "../../hooks/useRingtone";

function CallNotification() {
  const { call, declineCall, acceptCall } = useChat();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const { audioRef, stopRingtone } = useRingtone(call.status === "ringing");

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Show notification only for incoming calls
  useEffect(() => {
    if (call.status === "ringing") {
      setIsVisible(true);

      const otherUser =
        call.caller?.id === user?.id ? call.callee : call.caller;
      const callerName = otherUser?.displayName || "Unknown";

      // Show browser notification
      if ("Notification" in window && Notification.permission === "granted") {
        const notification = new Notification(
          `Incoming ${call.callType} call`,
          {
            body: `${callerName} is calling you`,
            icon: otherUser?.avatarUrl
              ? getAvatarUrl(otherUser.avatarUrl)
              : "/vite.svg",
            tag: "incoming-call",
            requireInteraction: true,
          },
        );

        notification.onclick = () => {
          window.focus();
          notification.close();
          if (call.callId) acceptCall(call.callId);
        };

        notification.onclose = () => notification.close();
      }

      // Auto-hide after 30 seconds if not answered
      const timeout = setTimeout(() => {
        setIsVisible(false);
        stopRingtone();
      }, 30000);

      return () => {
        clearTimeout(timeout);
      };
    } else {
      setIsVisible(false);
    }
  }, [
    call.status,
    call.caller,
    call.callee,
    call.callType,
    call.callId,
    acceptCall,
    user?.id,
    stopRingtone,
  ]);

  const otherUser = call.caller?.id === user?.id ? call.callee : call.caller;

  if (call.status !== "ringing" || !isVisible) return null;

  return (
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-[9999] ">
      {/* Hidden audio element for ringing sound */}
      <audio
        ref={audioRef}
        preload="auto"
        muted={false}
        controls={false}
        style={{ display: "none" }}
      >
        <source src="/audio/ring.mp3" type="audio/mpeg" />
        <source src="/audio/ring.mp3" type="audio/mp3" />
        <source src="/audio/ring.mp3" type="audio/wav" />
        Your browser does not support the audio element.
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
              {otherUser?.email || "No email"}
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
              stopRingtone();
              setIsVisible(false);
              if (call.callId) declineCall(call.callId);
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
              stopRingtone();
              setIsVisible(false);
              if (call.callId) acceptCall(call.callId);
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
    </div>
  );
}

export default CallNotification;
