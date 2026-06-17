import { useState, useRef, useEffect } from "react";
import {
  Settings,
  LogOut,
  MessageCircle,
  Phone,
  UserPlus,
  Bell,
  MoreVertical,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { Avatar } from "../ui/Avatar";
import { SearchInput } from "../ui/SearchInput";
import { ChatList } from "../chat/ChatList";
import { CallHistory } from "../call/CallHistory";
import { Settings as SettingsModal } from "../settings/Settings";
import { Notifications } from "../settings/Notifications";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AddContact } from "../chat/AddContact";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<"chats" | "calls">("chats");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useChat();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-full sm:w-[360px] h-full bg-canvas flex flex-row border-r border-hairline shrink-0 transition-all duration-300 z-10 shadow-xs relative overflow-hidden">
      {/* 1. DESKTOP LEFT RAIL - Hidden on mobile, visible on desktop */}
      <div className="hidden sm:flex flex-col w-16 h-full border-r border-hairline bg-surface-soft/40 items-center justify-between py-5 shrink-0">
        {/* Top Part */}
        <div className="flex flex-col items-center space-y-5 w-full">
          {/* User Profile Avatar */}
          <Avatar
            user={user}
            size="md"
            showOnlineBadge
            className="cursor-pointer hover:opacity-90 active:scale-95 transition-all"
          />

          <div className="h-[1px] w-8 bg-hairline"></div>

          {/* Navigation Rails */}
          <button
            onClick={() => setActiveTab("chats")}
            className={`p-2.5 rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === "chats"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-muted hover:text-ink hover:bg-surface-soft"
            }`}
            title="Chats"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab("calls")}
            className={`p-2.5 rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === "calls"
                ? "bg-primary text-on-primary shadow-sm"
                : "text-muted hover:text-ink hover:bg-surface-soft"
            }`}
            title="Calls"
          >
            <Phone className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsAddContactOpen(true)}
            className="p-2.5 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-all duration-200 cursor-pointer"
            title="Add Contact"
          >
            <UserPlus className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="p-2.5 rounded-md text-muted hover:text-ink hover:bg-surface-soft transition-all duration-200 cursor-pointer"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Part */}
        <div className="flex flex-col items-center space-y-4 w-full">
          <ThemeToggle />

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-muted hover:text-ink hover:bg-surface-soft rounded-md transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. CHAT/CALL LIST PANE - Takes remaining space */}
      <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
        {/* DESKTOP HEADER PANE */}
        <div className="hidden sm:flex flex-col px-5 pt-5 pb-3 bg-canvas">
          <h1 className="text-title-lg font-sans font-500 text-ink tracking-tight mb-1">
            {activeTab === "chats" ? "Chats" : "Calls"}
          </h1>
          <p className="text-caption text-muted">

            <span className="text-foreground font-semibold">
              {user?.displayName}
            </span>
          </p>
        </div>

        {/* MOBILE HEADER - Visible on mobile, hidden on desktop */}
        <div className="sm:hidden flex items-center justify-between p-4 border-b border-hairline bg-surface-card">
          <div className="flex items-center space-x-3 overflow-hidden">
            <Avatar user={user} size="sm" showOnlineBadge />

            <h1 className="text-title-lg font-sans font-bold text-ink truncate tracking-tight">
              {activeTab === "chats" ? "Chats" : "Calls"}
            </h1>
          </div>

          {/* Unified Action Items Row on Mobile */}
          <div className="flex items-center space-x-1" ref={mobileMenuRef}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-muted hover:text-ink hover:bg-surface-soft rounded-md transition-colors cursor-pointer"
              title="Menu"
            >
              <MoreVertical className="h-5 w-5" />
            </button>

            {isMobileMenuOpen && (
              <div className="absolute top-16 right-4 w-56 bg-surface-card border border-hairline rounded-lg shadow-lg z-50 py-2 flex flex-col animate-in fade-in zoom-in-95">
                <button
                  onClick={() => { setIsAddContactOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-surface-soft text-ink transition-colors cursor-pointer"
                >
                  <UserPlus className="h-5 w-5 text-muted" />
                  <span className="text-sm font-medium">Add Contact</span>
                </button>
                <button
                  onClick={() => { setIsNotificationsOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-surface-soft text-ink transition-colors cursor-pointer"
                >
                  <Bell className="h-5 w-5 text-muted" />
                  <span className="text-sm font-medium">Notifications</span>
                </button>
                <button
                  onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-surface-soft text-ink transition-colors cursor-pointer"
                >
                  <Settings className="h-5 w-5 text-muted" />
                  <span className="text-sm font-medium">Settings</span>
                </button>
                <div className="px-4 py-3 flex items-center justify-between hover:bg-surface-soft transition-colors">
                  <span className="text-sm font-medium text-ink">Theme</span>
                  <ThemeToggle />
                </div>
                <div className="h-[1px] w-full bg-hairline my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-error/10 text-error transition-colors cursor-pointer"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MOBILE ONLY TAB SELECTOR BAR */}
        <div className="sm:hidden flex p-2 gap-1 border-b border-hairline bg-surface-soft/40">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === "chats"
                ? "bg-canvas text-ink shadow-xs font-semibold border border-hairline"
                : "text-muted hover:text-ink font-medium"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Chats</span>
          </button>
          <button
            onClick={() => setActiveTab("calls")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 cursor-pointer ${
              activeTab === "calls"
                ? "bg-canvas text-ink shadow-xs font-semibold border border-hairline"
                : "text-muted hover:text-ink font-medium"
            }`}
          >
            <Phone className="h-4 w-4" />
            <span className="text-xs">Calls</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-hairline bg-canvas">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            className="bg-surface-soft border-transparent focus:bg-canvas focus:border-primary rounded-md"
          />
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-hidden bg-canvas">
          {activeTab === "calls" ? <CallHistory /> : <ChatList />}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
      />

      <Notifications
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Add Contact Modal */}
      <AddContact
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
      />
    </div>
  );
}
