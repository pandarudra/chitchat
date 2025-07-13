import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useRef,
  useState,
  useCallback,
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

const initialState: ChatState = {
  chats: [],
  activeChat: null,
  contacts: [],
  contactRequests: [],
  isTyping: {},
  searchQuery: "",
};

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to store latest state values for socket handlers
  const stateRef = useRef(state);
  const userRef = useRef(user);

  // Update refs when state or user changes
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Memoized socket event handlers to prevent recreation
  const handleSeenMessage = useCallback((data: any) => {
    console.log("👁️ Message seen event:", data);
    const currentState = stateRef.current;
    const currentUser = userRef.current;

    if (!currentUser) return;

    // Update message statuses to 'read'
    currentState.chats.forEach((chat) => {
      chat.messages.forEach((msg) => {
        if (
          msg.senderId === currentUser.id &&
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
  }, []);

  const handleReceiveMessage = useCallback((data: any) => {
    console.log("📨 Received message:", data);
    const currentUser = userRef.current;

    if (!currentUser) return;

    const message: Message = {
      id: Date.now().toString(),
      senderId: data.from,
      receiverId: currentUser.id,
      content: data.message,
      timestamp: new Date(data.timestamp),
      type: "text",
      status: "delivered",
    };
    dispatch({ type: "RECEIVE_MESSAGE", payload: message });
  }, []);

  const handleUserTyping = useCallback((data: any) => {
    dispatch({
      type: "SET_TYPING",
      payload: { chatId: data.chatId, users: [data.user] },
    });
  }, []);

  const handleUserStoppedTyping = useCallback((data: any) => {
    dispatch({
      type: "SET_TYPING",
      payload: { chatId: data.chatId, users: [] },
    });
  }, []);

  // Socket.IO connection effect - only depends on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Connecting to socket.io...", user.id);
      const be_url = import.meta.env.VITE_BE_URL;

      // Clean up existing connection
      if (socketRef.current) {
        socketRef.current.disconnect();
      }

      socketRef.current = io(be_url, {
        withCredentials: true,
        transports: ["websocket", "polling"],
        timeout: 20000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      const socket = socketRef.current;

      // Connection events
      socket.on("connect", () => {
        console.log("✅ Socket connected successfully with ID:", socket.id);
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on("connect_error", (error) => {
        console.error("❌ Socket connection error:", error.message);
        setIsConnected(false);
        setConnectionError(`Connection failed: ${error.message}`);

        // Retry connection after delay
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("Retrying socket connection...");
          socket.connect();
        }, 3000);
      });

      socket.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
        setIsConnected(false);
        if (reason === "io server disconnect") {
          socket.connect();
        }
      });

      socket.on("reconnect", (attemptNumber) => {
        console.log("🔄 Socket reconnected after", attemptNumber, "attempts");
        setIsConnected(true);
        setConnectionError(null);
      });

      socket.on("reconnect_error", (error) => {
        console.error("❌ Socket reconnection error:", error);
        setConnectionError(`Reconnection failed: ${error.message}`);
      });

      // Authentication confirmation
      socket.on("connected", (data) => {
        console.log("🔐 Socket authenticated with data:", data);
      });

      // Attach memoized event handlers
      socket.on("one_to_one_message", handleReceiveMessage);
      socket.on("seen_message", handleSeenMessage);
      socket.on("user_typing", handleUserTyping);
      socket.on("user_stopped_typing", handleUserStoppedTyping);

      // Cleanup function
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        if (socket) {
          console.log("🧹 Cleaning up socket connection");
          socket.disconnect();
        }
        setIsConnected(false);
      };
    } else {
      // User not authenticated, disconnect socket
      if (socketRef.current) {
        console.log("🔒 User not authenticated, disconnecting socket");
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    }
  }, [
    isAuthenticated,
    user?.id,
    handleReceiveMessage,
    handleSeenMessage,
    handleUserTyping,
    handleUserStoppedTyping,
  ]); // Only include stable dependencies

  // Separate effect for fetching chats
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchChats();
    }
  }, [isAuthenticated, user?.id]); // Only depend on user ID, not the whole user object

  const fetchChats = useCallback(async () => {
    try {
      // TODO: Implement actual API call to fetch chats
      // const response = await api.get('/api/chats');
      // dispatch({ type: "SET_CHATS", payload: response.data.chats });

      // For now, using mock data
      dispatch({ type: "SET_CHATS", payload: [] });
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  }, []);

  const setActiveChat = useCallback((chat: Chat | null) => {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: chat });
    if (chat) {
      dispatch({ type: "MARK_AS_READ", payload: chat.id });
    }
  }, []);

  const sendMessage = useCallback(
    (content: string, type: Message["type"] = "text") => {
      const currentState = stateRef.current;
      const currentUser = userRef.current;

      if (
        !currentState.activeChat ||
        !currentUser ||
        !socketRef.current ||
        !isConnected
      ) {
        console.warn("Cannot send message: missing requirements", {
          hasActiveChat: !!currentState.activeChat,
          hasUser: !!currentUser,
          hasSocket: !!socketRef.current,
          isConnected,
        });
        return;
      }

      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        receiverId: currentState.activeChat.id,
        content,
        timestamp: new Date(),
        type,
        status: "sent",
      };

      // Add message to local state immediately
      dispatch({ type: "SEND_MESSAGE", payload: message });

      // Send via socket
      const recipientPhone = currentState.activeChat.participants.find(
        (p) => p.id !== currentUser.id
      )?.phoneNumber;

      if (recipientPhone) {
        console.log("📤 Sending message to:", recipientPhone);
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
      } else {
        console.warn("No recipient phone number found for active chat");
      }
    },
    [isConnected]
  );

  const markAsRead = useCallback((chatId: string) => {
    dispatch({ type: "MARK_AS_READ", payload: chatId });

    // Emit seen message event
    const currentState = stateRef.current;
    const currentUser = userRef.current;

    if (socketRef.current && currentUser) {
      const chat = currentState.chats.find((c) => c.id === chatId);
      const recipient = chat?.participants.find((p) => p.id !== currentUser.id);
      if (recipient) {
        socketRef.current.emit("seen_message", {
          from: currentUser.phoneNumber,
          to: recipient.phoneNumber,
        });
      }
    }
  }, []);

  const startTyping = useCallback((chatId: string) => {
    const currentUser = userRef.current;
    if (socketRef.current && currentUser) {
      socketRef.current.emit("typing", {
        chatId,
        user: { id: currentUser.id, displayName: currentUser.displayName },
      });
    }
  }, []);

  const stopTyping = useCallback((chatId: string) => {
    const currentUser = userRef.current;
    if (socketRef.current && currentUser) {
      socketRef.current.emit("stop_typing", {
        chatId,
        user: { id: currentUser.id, displayName: currentUser.displayName },
      });
    }
  }, []);

  const addContact = useCallback((user: User) => {
    dispatch({ type: "ADD_CONTACT", payload: user });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  }, []);

  const createGroupChat = useCallback((name: string, participants: User[]) => {
    const currentUser = userRef.current;
    const newChat: Chat = {
      id: Date.now().toString(),
      participants,
      messages: [],
      isGroup: true,
      groupName: name,
      groupAdmin: currentUser?.id,
      unreadCount: 0,
      isPinned: false,
      isMuted: false,
    };
    dispatch({ type: "CREATE_GROUP_CHAT", payload: newChat });
  }, []);

  const addUserToGroup = useCallback((chatId: string, user: User) => {
    dispatch({ type: "ADD_USER_TO_GROUP", payload: { chatId, user } });
  }, []);

  const removeUserFromGroup = useCallback((chatId: string, userId: string) => {
    dispatch({ type: "REMOVE_USER_FROM_GROUP", payload: { chatId, userId } });
  }, []);

  const pinChat = useCallback((chatId: string) => {
    dispatch({ type: "PIN_CHAT", payload: chatId });
  }, []);

  const muteChat = useCallback((chatId: string) => {
    dispatch({ type: "MUTE_CHAT", payload: chatId });
  }, []);

  const sendContactRequest = useCallback((userId: string) => {
    // TODO: Implement actual API call
    console.log("Sending contact request to:", userId);
  }, []);

  const acceptContactRequest = useCallback((requestId: string) => {
    dispatch({ type: "ACCEPT_CONTACT_REQUEST", payload: requestId });
  }, []);

  const rejectContactRequest = useCallback((requestId: string) => {
    dispatch({ type: "REJECT_CONTACT_REQUEST", payload: requestId });
  }, []);

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
      {connectionError && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "#ff4444",
            color: "white",
            padding: "8px",
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          {connectionError}
        </div>
      )}
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
