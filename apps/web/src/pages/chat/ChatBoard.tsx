import { use, useEffect, useState } from "react";
import { ChatWindow } from "../../components/chat/ChatWindow";
import { Sidebar } from "../../components/Layout/Sidebar";
import { AddContact } from "../../components/chat/AddContact";
import { FloatingActionButton } from "../../components/ui/FloatingActionButton";
import { useChat } from "../../context/ChatContext";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { UserPlus } from "lucide-react";

export function ChatBoard() {
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 1030px)");
  const { activeChat } = useChat();
  const [showbtn, setShowbtn] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeChat) {
        setShowbtn(false);
      } else {
        setShowbtn(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeChat, showbtn]);

  if (isMobile) {
    return (
      <div className="h-screen bg-gray-100 relative">
        {activeChat ? <ChatWindow /> : <Sidebar />}
        {showbtn && (
          <>
            <FloatingActionButton
              onClick={() => setIsAddContactOpen(true)}
              icon={<UserPlus className="h-6 w-6" />}
              title="Add Contact"
            />
            <AddContact
              isOpen={isAddContactOpen}
              onClose={() => setIsAddContactOpen(false)}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex relative">
      <Sidebar />
      <ChatWindow />
      <FloatingActionButton
        onClick={() => setIsAddContactOpen(true)}
        icon={<UserPlus className="h-6 w-6" />}
        title="Add Contact"
        position={activeChat ? "bottom-left" : "bottom-right"}
      />
      <AddContact
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
      />
    </div>
  );
}
