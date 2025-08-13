import { format, isValid } from "date-fns";
import { Pin, VolumeX, MessageCircle, Users } from "lucide-react";
import { useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import type { Chat } from "../../types";
import { useChat } from "../../context/ChatContext";
import { isUserOnline } from "../../utils/userUtils";

export function ChatList() {
  const { chats, activeChat, setActiveChat, searchQuery } = useChat();
  const { user } = useAuth();

  // Force re-render when messages change by creating a dependency on message counts
  const messageCountKey = useMemo(
    () =>
      chats.map((chat) => `${chat.id}-${chat.messages?.length || 0}`).join(","),
    [chats]
  );

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
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto">
        {sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No chats found</p>
          </div>
        ) : (
          <div className="space-y-1">
            {sortedChats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setActiveChat(chat)}
                className={`flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  activeChat?.id === chat.id
                    ? "bg-green-50 border-r-4 border-green-500"
                    : ""
                }`}
              >
                <div className="relative">
                  {chat.isGroup ? (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                  ) : (
                    <img
                      src={getChatAvatar(chat) ?? undefined}
                      alt={getChatName(chat)}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  {!chat.isGroup &&
                    (() => {
                      const otherUser = chat.participants?.find(
                        (p) => p.id !== user?.id
                      );
                      return otherUser && isUserOnline(otherUser) ? (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      ) : null;
                    })()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getChatName(chat)}
                      </h3>
                      {chat.isPinned && (
                        <Pin className="h-4 w-4 text-gray-500" />
                      )}
                      {chat.isMuted && (
                        <VolumeX className="h-4 w-4 text-gray-500" />
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
                          <span className="text-xs text-gray-500">
                            {formatMessageTime(lastMsg.timestamp)}
                          </span>
                        )
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-gray-600 truncate">
                      {getLastMessagePreview(chat)}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-500 rounded-full">
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
