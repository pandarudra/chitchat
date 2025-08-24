import { useState } from "react";
import { Settings, LogOut, MessageCircle, Phone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { getAvatarUrl } from "../../utils/constants";
import { SearchInput } from "../ui/SearchInput";
import { ChatList } from "../chat/ChatList";
import { CallHistory } from "../call/CallHistory";
import { Settings as SettingsModal } from "../settings/Settings";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<"chats" | "contacts" | "calls">(
    "chats"
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useChat();

  const tabs = [
    { id: "chats", label: "Chats", icon: MessageCircle },
    { id: "calls", label: "Calls", icon: Phone },
  ];

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-green-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {user?.avatarUrl ? (
              <img
                src={getAvatarUrl(user.avatarUrl)}
                alt={user?.displayName}
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.nextElementSibling?.classList.remove("hidden");
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 rounded-full bg-green-700 flex items-center justify-center text-white font-semibold ${user?.avatarUrl ? "hidden" : ""}`}
            >
              {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="font-semibold">{user?.displayName}</h2>
              <p className="text-sm text-green-100">
                {user?.status || "Available"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 hover:bg-green-600 rounded-full transition-colors"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={logout}
              className="p-2 hover:bg-green-600 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() =>
              setActiveTab(tab.id as "chats" | "contacts" | "calls")
            }
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
              activeTab === tab.id
                ? "bg-green-50 text-[#588157] border-b-2 border-green-500"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${activeTab}...`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "calls" ? <CallHistory /> : <ChatList />}
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
