import { useEffect, useRef, useState } from "react";
import { MessageInput } from "./MessageInput";
import { ContactInfo } from "./ContactInfo";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";

export function ChatWindow() {
  const { activeChat, initiateCall, deleteContact } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat]);

  const handleInitiateCall = (callType: "audio" | "video") => {
    if (!activeChat || !user) return;
    const callee = activeChat.participants.find((p) => p.id !== user.id);
    if (callee) {
      initiateCall(callee, callType);
    }
  };

  const handleContactInfoCall = (callType: "audio" | "video") => {
    handleInitiateCall(callType);
    setIsContactInfoOpen(false);
  };

  const handleBlockContact = () => {
    console.log("Block contact");
    setIsContactInfoOpen(false);
  };

  const handleDeleteContact = async () => {
    const contact = getContactFromActiveChat();
    if (!contact) return;

    try {
      await deleteContact(contact.id);
      setIsContactInfoOpen(false);
      console.log("Contact deleted successfully");
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  };

  const getContactFromActiveChat = () => {
    if (!activeChat || !user) return null;
    return activeChat.participants.find((p) => p.id !== user.id) || null;
  };

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/30 backdrop-blur-xs">
        <div className="text-center p-8 max-w-sm">
          <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20 shadow-xs">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2 tracking-tight">
            Welcome to ChitChat
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Select a contact or add a secure email profile to start a conversation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background relative overflow-hidden h-full">
      {/* Header (Top) */}
      <ChatHeader onOpenContactInfo={() => setIsContactInfoOpen(true)} />

      {/* Message List (Middle) */}
      <ChatMessageList activeChat={activeChat} messagesEndRef={messagesEndRef} />

      {/* Input container (Bottom) */}
      <div className="p-4 border-t border-border bg-card/60 backdrop-blur-md shrink-0">
        <MessageInput />
      </div>

      {/* Contact Info Modal */}
      {!activeChat.isGroup && getContactFromActiveChat() && (
        <ContactInfo
          isOpen={isContactInfoOpen}
          onClose={() => setIsContactInfoOpen(false)}
          contact={getContactFromActiveChat()!}
          onCall={handleContactInfoCall}
          onBlock={handleBlockContact}
          onDeleteContact={handleDeleteContact}
        />
      )}
    </div>
  );
}
