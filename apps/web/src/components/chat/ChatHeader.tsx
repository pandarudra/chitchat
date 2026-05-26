import { Phone, Video, Info, ArrowLeft } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { isUserOnline, getUserOnlineStatusText } from "../../utils/userUtils";
import { ChatOptions } from "./ChatOptions";

interface ChatHeaderProps {
  onOpenContactInfo: () => void;
}

export function ChatHeader({ onOpenContactInfo }: ChatHeaderProps) {
  const { activeChat, setActiveChat, initiateCall } = useChat();
  const { user } = useAuth();
  const showBackButton = useMediaQuery("(max-width: 1030px)");

  if (!activeChat) return null;

  const handleBackClick = () => {
    setActiveChat(null);
  };

  const handleInitiateCall = (callType: "audio" | "video") => {
    if (!activeChat || !user) return;
    const callee = activeChat.participants.find((p) => p.id !== user.id);
    if (callee) {
      initiateCall(callee, callType);
    }
  };

  const getChatName = () => {
    if (activeChat.isGroup) {
      return activeChat.groupName || "Group Chat";
    }
    return (
      activeChat.participants.find((p) => p.id !== user?.id)?.displayName ||
      "Unknown"
    );
  };

  const getChatAvatar = () => {
    if (activeChat.isGroup) {
      return null;
    }
    return activeChat.participants.find((p) => p.id !== user?.id)?.avatarUrl;
  };

  const getOnlineStatus = () => {
    if (activeChat.isGroup) {
      const onlineCount = activeChat.participants.filter((p) =>
        isUserOnline(p)
      ).length;
      return `${onlineCount} online`;
    }
    const otherUser = activeChat.participants.find((p) => p.id !== user?.id);
    return otherUser
      ? getUserOnlineStatusText(otherUser)
      : "Last seen recently";
  };

  return (
    <div className="w-full flex items-center justify-between p-4 border-b border-border bg-card shrink-0 z-10 shadow-xs">
      <div className="flex items-center space-x-3">
        {showBackButton && (
          <button
            onClick={handleBackClick}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
            title="Back to chats"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="relative">
          {activeChat.isGroup ? (
            <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center border border-border">
              <span className="text-muted-foreground font-medium">
                {getChatName().charAt(0).toUpperCase()}
              </span>
            </div>
          ) : (
            <>
              <img
                src={getChatAvatar() ?? undefined}
                alt={getChatName()}
                className="w-10 h-10 rounded-xl object-cover border border-border"
              />
              {/* Online status indicator */}
              {(() => {
                const otherUser = activeChat.participants.find(
                  (p) => p.id !== user?.id
                );
                return otherUser && isUserOnline(otherUser) ? (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full"></div>
                ) : null;
              })()}
            </>
          )}
        </div>
        <div>
          <h3 className="font-bold text-foreground text-base tracking-tight leading-none mb-1">{getChatName()}</h3>
          <p className="text-xs text-muted-foreground leading-none">{getOnlineStatus()}</p>
        </div>
      </div>

      <div className="flex items-center space-x-1.5">
        <button
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleInitiateCall("audio")}
          disabled={activeChat.isGroup}
          title={
            activeChat.isGroup
              ? "Calls not supported in group chats"
              : "Start audio call"
          }
        >
          <Phone className="h-5 w-5" />
        </button>
        <button
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => handleInitiateCall("video")}
          disabled={activeChat.isGroup}
          title={
            activeChat.isGroup
              ? "Calls not supported in group chats"
              : "Start video call"
          }
        >
          <Video className="h-5 w-5" />
        </button>
        <button
          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onOpenContactInfo}
          disabled={activeChat.isGroup}
          title={
            activeChat.isGroup
              ? "Contact info not available for groups"
              : "Contact information"
          }
        >
          <Info className="h-5 w-5" />
        </button>
        <ChatOptions chat={activeChat} />
      </div>
    </div>
  );
}
