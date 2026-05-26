import type { ChatState, Chat, Message, User, ContactRequest } from "../../types";
import type { CallState, CallStatus } from "../../types/call";

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export type ChatAction =
  | { type: "SET_ACTIVE_CHAT"; payload: Chat | null }
  | { type: "SET_CHATS"; payload: Chat[] }
  | { type: "ADD_NEW_CHAT"; payload: Chat }
  | { type: "SEND_MESSAGE"; payload: Message }
  | { type: "RECEIVE_MESSAGE"; payload: Message }
  | { type: "UPDATE_MESSAGE_STATUS"; payload: { messageId: string; status: Message["status"] } }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "ADD_CONTACT"; payload: User }
  | { type: "SET_CONTACTS"; payload: User[] }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "CREATE_GROUP_CHAT"; payload: Chat }
  | { type: "ADD_USER_TO_GROUP"; payload: { chatId: string; user: User } }
  | { type: "REMOVE_USER_FROM_GROUP"; payload: { chatId: string; userId: string } }
  | { type: "PIN_CHAT"; payload: string }
  | { type: "UNPIN_CHAT"; payload: string }
  | { type: "MUTE_CHAT"; payload: string }
  | { type: "SEND_CONTACT_REQUEST"; payload: ContactRequest }
  | { type: "ACCEPT_CONTACT_REQUEST"; payload: string }
  | { type: "REJECT_CONTACT_REQUEST"; payload: string }
  | { type: "SET_TYPING"; payload: { chatId: string; users: User[] } }
  | { type: "SET_CONNECTION_STATUS"; payload: boolean }
  | { type: "UPDATE_USER_STATUS"; payload: { userId: string; isOnline: boolean; lastSeen: Date } }
  | { type: "BLOCK_CONTACT"; payload: string }
  | { type: "UNBLOCK_CONTACT"; payload: string }
  | { type: "DELETE_CONTACT"; payload: string }
  // ── Call actions ──────────────────────────────────────────────────────────
  | { type: "SET_CALL"; payload: { callId: string; callType: CallState["callType"]; status: CallStatus } }
  | { type: "INITIATE_CALL"; payload: { callId: string; callee: User; callType: NonNullable<CallState["callType"]>; user: User } }
  | { type: "SET_CALL_STATUS"; payload: CallStatus }
  | { type: "SET_PEER_CONNECTION"; payload: RTCPeerConnection }
  | { type: "SET_LOCAL_STREAM"; payload: MediaStream }
  | { type: "SET_REMOTE_STREAM"; payload: MediaStream }
  | { type: "SET_CALLER"; payload: User }
  | { type: "SET_CALLEE"; payload: User }
  | { type: "RESET_CALL" };

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export const initialState: ChatState = {
  chats: [],
  activeChat: null,
  contacts: [],
  contactRequests: [],
  isTyping: {},
  searchQuery: "",
  call: {
    callId: null,
    status: "idle",
    callType: null,
    peerConnection: null,
    localStream: null,
    remoteStream: null,
    caller: null,
    callee: null,
  },
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChat: action.payload };

    case "SET_CHATS":
      return { ...state, chats: action.payload };

    case "ADD_NEW_CHAT":
      return { ...state, chats: [action.payload, ...state.chats] };

    case "SEND_MESSAGE":
    case "RECEIVE_MESSAGE": {
      const message = action.payload;
      const chatIndex = state.chats.findIndex(
        (chat) => chat.id === message.receiverId || chat.id === message.senderId
      );

      if (chatIndex === -1) return state;

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

      const updatedActiveChat =
        state.activeChat?.id === updatedChat.id ? updatedChat : state.activeChat;

      return { ...state, chats: updatedChats, activeChat: updatedActiveChat };
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
      const chatIndex = state.chats.findIndex((chat) => chat.id === action.payload);
      if (chatIndex === -1) return state;
      const updatedChats = [...state.chats];
      updatedChats[chatIndex] = { ...updatedChats[chatIndex], unreadCount: 0 };
      return { ...state, chats: updatedChats };
    }

    case "ADD_CONTACT":
      return { ...state, contacts: [...state.contacts, action.payload] };

    case "SET_CONTACTS":
      return { ...state, contacts: action.payload };

    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };

    case "CREATE_GROUP_CHAT":
      return { ...state, chats: [action.payload, ...state.chats] };

    case "PIN_CHAT": {
      const chatIndex = state.chats.findIndex((chat) => chat.id === action.payload);
      if (chatIndex === -1) return state;
      const updatedChats = [...state.chats];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        isPinned: !updatedChats[chatIndex].isPinned,
      };
      return { ...state, chats: updatedChats };
    }

    case "MUTE_CHAT": {
      const chatIndex = state.chats.findIndex((chat) => chat.id === action.payload);
      if (chatIndex === -1) return state;
      const updatedChats = [...state.chats];
      updatedChats[chatIndex] = {
        ...updatedChats[chatIndex],
        isMuted: !updatedChats[chatIndex].isMuted,
      };
      return { ...state, chats: updatedChats };
    }

    case "SET_TYPING":
      return {
        ...state,
        isTyping: { ...state.isTyping, [action.payload.chatId]: action.payload.users },
      };

    case "SEND_CONTACT_REQUEST":
      return { ...state, contactRequests: [...state.contactRequests, action.payload] };

    case "ACCEPT_CONTACT_REQUEST": {
      const request = state.contactRequests.find((req) => req.id === action.payload);
      if (!request) return state;
      return {
        ...state,
        contactRequests: state.contactRequests.filter((req) => req.id !== action.payload),
        contacts: [...state.contacts, request.senderInfo],
      };
    }

    case "REJECT_CONTACT_REQUEST":
      return {
        ...state,
        contactRequests: state.contactRequests.filter((req) => req.id !== action.payload),
      };

    case "UPDATE_USER_STATUS": {
      const { userId, isOnline, lastSeen } = action.payload;

      const patchParticipants = (participants: User[]) =>
        participants.map((p) =>
          p.id === userId ? { ...p, isOnline, lastSeen } : p
        );

      return {
        ...state,
        chats: state.chats.map((chat) => ({
          ...chat,
          participants: patchParticipants(chat.participants),
        })),
        contacts: state.contacts.map((c) =>
          c.id === userId ? { ...c, isOnline, lastSeen } : c
        ),
        activeChat: state.activeChat
          ? { ...state.activeChat, participants: patchParticipants(state.activeChat.participants) }
          : null,
      };
    }

    case "BLOCK_CONTACT":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload ? { ...c, isBlocked: true } : c
        ),
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isBlocked: true } : chat
        ),
      };

    case "UNBLOCK_CONTACT":
      return {
        ...state,
        contacts: state.contacts.map((c) =>
          c.id === action.payload ? { ...c, isBlocked: false } : c
        ),
        chats: state.chats.map((chat) =>
          chat.id === action.payload ? { ...chat, isBlocked: false } : chat
        ),
      };

    case "DELETE_CONTACT":
      return {
        ...state,
        contacts: state.contacts.filter((c) => c.id !== action.payload),
        chats: state.chats.filter((chat) => chat.id !== action.payload),
      };

    // ── Call actions ────────────────────────────────────────────────────────
    case "SET_CALL":
      return {
        ...state,
        call: {
          ...state.call,
          callId: action.payload.callId,
          callType: action.payload.callType,
          status: action.payload.status,
        },
      };

    case "INITIATE_CALL":
      return {
        ...state,
        call: {
          ...state.call,
          callId: action.payload.callId,
          status: "calling",
          callType: action.payload.callType,
          callee: action.payload.callee,
          caller: action.payload.user,
        },
      };

    case "SET_CALL_STATUS":
      return { ...state, call: { ...state.call, status: action.payload } };

    case "SET_PEER_CONNECTION":
      return { ...state, call: { ...state.call, peerConnection: action.payload } };

    case "SET_LOCAL_STREAM":
      return { ...state, call: { ...state.call, localStream: action.payload } };

    case "SET_REMOTE_STREAM":
      return { ...state, call: { ...state.call, remoteStream: action.payload } };

    case "SET_CALLER":
      return { ...state, call: { ...state.call, caller: action.payload } };

    case "SET_CALLEE":
      return { ...state, call: { ...state.call, callee: action.payload } };

    case "RESET_CALL":
      return { ...state, call: { ...initialState.call } };

    default:
      return state;
  }
}
