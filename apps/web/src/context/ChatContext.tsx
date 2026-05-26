/**
 * ChatContext — messaging, contacts, and call orchestration.
 *
 * This file is intentionally slim. Heavy logic lives in:
 *   - context/chat/chatReducer.ts  (pure reducer + action types)
 *   - hooks/useCall.ts             (all WebRTC peer connection logic)
 */

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
import type { Chat, Message, User, ContactRequest } from "../types";
import { useAuth } from "./AuthContext";
import api from "../lib/api";
import { chatReducer, initialState } from "./chat/chatReducer";
import { useCall } from "../hooks/useCall";
import { VITE_BE_URL } from "../constants/e";

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface ChatContextType {
  // State
  chats: Chat[];
  activeChat: Chat | null;
  contacts: User[];
  contactRequests: ContactRequest[];
  isTyping: Record<string, User[]>;
  searchQuery: string;
  call: typeof initialState["call"];
  isConnected: boolean;

  // Chat actions
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: Message["type"]) => void;
  sendAIMessage: (content: string) => Promise<void>;
  sendAudioMessage: (audioBlob: Blob, duration: number) => Promise<void>;
  sendMediaMessage: (file: File, mediaType: "image" | "video") => Promise<void>;
  markAsRead: (chatId: string) => void;
  setSearchQuery: (query: string) => void;

  // Contact actions
  addContact: (email: string) => Promise<void>;
  deleteContact: (contactId: string) => void;
  blockContact: (blockUserId: string) => void;
  unblockContact: (unblockUserId: string) => void;
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;

  // Group actions (placeholders kept for API compatibility)
  createGroupChat: (name: string, participants: User[]) => void;
  addUserToGroup: (chatId: string, user: User) => void;
  removeUserFromGroup: (chatId: string, userId: string) => void;

  // Contact requests
  sendContactRequest: (userId: string) => void;
  acceptContactRequest: (requestId: string) => void;
  rejectContactRequest: (requestId: string) => void;

  // Typing
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;

  // Calls (delegated to useCall)
  initiateCall: (callee: User, callType: "audio" | "video") => void;
  acceptCall: (callId: string) => void;
  declineCall: (callId: string) => void;
  endCall: (callId: string) => void;
  sendIceCandidate: (candidate: RTCIceCandidate) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable refs so socket handlers always see the latest values
  const stateRef = useRef(state);
  const userRef = useRef(user);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { userRef.current = user; }, [user]);

  // ── WebRTC hook ────────────────────────────────────────────────────────────
  const { initiateCall, acceptCall, declineCall, endCall, sendIceCandidate } =
    useCall({ socketRef, isConnected, stateRef, userRef, dispatch, isAuthenticated });

  // ── Socket connection ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(VITE_BE_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      timeout: 20_000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1_000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("connect_error", (err) => {
      setIsConnected(false);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => socket.connect(), 3_000);
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      dispatch({ type: "RESET_CALL" });
      if (reason === "io server disconnect") socket.connect();
    });

    socket.on("reconnect", () => setIsConnected(true));

    // Messaging events
    socket.on("one_to_one_message", handleReceiveMessage);
    socket.on("seen_message", handleSeenMessage);
    socket.on("user_typing", (data: any) =>
      dispatch({ type: "SET_TYPING", payload: { chatId: data.chatId, users: [data.user] } })
    );
    socket.on("user_stopped_typing", (data: any) =>
      dispatch({ type: "SET_TYPING", payload: { chatId: data.chatId, users: [] } })
    );
    socket.on("user_status_change", (data: any) =>
      dispatch({
        type: "UPDATE_USER_STATUS",
        payload: { ...data, lastSeen: new Date(data.lastSeen) },
      })
    );

    // Heartbeat keeps Redis TTL and lastSeen refreshed
    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit("heartbeat");
    }, 30_000);

    return () => {
      clearInterval(heartbeat);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      socket.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch chats on auth ────────────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated && user) fetchChats();
  }, [isAuthenticated, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket message handlers ────────────────────────────────────────────────

  const handleSeenMessage = useCallback((data: any) => {
    const currentUser = userRef.current;
    if (!currentUser) return;

    stateRef.current.chats.forEach((chat) => {
      chat.messages.forEach((msg) => {
        if (msg.senderId === currentUser.id && msg.receiverId === data.from && msg.status !== "read") {
          dispatch({ type: "UPDATE_MESSAGE_STATUS", payload: { messageId: msg.id, status: "read" } });
        }
      });
    });
  }, []);

  const handleReceiveMessage = useCallback(async (data: any) => {
    const currentUser = userRef.current;
    const currentState = stateRef.current;
    if (!currentUser) return;

    const senderId = data.fromId || data.from;

    // Silently drop messages from blocked contacts
    const isBlocked = currentState.contacts.some(
      (c) => c.id === senderId && c.isBlocked
    );
    if (isBlocked) return;

    const msgData = data.message || data;

    // Extract content safely from various server payload shapes
    const actualContent: string =
      typeof msgData.content === "string"
        ? msgData.content
        : typeof msgData.message === "string"
        ? msgData.message
        : msgData.content?.content ?? msgData.message?.content ?? "";

    const timestamp = msgData.timestamp ? new Date(msgData.timestamp) : new Date();
    const receiverId = data.toId || msgData.to || currentUser.id;

    if (!senderId || !receiverId) return;

    const message: Message = {
      id: msgData._id || Date.now().toString(),
      senderId,
      receiverId,
      content: actualContent,
      timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
      type: data.type || msgData.type || "text",
      status: msgData.seen ? "read" : msgData.delivered ? "delivered" : "sent",
      mediaUrl: data.mediaUrl || msgData.path || msgData.mediaUrl,
      fileName: data.fileName || msgData.fileName,
      fileSize: data.fileSize || msgData.fileSize,
      duration: data.duration || msgData.duration,
    };

    const contactId = senderId === currentUser.id ? receiverId : senderId;
    const existingChat = currentState.chats.find((c) => c.id === contactId);

    if (!existingChat) {
      dispatch({
        type: "ADD_NEW_CHAT",
        payload: {
          id: contactId,
          participants: [
            {
              id: contactId,
              displayName: data.senderName || contactId,
              phoneNumber: data.senderNumber || "",
              isOnline: false,
            },
            {
              id: currentUser.id,
              displayName: currentUser.displayName,
              phoneNumber: currentUser.phoneNumber,
              avatarUrl: currentUser.avatarUrl,
              isOnline: currentUser.isOnline,
            },
          ],
          messages: [message],
          lastMessage: message,
          isGroup: false,
          unreadCount: 1,
          isPinned: false,
          isMuted: false,
        },
      });
    } else {
      dispatch({ type: "RECEIVE_MESSAGE", payload: message });
    }
  }, []);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchChats = useCallback(async () => {
    try {
      const res = await api.get("/api/user/contacts");

      const chats: Chat[] = res.data.contacts.map((contact: any) => ({
        id: contact.user,
        participants: [
          {
            id: contact.user,
            displayName: contact.name,
            phoneNumber: contact.phonenumber,
            avatarUrl: contact.avatarUrl,
            isOnline: contact.isOnline ?? false,
            lastSeen: contact.lastSeen ? new Date(contact.lastSeen) : undefined,
            isBlocked: contact.blocked,
            isAI: contact.isAI ?? false,
          },
          ...(userRef.current
            ? [{
                id: userRef.current.id,
                displayName: userRef.current.displayName,
                phoneNumber: userRef.current.phoneNumber,
                avatarUrl: userRef.current.avatarUrl,
                isOnline: userRef.current.isOnline,
                isAI: false,
              }]
            : []),
        ],
        messages: [],
        isGroup: false,
        isAI: contact.isAI ?? false,
        unreadCount: 0,
        isPinned: contact.pinned,
        isMuted: false,
      }));

      dispatch({ type: "SET_CHATS", payload: chats });

      // Hydrate last messages for chat list previews
      const hydrated = await Promise.all(
        chats.map(async (chat) => {
          try {
            const other = chat.participants.find((p) => p.id !== userRef.current?.id);
            if (!other) return chat;
            const r = await api.get(`/api/chats/${other.id}/messages`);
            const msgs: any[] = r.data.messages ?? [];
            if (msgs.length === 0) return chat;
            const last = msgs[msgs.length - 1];
            return {
              ...chat,
              lastMessage: {
                id: last._id,
                senderId: last.from,
                receiverId: last.to,
                content: last.content,
                timestamp: new Date(last.timestamp),
                type: last.type ?? "text",
                status: (last.delivered ? "delivered" : "sent") as Message["status"],
                mediaUrl: last.mediaUrl,
                fileName: last.fileName,
                fileSize: last.fileSize,
                duration: last.duration ?? 0,
              } satisfies Message,
            };
          } catch {
            return chat;
          }
        })
      );

      dispatch({ type: "SET_CHATS", payload: hydrated });

      const contacts = res.data.contacts.map((c: any) => ({
        id: c.user.toString(),
        displayName: c.name,
        phoneNumber: c.phonenumber,
        avatarUrl: c.avatarUrl,
        isOnline: c.isOnline ?? false,
        lastSeen: c.lastSeen ? new Date(c.lastSeen) : undefined,
      }));
      dispatch({ type: "ADD_CONTACT", payload: contacts[0] }); // triggers SET_CONTACTS pattern
      dispatch({ type: "SET_CONTACTS", payload: contacts });
    } catch {
      // Non-fatal — user will retry on next mount
    }
  }, []);

  // ── Chat actions ───────────────────────────────────────────────────────────

  const setActiveChat = useCallback(async (chat: Chat | null) => {
    if (!chat) {
      dispatch({ type: "SET_ACTIVE_CHAT", payload: null });
      return;
    }

    dispatch({ type: "MARK_AS_READ", payload: chat.id });

    try {
      const res = await api.get(`/api/chats/${chat.id}/messages`);
      const messages: Message[] = res.data.messages.map((msg: any) => ({
        id: msg._id,
        senderId: msg.from,
        receiverId: msg.to,
        content: msg.content,
        timestamp: new Date(msg.timestamp),
        type: msg.type ?? "text",
        mediaUrl: msg.path ?? null,
        status: msg.seen ? "read" : msg.delivered ? "delivered" : "sent",
        isBlocked: msg.blocked,
        duration: msg.duration ?? 0,
      }));

      const updatedChats = stateRef.current.chats.map((c) =>
        c.id === chat.id ? { ...c, messages } : c
      );
      dispatch({ type: "SET_CHATS", payload: updatedChats });
      dispatch({ type: "SET_ACTIVE_CHAT", payload: updatedChats.find((c) => c.id === chat.id) ?? chat });
    } catch {
      dispatch({ type: "SET_ACTIVE_CHAT", payload: chat });
    }
  }, []);

  const sendMessage = useCallback(
    (content: string, type: Message["type"] = "text") => {
      const currentState = stateRef.current;
      const currentUser = userRef.current;

      if (!currentState.activeChat || !currentUser || !socketRef.current || !isConnected) return;

      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        receiverId: currentState.activeChat.id,
        content,
        timestamp: new Date(),
        type,
        status: "sent",
      };

      dispatch({ type: "SEND_MESSAGE", payload: message });

      const recipientPhone = currentState.activeChat.participants.find(
        (p) => p.id !== currentUser.id
      )?.phoneNumber;

      if (recipientPhone) {
        socketRef.current.emit("one_to_one_message", {
          to: recipientPhone,
          message: content,
          timestamp: message.timestamp.toISOString(),
        });

        setTimeout(
          () => dispatch({ type: "UPDATE_MESSAGE_STATUS", payload: { messageId: message.id, status: "delivered" } }),
          1_000
        );
      }
    },
    [isConnected]
  );

  const sendAIMessage = useCallback(async (content: string) => {
    const currentState = stateRef.current;
    const currentUser = userRef.current;
    if (!currentState.activeChat || !currentUser) return;

    const isAIChat =
      currentState.activeChat.isAI ||
      currentState.activeChat.participants.some((p) => p.isAI);
    if (!isAIChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      receiverId: currentState.activeChat.id,
      content,
      timestamp: new Date(),
      type: "text",
      status: "sent",
      isAIMessage: false,
    };
    dispatch({ type: "SEND_MESSAGE", payload: userMessage });

    try {
      const response = await api.post("/api/ai/chat", {
        message: content,
        botId: currentState.activeChat.id,
      });

      if (response.data.success) {
        const { aiResponse } = response.data.data;
        dispatch({
          type: "RECEIVE_MESSAGE",
          payload: {
            id: aiResponse.id,
            senderId: aiResponse.from,
            receiverId: currentUser.id,
            content: aiResponse.content,
            timestamp: new Date(aiResponse.timestamp),
            type: "text",
            status: "delivered",
            isAIMessage: true,
          },
        });
      }
    } catch {
      dispatch({
        type: "RECEIVE_MESSAGE",
        payload: {
          id: (Date.now() + 1).toString(),
          senderId: currentState.activeChat.id,
          receiverId: currentUser.id,
          content: "I'm sorry, I'm experiencing some technical difficulties. Please try again.",
          timestamp: new Date(),
          type: "text",
          status: "delivered",
          isAIMessage: true,
        },
      });
    }
  }, []);

  const sendAudioMessage = useCallback(
    async (audioBlob: Blob, duration: number) => {
      const currentState = stateRef.current;
      const currentUser = userRef.current;
      if (!currentState.activeChat || !currentUser || !socketRef.current || !isConnected) return;

      const formData = new FormData();
      formData.append("audio", new File([audioBlob], `audio_${Date.now()}.webm`, { type: audioBlob.type }));
      formData.append("duration", duration.toString());
      formData.append("receiverId", currentState.activeChat.id);

      const uploadRes = await api.post("/api/upload/audio", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { audioUrl, fileName, fileSize } = uploadRes.data;

      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        receiverId: currentState.activeChat.id,
        content: `Audio message (${Math.floor(duration)}s)`,
        timestamp: new Date(),
        type: "audio",
        status: "sent",
        mediaUrl: audioUrl,
        fileName,
        fileSize,
        duration,
      };
      dispatch({ type: "SEND_MESSAGE", payload: message });

      const recipientPhone = currentState.activeChat.participants.find(
        (p) => p.id !== currentUser.id
      )?.phoneNumber;

      if (recipientPhone) {
        socketRef.current.emit("one_to_one_message", {
          to: recipientPhone,
          message: message.content,
          timestamp: message.timestamp.toISOString(),
          type: "audio",
          mediaUrl: audioUrl,
          fileName,
          fileSize,
          duration,
        });
        setTimeout(
          () => dispatch({ type: "UPDATE_MESSAGE_STATUS", payload: { messageId: message.id, status: "delivered" } }),
          1_000
        );
      }
    },
    [isConnected]
  );

  const sendMediaMessage = useCallback(
    async (file: File, mediaType: "image" | "video") => {
      const currentState = stateRef.current;
      const currentUser = userRef.current;
      if (!currentState.activeChat || !currentUser || !socketRef.current || !isConnected) return;

      const formData = new FormData();
      formData.append(mediaType, file);
      formData.append("receiverId", currentState.activeChat.id);

      const uploadRes = await api.post(`/api/upload/${mediaType}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { imageUrl, videoUrl, fileName, fileSize } = uploadRes.data;
      const mediaUrl = imageUrl ?? videoUrl;

      const message: Message = {
        id: Date.now().toString(),
        senderId: currentUser.id,
        receiverId: currentState.activeChat.id,
        content: mediaType === "image" ? "📷 Image" : "🎥 Video",
        timestamp: new Date(),
        type: mediaType,
        status: "sent",
        mediaUrl,
        fileName,
        fileSize,
      };
      dispatch({ type: "SEND_MESSAGE", payload: message });

      const recipientPhone = currentState.activeChat.participants.find(
        (p) => p.id !== currentUser.id
      )?.phoneNumber;

      if (recipientPhone) {
        socketRef.current.emit("one_to_one_message", {
          to: recipientPhone,
          message: message.content,
          timestamp: message.timestamp.toISOString(),
          type: mediaType,
          mediaUrl,
          fileName,
          fileSize,
        });
        setTimeout(
          () => dispatch({ type: "UPDATE_MESSAGE_STATUS", payload: { messageId: message.id, status: "delivered" } }),
          1_000
        );
      }
    },
    [isConnected]
  );

  // ── Contact actions ────────────────────────────────────────────────────────

  const addContact = useCallback(async (contactEmail: string) => {
    await api.post("/api/user/add-contact", { contactEmail });
    await fetchChats();
  }, [fetchChats]);

  const deleteContact = useCallback(async (contactId: string) => {
    await api.post("/api/user/delete-contact", { contactId });
    dispatch({ type: "DELETE_CONTACT", payload: contactId });
    if (stateRef.current.activeChat?.id === contactId) {
      dispatch({ type: "SET_ACTIVE_CHAT", payload: null });
    }
  }, []);

  const blockContact = useCallback(async (blockUserId: string) => {
    await api.post("/api/user/block-contact", { blockUserId });
    dispatch({ type: "BLOCK_CONTACT", payload: blockUserId });
    if (stateRef.current.activeChat?.id === blockUserId) {
      dispatch({ type: "SET_ACTIVE_CHAT", payload: null });
    }
  }, []);

  const unblockContact = useCallback(async (unblockUserId: string) => {
    await api.post("/api/user/unblock-contact", { unblockUserId });
    dispatch({ type: "UNBLOCK_CONTACT", payload: unblockUserId });
  }, []);

  const markAsRead = useCallback((chatId: string) => {
    dispatch({ type: "MARK_AS_READ", payload: chatId });
  }, []);

  const pinChat = useCallback((chatId: string) => {
    dispatch({ type: "PIN_CHAT", payload: chatId });
  }, []);

  const unpinChat = useCallback((chatId: string) => {
    dispatch({ type: "UNPIN_CHAT", payload: chatId });
  }, []);

  const muteChat = useCallback((chatId: string) => {
    dispatch({ type: "MUTE_CHAT", payload: chatId });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  }, []);

  // Group / contact request placeholders (kept for API surface compatibility)
  const createGroupChat = useCallback((_name: string, _participants: User[]) => {}, []);
  const addUserToGroup = useCallback((_chatId: string, _user: User) => {}, []);
  const removeUserFromGroup = useCallback((_chatId: string, _userId: string) => {}, []);
  const sendContactRequest = useCallback((_userId: string) => {}, []);
  const acceptContactRequest = useCallback((requestId: string) => {
    dispatch({ type: "ACCEPT_CONTACT_REQUEST", payload: requestId });
  }, []);
  const rejectContactRequest = useCallback((requestId: string) => {
    dispatch({ type: "REJECT_CONTACT_REQUEST", payload: requestId });
  }, []);
  const startTyping = useCallback((chatId: string) => {
    socketRef.current?.emit("user_typing", { chatId });
  }, []);
  const stopTyping = useCallback((chatId: string) => {
    socketRef.current?.emit("user_stopped_typing", { chatId });
  }, []);

  // ── Context value ─────────────────────────────────────────────────────────

  return (
    <ChatContext.Provider
      value={{
        ...state,
        isConnected,
        setActiveChat,
        sendMessage,
        sendAIMessage,
        sendAudioMessage,
        sendMediaMessage,
        markAsRead,
        setSearchQuery,
        addContact,
        deleteContact,
        blockContact,
        unblockContact,
        pinChat,
        unpinChat,
        muteChat,
        createGroupChat,
        addUserToGroup,
        removeUserFromGroup,
        sendContactRequest,
        acceptContactRequest,
        rejectContactRequest,
        startTyping,
        stopTyping,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
        sendIceCandidate,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
