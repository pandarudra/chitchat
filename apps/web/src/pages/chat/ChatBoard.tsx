import { ChatWindow } from "../../components/chat/ChatWindow";
import { Sidebar } from "../../components/Layout/Sidebar";
import { useChat } from "../../context/ChatContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import CallNotification from "../../components/call/CallNotification";
import CallModal from "../../components/call/CallModal";

export function ChatBoard() {
  const isMobile = useMediaQuery("(max-width: 1030px)");
  const { activeChat } = useChat();

  if (isMobile) {
    return (
      <div className="h-screen bg-background relative overflow-hidden flex flex-col">
        <div className="flex-1 overflow-hidden flex relative">
          {activeChat ? <ChatWindow /> : <Sidebar />}
        </div>
        {/* Global Call Notification & Modals */}
        <CallNotification />
        <CallModal />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex relative overflow-hidden">
      <Sidebar />
      <ChatWindow />
      
      {/* Global Call Notification & Modals */}
      <CallNotification />
      <CallModal />
    </div>
  );
}
