import { useEffect, useRef } from "react";
import { Phone, Video, MoreVertical, Info } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";
import { DateSeparator } from "./DateSeparator";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { groupMessagesByDate } from "../../utils/messageUtils";

export function ChatWindow() {
  const { activeChat } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-16 h-16 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to ChitChat
          </h3>
          <p className="text-gray-600">Select a chat to start messaging</p>
        </div>
      </div>
    );
  }

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
      const onlineCount = activeChat.participants.filter(
        (p) => p.isOnline
      ).length;
      return `${onlineCount} online`;
    }
    const otherUser = activeChat.participants.find((p) => p.id !== user?.id);
    return otherUser?.isOnline ? "Online" : "Last seen recently";
  };

  return (
    <div className="flex-1 flex flex-col bg-white relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 lg:left-80 flex items-center justify-between p-4 border-b border-gray-200 bg-white z-30">
        <div className="flex items-center space-x-3">
          <div className="relative">
            {activeChat.isGroup ? (
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium">
                  {getChatName().charAt(0).toUpperCase()}
                </span>
              </div>
            ) : (
              <img
                src={getChatAvatar() ?? undefined}
                alt={getChatName()}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{getChatName()}</h3>
            <p className="text-sm text-gray-500">{getOnlineStatus()}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Video className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <Info className="h-5 w-5" />
          </button>
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages with top padding to account for fixed header */}
      <div className="flex-1 overflow-y-auto p-4 pt-20 pb-24 space-y-2 bg-gray-50">
        {activeChat.messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          (() => {
            const messageGroups = groupMessagesByDate(activeChat.messages);

            return messageGroups.map((group, groupIndex) => (
              <div key={group.date.toISOString()} className="space-y-2">
                {/* Date Separator */}
                <DateSeparator date={group.date} />

                {/* Messages for this date */}
                {group.messages.map((message, messageIndex) => {
                  const previousMessage =
                    messageIndex > 0
                      ? group.messages[messageIndex - 1]
                      : groupIndex > 0
                        ? messageGroups[groupIndex - 1].messages[
                            messageGroups[groupIndex - 1].messages.length - 1
                          ]
                        : null;

                  return (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      isOwn={message.senderId === user?.id}
                      showAvatar={
                        !previousMessage ||
                        previousMessage.senderId !== message.senderId
                      }
                      senderName={
                        activeChat.isGroup
                          ? activeChat.participants.find(
                              (p) => p.id === message.senderId
                            )?.displayName
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            ));
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Fixed Message Input */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-80 bg-white z-30">
        <MessageInput />
      </div>
    </div>
  );
}
