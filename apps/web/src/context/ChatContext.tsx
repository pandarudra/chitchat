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
import api from "../lib/api";
import { th } from "date-fns/locale";

interface ChatContextType extends ChatState {
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: Message["type"]) => void;
  markAsRead: (chatId: string) => void;
  addContact: (phoneNumber: string) => void;
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
  blockContact: (blockUserId: string) => void;
  unblockContact: (unblockUserId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

type ChatAction =
  | { type: "SET_ACTIVE_CHAT"; payload: Chat | null }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "SEND_MESSAGE"; payload: Message }
  | { type: "ADD_NEW_CHAT"; payload: Chat }
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
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | {
      type: "UPDATE_USER_STATUS";
      payload: { userId: string; isOnline: boolean; lastSeen: Date };
    }
  | {
      type: "BLOCK_CONTACT";
      payload: string;
    }
  | {
      type: "UNBLOCK_CONTACT";
      payload: string;
    };

const chatReducer = (state: ChatState, action: ChatAction): ChatState => {
  switch (action.type) {
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChat: action.payload };

    case "SET_CHATS":
      return { ...state, chats: action.payload };
    case "ADD_NEW_CHAT":
      return {
        ...state,
        chats: [action.payload, ...state.chats],
      };
    case "SEND_MESSAGE":
    case "RECEIVE_MESSAGE": {
      const message = action.payload;
      // For direct chats, chat.id should match either senderId or receiverId
      const chatIndex = state.chats.findIndex(
        (chat) => chat.id === message.receiverId || chat.id === message.senderId
      );

      if (chatIndex !== -1) {
        const updatedChats = [...state.chats];
        const updatedChat = {
          ...updatedChats[chatIndex],
          messages: [...updatedChats[chatIndex].messages, message],
          lastMessage: message,
          unreadCount:
            action.type === "RECEIVE_MESSAGE" &&
            state.activeChat?.id !== updatedChats[chatIndex].id
              ? updatedChats[chatIndex].unreadCount + 1
              : updatedChats[chatIndex].unreadCount,
        };
        updatedChats[chatIndex] = updatedChat;

        // If the active chat is the one being updated, update activeChat too
        const updatedActiveChat =
          state.activeChat?.id === updatedChat.id
            ? updatedChat
            : state.activeChat;

        return { ...state, chats: updatedChats, activeChat: updatedActiveChat };
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

    case "UPDATE_USER_STATUS": {
      const { userId, isOnline, lastSeen } = action.payload;

      // Update user status in chats
      const updatedChats = state.chats.map((chat) => ({
        ...chat,
        participants: chat.participants.map((participant) =>
          participant.id === userId
            ? { ...participant, isOnline, lastSeen }
            : participant
        ),
      }));

      // Update user status in contacts
      const updatedContacts = state.contacts.map((contact) =>
        contact.id === userId ? { ...contact, isOnline, lastSeen } : contact
      );

      // Update active chat if it contains this user
      const updatedActiveChat = state.activeChat
        ? {
            ...state.activeChat,
            participants: state.activeChat.participants.map((participant) =>
              participant.id === userId
                ? { ...participant, isOnline, lastSeen }
                : participant
            ),
          }
        : null;

      return {
        ...state,
        chats: updatedChats,
        contacts: updatedContacts,
        activeChat: updatedActiveChat,
      };
    }
    case "BLOCK_CONTACT": {
      const blockedUserId = action.payload;

      // Update contacts to mark as blocked
      const updatedContacts = state.contacts.map((contact) =>
        contact.id === blockedUserId ? { ...contact, isBlocked: true } : contact
      );

      // Update chats to mark as blocked
      const updatedChats = state.chats.map((chat) =>
        chat.id === blockedUserId ? { ...chat, isBlocked: true } : chat
      );

      return {
        ...state,
        contacts: updatedContacts,
        chats: updatedChats,
      };
    }

    case "UNBLOCK_CONTACT": {
      const unblockedUserId = action.payload;

      // Update contacts to mark as unblocked
      const updatedContacts = state.contacts.map((contact) =>
        contact.id === unblockedUserId
          ? { ...contact, isBlocked: false }
          : contact
      );

      // Update chats to mark as unblocked
      const updatedChats = state.chats.map((chat) =>
        chat.id === unblockedUserId ? { ...chat, isBlocked: false } : chat
      );

      return {
        ...state,
        contacts: updatedContacts,
        chats: updatedChats,
      };
    }

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

  const handleReceiveMessage = useCallback(async (data: any) => {
    const currentUser = userRef.current;
    const currentState = stateRef.current;

    if (!currentUser) return;

    // Extract sender information
    const senderId = data.fromId || data.from;

    // Check if sender is blocked
    const isBlockedSender = currentState.contacts.some(
      (contact) => contact.id === senderId && contact.isBlocked
    );

    if (isBlockedSender) {
      console.log("Ignoring message from blocked contact:", senderId);
      return; // Don't process message from blocked contact
    }

    // If the payload is nested, extract from data.message
    const msgData = data.message || data;

    // Extract content safely
    let actualContent = "";
    if (typeof msgData.content === "string") {
      actualContent = msgData.content;
    } else if (typeof msgData.message === "string") {
      actualContent = msgData.message;
    } else if (msgData.content && typeof msgData.content.content === "string") {
      actualContent = msgData.content.content;
    } else if (msgData.message && typeof msgData.message.content === "string") {
      actualContent = msgData.message.content;
    }

    // Validate timestamp and provide fallback
    const timestamp = msgData.timestamp
      ? new Date(msgData.timestamp)
      : new Date();
    const isValidTimestamp = !isNaN(timestamp.getTime());

    // Use fromId and toId if present, else fallback to msgData.from/to
    // senderId is already declared above
    const receiverId = data.toId || msgData.to || currentUser.id;

    if (!senderId || !receiverId) {
      console.error("Incoming message missing senderId or receiverId:", data);
      return;
    }

    const message: Message = {
      id: msgData._id || Date.now().toString(),
      senderId,
      receiverId,
      content: actualContent,
      timestamp: isValidTimestamp ? timestamp : new Date(),
      type: "text",
      status: msgData.seen ? "read" : msgData.delivered ? "delivered" : "sent",
    };

    // Always match chat by the other user's user id
    const contactId = senderId === currentUser.id ? receiverId : senderId;

    console.log(
      "Current chats:",
      currentState.chats.map((c) => c.id)
    );
    console.log("Incoming message:", message);
    console.log(
      "Incoming message senderId:",
      message.senderId,
      "receiverId:",
      message.receiverId
    );
    console.log("Calculated contactId:", contactId);

    // Match by user id only
    const existingChat = currentState.chats.find(
      (chat) => chat.id === contactId
    );

    if (!existingChat) {
      // Only create a new chat if it truly doesn't exist
      const newChat: Chat = {
        id: contactId,
        participants: [
          {
            id: contactId,
            displayName: data.senderName || contactId,
            phoneNumber: data.senderNumber || "",
            avatarUrl: data.senderAvatarUrl || null,
            isOnline: false, // We don't have this info in message data, would need separate API call
          },
          {
            id: currentUser.id,
            displayName: currentUser.displayName,
            phoneNumber: currentUser.phoneNumber,
            avatarUrl: currentUser.avatarUrl,
            isOnline: currentUser.isOnline || false,
          },
        ],
        messages: [message],
        lastMessage: message,
        isGroup: false,
        unreadCount: 1,
        isPinned: false,
        isMuted: false,
      };

      dispatch({ type: "ADD_NEW_CHAT", payload: newChat });
    } else {
      dispatch({ type: "RECEIVE_MESSAGE", payload: message });
    }
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

  const handleUserStatusChange = useCallback(
    (data: { userId: string; isOnline: boolean; lastSeen: Date }) => {
      dispatch({
        type: "UPDATE_USER_STATUS",
        payload: data,
      });
    },
    []
  );

  const blockContact = useCallback(async (blockUserId: string) => {
    try {
      const res = await api.post("/api/user/block-contact", {
        blockUserId: blockUserId,
      });
      console.log("Contact blocked successfully:", res);
      // Optionally update state or notify user
      dispatch({
        type: "BLOCK_CONTACT",
        payload: blockUserId,
      });

      const currentState = stateRef.current;
      if (currentState.activeChat?.id === blockUserId) {
        dispatch({ type: "SET_ACTIVE_CHAT", payload: null });
      }

      return res.data;
    } catch (error) {
      console.error("Failed to block contact:", error);
      throw error;
    }
  }, []);

  const unblockContact = useCallback(async (unblockUserId: string) => {
    try {
      const res = await api.post("/api/user/unblock-contact", {
        unblockUserId: unblockUserId,
      });
      console.log("✅ Contact unblocked:", res.data);

      // Update local state to reflect unblocked status
      dispatch({ type: "UNBLOCK_CONTACT", payload: unblockUserId });

      return res.data;
    } catch (error) {
      console.error("Failed to unblock contact:", error);
      throw error;
    }
  }, []);

  // Socket.IO connection effect - only depends on authentication
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log("Connecting to socket.io...", user);
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
      socket.on("user_status_change", handleUserStatusChange);

      // Set up heartbeat to keep connection alive and update online status
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit("heartbeat");
        }
      }, 30000); // Send heartbeat every 30 seconds

      // Cleanup function
      return () => {
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        clearInterval(heartbeatInterval);
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
    handleUserStatusChange,
  ]); // Only include stable dependencies

  // Separate effect for fetching chats
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchChats();
    }
  }, [isAuthenticated, user?.id]); // Only depend on user ID, not the whole user object

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get("/api/user/contacts");
      console.log("📞 Fetching contacts:", res.data.contacts);

      // Transform contacts to chat objects
      const chatsFromContacts: Chat[] = res.data.contacts.map(
        (contact: any) => ({
          id: contact.user, // Use contact's user ID as chat ID
          participants: [
            {
              id: contact.user,
              displayName: contact.name,
              phoneNumber: contact.phonenumber,
              avatarUrl: contact.avatarUrl,
              isOnline: contact.isOnline || false, // Use actual online status from contact
              lastSeen: contact.lastSeen
                ? new Date(contact.lastSeen)
                : undefined,
            },
            // Add current user to participants
            ...(userRef.current
              ? [
                  {
                    id: userRef.current.id,
                    displayName: userRef.current.displayName,
                    phoneNumber: userRef.current.phoneNumber,
                    avatarUrl: userRef.current.avatarUrl,
                    isOnline: userRef.current.isOnline || false,
                  },
                ]
              : []),
          ],
          messages: [], // Start with empty messages
          isGroup: false,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
        })
      );

      dispatch({ type: "SET_CHATS", payload: chatsFromContacts });
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  }, []);
  const setActiveChat = useCallback(async (chat: Chat | null) => {
    if (!chat) {
      dispatch({ type: "SET_ACTIVE_CHAT", payload: null });
      return;
    }

    dispatch({ type: "MARK_AS_READ", payload: chat.id });

    try {
      // Fetch previous messages for this chat
      const res = await api.get(`/api/chats/${chat.id}/messages`);
      console.log("📜 Fetched chat history:", res.data.messages);

      // Map backend messages to frontend Message type
      const mappedMessages: Message[] = res.data.messages.map((msg: any) => ({
        id: msg._id,
        senderId: msg.from,
        receiverId: msg.to,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        type: "text",
        status: msg.seen ? "read" : msg.delivered ? "delivered" : "sent",
      }));

      // Update the chat's messages in state and set activeChat to the updated chat object
      const updatedChats = stateRef.current.chats.map((c) =>
        c.id === chat.id ? { ...c, messages: mappedMessages } : c
      );
      console.log("Updated chats:", updatedChats);
      const updatedActiveChat =
        updatedChats.find((c) => c.id === chat.id) || chat;

      dispatch({ type: "SET_CHATS", payload: updatedChats });
      dispatch({ type: "SET_ACTIVE_CHAT", payload: updatedActiveChat });
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
      dispatch({ type: "SET_ACTIVE_CHAT", payload: chat }); // fallback
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

  const addContact = useCallback(async (phoneNumber: string) => {
    try {
      const res = await api.post("/api/user/add-contact", {
        contactNumber: phoneNumber,
      });
      console.log("📞 Adding contact:", res);
      dispatch({
        type: "ADD_CONTACT",
        payload: res.data.contact, // assuming the API returns the new contact as 'contact'
      });
      return res.data.contact;
    } catch (error) {
      console.error("Failed to add contact:", error);
      throw error; // Re-throw the error so the component can handle it
    }
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
        blockContact,
        unblockContact,
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
