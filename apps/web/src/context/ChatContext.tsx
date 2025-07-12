import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import type { ChatState, Chat, Message, User, ContactRequest } from "../types";
import { useAuth } from "./AuthContext";

interface ChatContextType extends ChatState {
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: Message["type"]) => void;
  markAsRead: (chatId: string) => void;
  addContact: (user: User) => void;
  setSearchQuery: (query: string) => void;
  createGroupChat: (name: string, participants: User[]) => void;
  addUserToGroup: (chatId: string, user: User) => void;
  removeUserFromGroup: (chatId: string, userId: string) => void;
  pinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  sendContactRequest: (userId: string) => void;
  acceptContactRequest: (requestId: string) => void;
  rejectContactRequest: (requestId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: "SET_ACTIVE_CHAT"; payload: Chat | null }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SEND_MESSAGE"; payload: Message }
  | { type: "RECEIVE_MESSAGE"; payload: Message }
  | {
      type: "UPDATE_MESSAGE_STATUS";
      payload: { messageId: string; status: Message["status"] };
    }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "ADD_CONTACT"; payload: User }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "CREATE_GROUP_CHAT"; payload: Chat }
  | { type: "ADD_USER_TO_GROUP"; payload: { chatId: string; user: User } }
  | {
      type: "REMOVE_USER_FROM_GROUP";
      payload: { chatId: string; userId: string };
    }
  | { type: "PIN_CHAT"; payload: string }
  | { type: "MUTE_CHAT"; payload: string }
  | { type: "SEND_CONTACT_REQUEST"; payload: ContactRequest }
  | { type: "ACCEPT_CONTACT_REQUEST"; payload: string }
  | { type: "REJECT_CONTACT_REQUEST"; payload: string }
  | { type: "SET_TYPING"; payload: { chatId: string; users: User[] } }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChat: action.payload };

    case "SET_CHATS":
      return { ...state, chats: action.payload };

    case "SEND_MESSAGE":
    case "RECEIVE_MESSAGE": {
      const message = action.payload;
      const chatIndex = state.chats.findIndex(
        (chat) =>
          chat.id === message.receiverId ||
          chat.participants.some(
            (p) => p.id === message.senderId || p.id === message.receiverId
          )
      );

      if (chatIndex !== -1) {
        const updatedChats = [...state.chats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          messages: [...updatedChats[chatIndex].messages, message],
          lastMessage: message,
          unreadCount:
            action.type === "RECEIVE_MESSAGE" &&
            state.activeChat?.id !== updatedChats[chatIndex].id
              ? updatedChats[chatIndex].unreadCount + 1
              : updatedChats[chatIndex].unreadCount,
        };

        return { ...state, chats: updatedChats };
      }
      return state;
    }

    case "UPDATE_MESSAGE_STATUS": {
      const updatedChats = state.chats.map((chat) => ({
        ...chat,
        messages: chat.messages.map((msg) =>
          msg.id === action.payload.messageId
            ? { ...msg, status: action.payload.status }
            : msg
        ),
      }));
      return { ...state, chats: updatedChats };
    }

    case "MARK_AS_READ": {
      const chatIndex = state.chats.findIndex(
        (chat) => chat.id === action.payload
      );
      if (chatIndex !== -1) {
        const updatedChats = [...state.chats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          unreadCount: 0,
        };
        return { ...state, chats: updatedChats };
      }
      return state;
    }

    case "ADD_CONTACT":
      return {
        ...state,
        contacts: [...state.contacts, action.payload],
      };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };

    case "CREATE_GROUP_CHAT":
      return {
        ...state,
        chats: [action.payload, ...state.chats],
      };

    case "PIN_CHAT": {
      const chatIndex = state.chats.findIndex(
        (chat) => chat.id === action.payload
      );
      if (chatIndex !== -1) {
        const updatedChats = [...state.chats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          isPinned: !updatedChats[chatIndex].isPinned,
        };
        return { ...state, chats: updatedChats };
      }
      return state;
    }

    case "MUTE_CHAT": {
      const chatIndex = state.chats.findIndex(
        (chat) => chat.id === action.payload
      );
      if (chatIndex !== -1) {
        const updatedChats = [...state.chats];
        updatedChats[chatIndex] = {
          ...updatedChats[chatIndex],
          isMuted: !updatedChats[chatIndex].isMuted,
        };
        return { ...state, chats: updatedChats };
      }
      return state;
    }

    case "SET_TYPING":
      return {
        ...state,
        isTyping: {
          ...state.isTyping,
          [action.payload.chatId]: action.payload.users,
        },
      };

    case "SEND_CONTACT_REQUEST":
      return {
        ...state,
        contactRequests: [...state.contactRequests, action.payload],
      };

    case "ACCEPT_CONTACT_REQUEST": {
      const request = state.contactRequests.find(
        (req) => req.id === action.payload
      );
      if (request) {
        return {
          ...state,
          contactRequests: state.contactRequests.filter(
            (req) => req.id !== action.payload
          ),
          contacts: [...state.contacts, request.senderInfo],
        };
      }
      return state;
    }

    case "REJECT_CONTACT_REQUEST":
      return {
        ...state,
        contactRequests: state.contactRequests.filter(
          (req) => req.id !== action.payload
        ),
      };

    default:
      return state;
  }
};

const init: ChatState = {
  chats: [],
  activeChat: null,
  contacts: [],
  contactRequests: [],
  isTyping: {},
  searchQuery: "",
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, init);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Socket.IO connection
  useEffect(() => {
    if (isAuthenticated && user) {
      const be_url = import.meta.env.VITE_BE_URL;
      socketRef.current = io(be_url, {
        withCredentials: true,
        transports: ["websocket"],
      });

      const socket = socketRef.current;

      // Connection events
      socket.on("connect", () => {
        console.log("Connected to server");
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        console.log("Disconnected from server");
        setIsConnected(false);
      });

      // Message events
      socket.on("one_to_one_message", (data) => {
        const message: Message = {
          id: Date.now().toString(),
          senderId: data.from,
          receiverId: user.id,
          content: data.message,
          timestamp: new Date(data.timestamp),
          type: "text",
          status: "delivered",
        };
        dispatch({ type: "RECEIVE_MESSAGE", payload: message });
      });

      // Seen message event
      socket.on("seen_message", (data) => {
        // Update message statuses to 'read'
        state.chats.forEach((chat) => {
          chat.messages.forEach((msg) => {
            if (
              msg.senderId === user.id &&
              msg.receiverId === data.from &&
              msg.status !== "read"
            ) {
              dispatch({
                type: "UPDATE_MESSAGE_STATUS",
                payload: { messageId: msg.id, status: "read" },
              });
            }
          });
        });
      });

      // Typing events
      socket.on("user_typing", (data) => {
        dispatch({
          type: "SET_TYPING",
          payload: { chatId: data.chatId, users: [data.user] },
        });
      });

      socket.on("user_stopped_typing", (data) => {
        dispatch({
          type: "SET_TYPING",
          payload: { chatId: data.chatId, users: [] },
        });
      });

      return () => {
        socket.disconnect();
        setIsConnected(false);
      };
    }
  }, [isAuthenticated, user, state.chats]);

  // Fetch chats from backend
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchChats();
    }
  }, [isAuthenticated, user]);

  const fetchChats = async () => {
    try {
      // TODO: Implement actual API call to fetch chats
      // const response = await api.get('/api/chats');
      // dispatch({ type: "SET_CHATS", payload: response.data.chats });

      // For now, using mock data
      dispatch({ type: "SET_CHATS", payload: [] });
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  };

  const setActiveChat = (chat: Chat | null) => {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: chat });
    if (chat) {
      dispatch({ type: "MARK_AS_READ", payload: chat.id });
    }
  };

  const sendMessage = (content: string, type: Message["type"] = "text") => {
    if (!state.activeChat || !user || !socketRef.current) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: user.id,
      receiverId: state.activeChat.id,
      content,
      timestamp: new Date(),
      type,
      status: "sent",
    };

    // Add message to local state immediately
    dispatch({ type: "SEND_MESSAGE", payload: message });

    // Send via socket
    const recipientPhone = state.activeChat.participants.find(
      (p) => p.id !== user.id
    )?.phoneNumber;
    if (recipientPhone) {
      socketRef.current.emit("one_to_one_message", {
        to: recipientPhone,
        message: content,
        timestamp: message.timestamp.toISOString(),
      });

      // Update status to delivered after a delay
      setTimeout(() => {
        dispatch({
          type: "UPDATE_MESSAGE_STATUS",
          payload: { messageId: message.id, status: "delivered" },
        });
      }, 1000);
    }
  };

  const markAsRead = (chatId: string) => {
    dispatch({ type: "MARK_AS_READ", payload: chatId });

    // Emit seen message event
    if (socketRef.current && user) {
      const chat = state.chats.find((c) => c.id === chatId);
      const recipient = chat?.participants.find((p) => p.id !== user.id);
      if (recipient) {
        socketRef.current.emit("seen_message", {
          from: user.phoneNumber,
          to: recipient.phoneNumber,
        });
      }
    }
  };

  const startTyping = (chatId: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit("typing", {
        chatId,
        user: { id: user.id, displayName: user.displayName },
      });
    }
  };

  const stopTyping = (chatId: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit("stop_typing", {
        chatId,
        user: { id: user.id, displayName: user.displayName },
      });
    }
  };

  const addContact = (user: User) => {
    dispatch({ type: "ADD_CONTACT", payload: user });
  };

  const setSearchQuery = (query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  };

  const createGroupChat = (name: string, participants: User[]) => {
    const newChat: Chat = {
      id: Date.now().toString(),
      participants,
      messages: [],
      isGroup: true,
      groupName: name,
      groupAdmin: user?.id,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
    };
    dispatch({ type: "CREATE_GROUP_CHAT", payload: newChat });
  };

  const addUserToGroup = (chatId: string, user: User) => {
    dispatch({ type: "ADD_USER_TO_GROUP", payload: { chatId, user } });
  };

  const removeUserFromGroup = (chatId: string, userId: string) => {
    dispatch({ type: "REMOVE_USER_FROM_GROUP", payload: { chatId, userId } });
  };

  const pinChat = (chatId: string) => {
    dispatch({ type: "PIN_CHAT", payload: chatId });
  };

  const muteChat = (chatId: string) => {
    dispatch({ type: "MUTE_CHAT", payload: chatId });
  };

  const sendContactRequest = (userId: string) => {
    // TODO: Implement actual API call
    console.log("Sending contact request to:", userId);
  };

  const acceptContactRequest = (requestId: string) => {
    dispatch({ type: "ACCEPT_CONTACT_REQUEST", payload: requestId });
  };

  const rejectContactRequest = (requestId: string) => {
    dispatch({ type: "REJECT_CONTACT_REQUEST", payload: requestId });
  };

  return (
    <ChatContext.Provider
      value={{
        ...state,
        setActiveChat,
        sendMessage,
        markAsRead,
        addContact,
        setSearchQuery,
        createGroupChat,
        addUserToGroup,
        removeUserFromGroup,
        pinChat,
        muteChat,
        sendContactRequest,
        acceptContactRequest,
        rejectContactRequest,
        startTyping,
        stopTyping,
        isConnected,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
