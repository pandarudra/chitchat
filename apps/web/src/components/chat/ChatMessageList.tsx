import { RefObject } from "react";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { useAuth } from "../../context/AuthContext";
import { groupMessagesByDate } from "../../utils/messageUtils";
import { Chat } from "../../types/chat";

interface ChatMessageListProps {
  activeChat: Chat;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function ChatMessageList({ activeChat, messagesEndRef }: ChatMessageListProps) {
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-3.5 bg-background">
      {activeChat.messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
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
                    ifblocked={message.isBlocked}
                  />
                );
              })}
            </div>
          ));
        })()
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
