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
import type { Chat } from "../../types";

interface ChatOptionsProps {
  chat: Chat;
}

export function ChatOptions({ chat }: ChatOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { blockContact, unblockContact, pinChat, muteChat } = useChat();

  const handleBlockContact = async () => {
    try {
      await blockContact(chat.id);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to block contact:", error);
    }
  };

  const handleUnblockContact = async () => {
    try {
      await unblockContact(chat.id);
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

  const otherParticipant = chat.participants.find((p) => p.id === chat.id);
  const isBlocked = otherParticipant?.isBlocked || chat.isBlocked;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <MoreVertical className="h-5 w-5 text-gray-600" />
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
