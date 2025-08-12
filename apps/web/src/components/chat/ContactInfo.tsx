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

  const formatPhoneNumber = (phone: string) => {
    // Format phone number for display (e.g., +1 234 567 8900)
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

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
    <div className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Contact Info</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Contact Details */}
        <div className="p-6">
          {/* Avatar and Name */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative mb-4">
              <img
                src={contact.avatarUrl || "/api/placeholder/120/120"}
                alt={contact.displayName}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <div
                className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${
                  isOnline ? "bg-green-500" : "bg-gray-400"
                }`}
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {contact.displayName}
            </h3>
            <p className="text-sm text-gray-500">{statusText}</p>
            {contact.status && (
              <p className="text-sm text-gray-600 mt-2 text-center italic">
                "{contact.status}"
              </p>
            )}
          </div>

          {/* Contact Information */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Phone Number
              </label>
              <p className="text-gray-900">
                {formatPhoneNumber(contact.phoneNumber)}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Status
              </label>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    isOnline ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                <p className="text-gray-900">
                  {isOnline
                    ? "Online"
                    : `Last seen ${formatLastSeen(contact.lastSeen)}`}
                </p>
              </div>
            </div>

            {contact.createdAt && (
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">
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
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span>Call</span>
              </button>
              <button
                onClick={() => onCall?.("video")}
                className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Video</span>
              </button>
            </div>

            {/* Additional Actions */}
            <div className="pt-4 border-t border-gray-200 space-y-2">
              <button
                onClick={onBlock}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <ShieldOff className="h-4 w-4" />
                <span>Block Contact</span>
              </button>
              <button
                onClick={handleDeleteClick}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-gray-800/5 bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-sm mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Contact
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {contact.displayName} from your
              contacts? This action cannot be undone and will also remove your
              chat history.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
