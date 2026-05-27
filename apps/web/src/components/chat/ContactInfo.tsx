import { X, Phone, MessageSquare, UserMinus, ShieldOff } from "lucide-react";
import { useState } from "react";
import type { User } from "../../types";
import { isUserOnline, getUserOnlineStatusText } from "../../utils/userUtils";

interface ContactInfoProps {
  isOpen: boolean;
  onClose: () => void;
  contact: User;
  onCall?: (type: "audio" | "video") => void;
  onBlock?: () => void;
  onDeleteContact?: () => void;
}

export function ContactInfo({
  isOpen,
  onClose,
  contact,
  onCall,
  onBlock,
  onDeleteContact,
}: ContactInfoProps) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  if (!isOpen) return null;

  const isOnline = isUserOnline(contact);
  const statusText = getUserOnlineStatusText(contact);

  const formatLastSeen = (lastSeen?: Date) => {
    if (!lastSeen) return "Unknown";

    const now = new Date();
    const diffMs = now.getTime() - new Date(lastSeen).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return new Date(lastSeen).toLocaleDateString();
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirmation(true);
  };

  const handleConfirmDelete = () => {
    onDeleteContact?.();
    setShowDeleteConfirmation(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm">
      <div className="bg-card text-card-foreground rounded-3xl shadow-2xl border border-border w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card/95 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-foreground">
            Contact Info
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contact Details */}
        <div className="p-6 bg-gradient-to-b from-primary/5 to-transparent">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <img
                src={contact.avatarUrl || "/api/placeholder/120/120"}
                alt={contact.displayName}
                className="w-24 h-24 rounded-3xl object-cover border border-border shadow-lg"
              />
              <div
                className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-card ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-1">
              {contact.displayName}
            </h3>
            <p className="text-sm text-muted-foreground">{statusText}</p>
            {contact.status && (
              <p className="text-sm text-muted-foreground mt-2 text-center italic">
                "{contact.status}"
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Email Address
              </label>
              <p className="text-foreground">{contact.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Status
              </label>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <p className="text-foreground">
                  {isOnline
                    ? "Online"
                    : `Last seen ${formatLastSeen(contact.lastSeen)}`}
                </p>
              </div>
            </div>

            {contact.createdAt && (
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                  Member Since
                </label>
                <p className="text-foreground">
                  {new Date(contact.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Call Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onCall?.("audio")}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-2xl hover:bg-primary/90 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </button>
              <button
                onClick={() => onCall?.("video")}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-foreground text-background rounded-2xl hover:bg-foreground/90 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Video</span>
              </button>
            </div>

            {/* Additional Actions */}
            <div className="pt-4 border-t border-border space-y-2">
              <button
                onClick={onBlock}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
              >
                <ShieldOff className="h-4 w-4" />
                <span>Block Contact</span>
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-2xl transition-colors"
              >
                <UserMinus className="h-4 w-4" />
                <span>Delete Contact</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card text-card-foreground rounded-3xl shadow-2xl border border-border max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Delete Contact
            </h3>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete {contact.displayName} from your
              contacts? This action cannot be undone and will also remove your
              chat history.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 text-muted-foreground border border-border rounded-2xl hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
