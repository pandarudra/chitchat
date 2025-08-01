import { useState } from "react";
import {
  MoreVertical,
  UserX,
  UserCheck,
  Pin,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import type { Chat } from "../../types";

interface ChatOptionsProps {
  chat: Chat;
}

export function ChatOptions({ chat }: ChatOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { blockContact, unblockContact, pinChat, muteChat } = useChat();
  const { user } = useAuth();

  const handleBlockContact = async () => {
    try {
      // For one-on-one chats, get the other participant's ID
      const otherParticipant = chat.participants.find((p) => p.id !== user?.id);
      if (otherParticipant) {
        await blockContact(otherParticipant.id);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to block contact:", error);
    }
  };

  const handleUnblockContact = async () => {
    try {
      // For one-on-one chats, get the other participant's ID
      const otherParticipant = chat.participants.find((p) => p.id !== user?.id);
      if (otherParticipant) {
        await unblockContact(otherParticipant.id);
      }
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to unblock contact:", error);
    }
  };

  const handlePinChat = () => {
    pinChat(chat.id);
    setIsOpen(false);
  };

  const handleMuteChat = () => {
    muteChat(chat.id);
    setIsOpen(false);
  };

  // Get the other participant (for one-on-one chats)
  const otherParticipant = chat.participants.find((p) => p.id !== user?.id);
  const isBlocked = otherParticipant?.isBlocked || chat.isBlocked;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <button
              onClick={handlePinChat}
              className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              <Pin className="h-4 w-4 text-gray-600" />
              <span className="text-sm">
                {chat.isPinned ? "Unpin Chat" : "Pin Chat"}
              </span>
            </button>

            <button
              onClick={handleMuteChat}
              className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors"
            >
              {chat.isMuted ? (
                <Volume2 className="h-4 w-4 text-gray-600" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-sm">
                {chat.isMuted ? "Unmute Chat" : "Mute Chat"}
              </span>
            </button>

            <hr className="my-1" />

            {isBlocked ? (
              <button
                onClick={handleUnblockContact}
                className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-green-50 text-green-600 transition-colors"
              >
                <UserCheck className="h-4 w-4" />
                <span className="text-sm">Unblock Contact</span>
              </button>
            ) : (
              <button
                onClick={handleBlockContact}
                className="flex items-center space-x-3 w-full px-4 py-2 text-left hover:bg-red-50 text-red-600 transition-colors"
              >
                <UserX className="h-4 w-4" />
                <span className="text-sm">Block Contact</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
