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
  onOpenNotifications?: () => void;
}

export function Settings({
  isOpen,
  onClose,
  onOpenNotifications,
}: SettingsProps) {
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
        <div className="bg-card text-card-foreground rounded-3xl shadow-2xl border border-border w-full max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card/95 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/15">
                <SettingsIcon className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Settings
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Section */}
          <div className="p-6 border-b border-border bg-muted/10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex items-center justify-center border border-border shadow-sm">
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
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-foreground">
                  {user?.displayName}
                </h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
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
                className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-muted rounded-2xl transition-colors"
              >
                <Edit3 className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Edit Profile
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Update your name, photo and status
                  </p>
                </div>
              </button>

              {/* Notifications */}
              <button
                onClick={onOpenNotifications}
                className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-muted rounded-2xl transition-colors"
              >
                <Bell className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Notifications
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Message, group & call tones
                  </p>
                </div>
              </button>

              {/* Privacy */}
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-muted rounded-2xl transition-colors">
                <Lock className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Privacy
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Last seen, profile photo, about
                  </p>
                </div>
              </button>

              {/* Theme */}
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-muted rounded-2xl transition-colors">
                <Palette className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Theme
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Light, dark, wallpapers
                  </p>
                </div>
              </button>

              {/* About */}
              <button className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-muted rounded-2xl transition-colors">
                <Info className="h-5 w-5 text-primary" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    About
                  </span>
                  <p className="text-xs text-muted-foreground">
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
