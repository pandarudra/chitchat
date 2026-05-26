import { format, isValid } from "date-fns";
import { Pin, VolumeX, MessageCircle, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { Chat } from "../../types";
import { useChat } from "../../context/ChatContext";
import { isUserOnline } from "../../utils/userUtils";

export function ChatList() {
  const { chats, activeChat, setActiveChat, searchQuery } = useChat();
  const { user } = useAuth();

  const filteredChats = chats.filter((chat) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      chat.groupName?.toLowerCase().includes(searchLower) ||
      chat.participants?.some((p) =>
        p.displayName?.toLowerCase().includes(searchLower)
      ) ||
      chat.lastMessage?.content.toLowerCase().includes(searchLower)
    );
  });

  const sortedChats = filteredChats.sort((a, b) => {
    // Pin status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Last message timestamp
    const aTime = a.lastMessage?.timestamp || new Date(0);
    const bTime = b.lastMessage?.timestamp || new Date(0);
    return bTime.getTime() - aTime.getTime();
  });

  const getChatName = (chat: Chat) => {
    if (chat.isGroup) {
      return chat.groupName || "Group Chat";
    }
    return (
      chat.participants?.find((p) => p.id !== user?.id)?.displayName ||
      "Unknown"
    );
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) {
      return null; // Group avatar logic
    }
    return chat.participants?.find((p) => p.id !== user?.id)?.avatarUrl || null;
  };

  const getLastMessagePreview = (chat: Chat) => {
    // Get the last message either from lastMessage or from messages array
    let lastMessage = chat.lastMessage;
    if (!lastMessage && chat.messages && chat.messages.length > 0) {
      lastMessage = chat.messages[chat.messages.length - 1];
    }

    if (!lastMessage) {
      return "No messages yet";
    }

    const { content, type, senderId } = lastMessage;
    const sender =
      senderId === user?.id
        ? "You"
        : chat.participants?.find((p) => p.id === senderId)?.displayName;

    const prefix = chat.isGroup
      ? `${sender}: `
      : senderId === user?.id
        ? "You: "
        : "";

    switch (type) {
      case "image":
        return `${prefix}📷 Image`;
      case "video":
        return `${prefix}🎥 Video`;
      case "file":
        return `${prefix}📄 File`;
      case "audio":
        return `${prefix}🎵 Audio`;
      default:
        return `${prefix}${content}`;
    }
  };

  const formatMessageTime = (timestamp: Date) => {
    if (!timestamp || !isValid(timestamp)) {
      return ""; // Return empty string for invalid dates
    }
    return format(timestamp, "HH:mm");
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        {sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
            <MessageCircle className="h-12 w-12 mb-4 opacity-30 text-primary-500" />
            <p className="text-sm font-medium">No chats found</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`flex items-center space-x-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                  activeChat?.id === chat.id
                    ? "bg-primary/10 text-foreground border-l-4 border-primary shadow-sm"
                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  {chat.isGroup ? (
                    <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center border border-border">
                      <Users className="h-5 w-5 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={getChatAvatar(chat) ?? undefined}
                      alt={getChatName(chat)}
                      className="w-11 h-11 rounded-xl object-cover border border-border shadow-xs"
                    />
                  )}
                  {!chat.isGroup &&
                    (() => {
                      const otherUser = chat.participants?.find(
                        (p) => p.id !== user?.id
                      );
                      return otherUser && isUserOnline(otherUser) ? (
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background"></div>
                      ) : null;
                    })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <h3 className="font-bold text-foreground text-sm truncate tracking-tight">
                        {getChatName(chat)}
                      </h3>
                      {chat.isAI && (
                        <div
                          title="Susi - Your AI companion"
                          className="flex items-center"
                        >
                          <span className="text-xs">🤖✨</span>
                        </div>
                      )}
                      {chat.isPinned && (
                        <Pin className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                      {chat.isMuted && (
                        <VolumeX className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                    {(() => {
                      const lastMsg =
                        chat.lastMessage ||
                        (chat.messages && chat.messages.length > 0
                          ? chat.messages[chat.messages.length - 1]
                          : null);
                      return (
                        lastMsg && (
                          <span className="text-[10px] font-semibold text-muted-foreground shrink-0">
                            {formatMessageTime(lastMsg.timestamp)}
                          </span>
                        )
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between mt-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate max-w-[85%]">
                      {getLastMessagePreview(chat)}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-primary rounded-full shrink-0">
                        {chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
