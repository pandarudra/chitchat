import { useState } from "react";
import { Settings, LogOut, MessageCircle, Phone, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { getAvatarUrl } from "../../utils/constants";
import { SearchInput } from "../ui/SearchInput";
import { ChatList } from "../chat/ChatList";
import { CallHistory } from "../call/CallHistory";
import { Settings as SettingsModal } from "../settings/Settings";
import { ThemeToggle } from "../ui/ThemeToggle";
import { AddContact } from "../chat/AddContact";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<"chats" | "calls">("chats");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useChat();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-full sm:w-[360px] h-full bg-background flex flex-row border-r border-border shrink-0 transition-all duration-300 z-10 shadow-xs relative overflow-hidden">
      
      {/* 1. DESKTOP LEFT RAIL - Hidden on mobile, visible on desktop */}
      <div className="hidden sm:flex flex-col w-16 h-full border-r border-border bg-muted/15 items-center justify-between py-5 shrink-0">
        
        {/* Top Part */}
        <div className="flex flex-col items-center space-y-5 w-full">
          {/* User Profile Avatar */}
          <div className="relative cursor-pointer hover:opacity-90 active:scale-95 transition-all">
            {user?.avatarUrl ? (
              <img
                src={getAvatarUrl(user.avatarUrl)}
                alt={user?.displayName}
                className="w-10 h-10 rounded-xl object-cover shadow-xs border border-border bg-card"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-base shadow-xs ${user?.avatarUrl ? "hidden" : ""}`}
            >
              {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            {/* Online badge indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></div>
          </div>

          <div className="h-[1px] w-8 bg-border"></div>

          {/* Navigation Rails */}
          <button
            onClick={() => setActiveTab("chats")}
            className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === "chats"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Chats"
          >
            <MessageCircle className="h-5 w-5" />
          </button>

          <button
            onClick={() => setActiveTab("calls")}
            className={`p-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === "calls"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
            title="Calls"
          >
            <Phone className="h-5 w-5" />
          </button>

          <button
            onClick={() => setIsAddContactOpen(true)}
            className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 cursor-pointer"
            title="Add Contact"
          >
            <UserPlus className="h-5 w-5" />
          </button>
        </div>

        {/* Bottom Part */}
        <div className="flex flex-col items-center space-y-4 w-full">
          <ThemeToggle />

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors cursor-pointer"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* 2. CHAT/CALL LIST PANE - Takes remaining space */}
      <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
        
        {/* DESKTOP HEADER PANE */}
        <div className="hidden sm:flex flex-col px-5 pt-5 pb-3 bg-background">
          <h1 className="text-2xl font-black text-foreground tracking-tight uppercase mb-1">
            {activeTab === "chats" ? "Chats" : "Calls"}
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Logged in as <span className="text-foreground font-semibold">{user?.displayName}</span>
          </p>
        </div>

        {/* MOBILE HEADER - Visible on mobile, hidden on desktop */}
        <div className="sm:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="relative shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={getAvatarUrl(user.avatarUrl)}
                  alt={user?.displayName}
                  className="w-9 h-9 rounded-xl object-cover shadow-xs border border-border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    target.nextElementSibling?.classList.remove("hidden");
                  }}
                />
              ) : null}
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-xs ${user?.avatarUrl ? "hidden" : ""}`}
              >
                {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border border-background rounded-full"></div>
            </div>
            
            <h1 className="text-lg font-bold text-foreground truncate tracking-tight">
              {activeTab === "chats" ? "Chats" : "Calls"}
            </h1>
          </div>

          {/* Unified Action Items Row on Mobile */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsAddContactOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              title="Add Contact"
            >
              <UserPlus className="h-4.5 w-4.5" />
            </button>
            <ThemeToggle />
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
              title="Settings"
            >
              <Settings className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted transition-colors cursor-pointer"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* MOBILE ONLY TAB SELECTOR BAR */}
        <div className="sm:hidden flex p-2 gap-1 border-b border-border bg-muted/20">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === "chats"
                ? "bg-background text-foreground shadow-xs font-semibold border border-border"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <MessageCircle className="h-4 w-4" />
            <span className="text-xs">Chats</span>
          </button>
          <button
            onClick={() => setActiveTab("calls")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-xl transition-all duration-200 cursor-pointer ${
              activeTab === "calls"
                ? "bg-background text-foreground shadow-xs font-semibold border border-border"
                : "text-muted-foreground hover:text-foreground font-medium"
            }`}
          >
            <Phone className="h-4 w-4" />
            <span className="text-xs">Calls</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border bg-background">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            className="bg-muted border-transparent focus:bg-background focus:border-primary-500 rounded-xl"
          />
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-hidden bg-background">
          {activeTab === "calls" ? <CallHistory /> : <ChatList />}
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Add Contact Modal */}
      <AddContact
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
      />
    </div>
  );
}
