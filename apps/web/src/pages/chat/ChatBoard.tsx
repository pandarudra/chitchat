import { ChatWindow } from "../../components/chat/ChatWindow";
import { Sidebar } from "../../components/Layout/Sidebar";
import { useChat } from "../../context/ChatContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";

export function ChatBoard() {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { activeChat } = useChat();

  if (isMobile) {
    return (
      <div className="h-screen bg-gray-100">
        {activeChat ? <ChatWindow /> : <Sidebar />}
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex">
      <Sidebar />
      <ChatWindow />
    </div>
  );
}
