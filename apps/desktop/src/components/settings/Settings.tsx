import React, { useState, useCallback } from "react";
import {
  X,
  User,
  Edit3,
  Settings as SettingsIcon,
  Bell,
  Lock,
  Palette,
  Info,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl } from "../../utils/constants";
import { EditProfile } from "../profile/EditProfile";

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Settings({ isOpen, onClose }: SettingsProps) {
  const { user } = useAuth();
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle ESC key to close modal
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-transparent bg-opacity-50 flex items-center justify-center p-4 z-40"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            handleClose();
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-gray-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img
                    src={getAvatarUrl(user.avatarUrl)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      target.parentElement
                        ?.querySelector(".fallback-avatar")
                        ?.classList.remove("hidden");
                    }}
                  />
                ) : null}
                <div
                  className={`fallback-avatar w-full h-full flex items-center justify-center ${user?.avatarUrl ? "hidden" : ""}`}
                >
                  <User className="h-8 w-8 text-gray-400" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {user?.displayName}
                </h3>
                <p className="text-sm text-gray-500">{user?.phoneNumber}</p>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {user?.status || "Hey there! I am using ChitChat."}
                </p>
              </div>
            </div>
          </div>

          {/* Settings Options */}
          <div className="p-6">
            <div className="space-y-2">
              {/* Edit Profile */}
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit3 className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Edit Profile
                  </span>
                  <p className="text-xs text-gray-500">
                    Update your name, photo and status
                  </p>
                </div>
              </button>

              {/* Notifications */}
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Notifications
                  </span>
                  <p className="text-xs text-gray-500">
                    Message, group & call tones
                  </p>
                </div>
              </button>

              {/* Privacy */}
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Lock className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Privacy
                  </span>
                  <p className="text-xs text-gray-500">
                    Last seen, profile photo, about
                  </p>
                </div>
              </button>

              {/* Theme */}
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Palette className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    Theme
                  </span>
                  <p className="text-xs text-gray-500">
                    Light, dark, wallpapers
                  </p>
                </div>
              </button>

              {/* About */}
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors">
                <Info className="h-5 w-5 text-gray-600" />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    About
                  </span>
                  <p className="text-xs text-gray-500">
                    Version, help & support
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfile
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </>
  );
}
