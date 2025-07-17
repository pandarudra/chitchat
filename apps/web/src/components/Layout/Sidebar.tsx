import { useState } from "react";
import { Settings, LogOut, MessageCircle, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import { SearchInput } from "../ui/SearchInput";
import { ChatList } from "../chat/ChatList";

export function Sidebar() {
  const [activeTab, setActiveTab] = useState<"chats" | "contacts">("chats");
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery } = useChat();

  const tabs = [{ id: "chats", label: "Chats", icon: MessageCircle }];

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-green-500 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={user?.avatarUrl}
              alt={user?.displayName}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <h2 className="font-semibold">{user?.name}</h2>
              <p className="text-sm text-green-100">
                {user?.status || "Available"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-green-600 rounded-full transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <button
              onClick={logout}
              className="p-2 hover:bg-green-600 rounded-full transition-colors"
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
            onClick={() => setActiveTab(tab.id as "chats" | "contacts")}
            className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 transition-colors ${
              activeTab === tab.id
                ? "bg-green-50 text-green-600 border-b-2 border-green-500"
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
        <ChatList />
      </div>
    </div>
  );
}
