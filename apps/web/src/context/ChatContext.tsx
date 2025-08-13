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
import type {
  ChatState,
  Chat,
  Message,
  User,
  ContactRequest,
  CallState,
} from "../types";
import { useAuth } from "./AuthContext";
import api from "../lib/api";

interface ChatContextType extends ChatState {
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (content: string, type?: Message["type"]) => void;
  sendAudioMessage: (audioBlob: Blob, duration: number) => Promise<void>;
  sendMediaMessage: (file: File, mediaType: "image" | "video") => Promise<void>;
  markAsRead: (chatId: string) => void;
  addContact: (phoneNumber: string) => void;
  setSearchQuery: (query: string) => void;
  createGroupChat: (name: string, participants: User[]) => void;
  addUserToGroup: (chatId: string, user: User) => void;
  removeUserFromGroup: (chatId: string, userId: string) => void;
  pinChat: (chatId: string) => void;
  unpinChat: (chatId: string) => void;
  muteChat: (chatId: string) => void;
  sendContactRequest: (userId: string) => void;
  acceptContactRequest: (requestId: string) => void;
  rejectContactRequest: (requestId: string) => void;
  startTyping: (chatId: string) => void;
  stopTyping: (chatId: string) => void;
  isConnected: boolean;
  blockContact: (blockUserId: string) => void;
  unblockContact: (unblockUserId: string) => void;
  deleteContact: (contactId: string) => void;
  //calls
  initiateCall: (callee: User, callType: "audio" | "video") => void;
  acceptCall: (callId: string) => void;
  declineCall: (callId: string) => void;
  endCall: (callId: string) => void;
  sendIceCandidate: (candidate: RTCIceCandidate) => void;
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
  | { type: "SET_CONTACTS"; payload: User[] }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "CREATE_GROUP_CHAT"; payload: Chat }
  | { type: "ADD_USER_TO_GROUP"; payload: { chatId: string; user: User } }
  | {
      type: "REMOVE_USER_FROM_GROUP";
      payload: { chatId: string; userId: string };
    }
  | { type: "PIN_CHAT"; payload: string }
  | { type: "UNPIN_CHAT"; payload: string }
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
    }
  | {
      type: "DELETE_CONTACT";
      payload: string;
    }
  | {
      type: "UPDATE_USER_STATUS";
      payload: { userId: string; isOnline: boolean; lastSeen: Date };
    }
  | { type: "BLOCK_CONTACT"; payload: string }
  | { type: "UNBLOCK_CONTACT"; payload: string }
  | {
      type: "INITIATE_CALL";
      payload: {
        callId: string;
        callee: User;
        callType: "audio" | "video";
        user: User;
      };
    }
  | { type: "SET_CALL_STATUS"; payload: CallState["status"] }
  | { type: "SET_PEER_CONNECTION"; payload: RTCPeerConnection }
  | { type: "SET_LOCAL_STREAM"; payload: MediaStream }
  | { type: "SET_REMOTE_STREAM"; payload: MediaStream }
  | { type: "SET_CALLER"; payload: User }
  | { type: "SET_CALLEE"; payload: User }
  | { type: "RESET_CALL" }
  // | { type: "SET_CALL_HISTORY"; payload: CallHistory[] }
  | {
      type: "SET_CALL";
      payload: {
        callId: string;
        callType: "audio" | "video";
        status: CallState["status"];
      };
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
      console.log("🔄 Updating user status in reducer:", {
        userId,
        isOnline,
        lastSeen,
      });

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

      console.log("🔄 Updated chats, contacts, and activeChat");
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

    case "DELETE_CONTACT": {
      const deletedContactId = action.payload;

      // Remove contact from contacts list
      const filteredContacts = state.contacts.filter(
        (contact) => contact.id !== deletedContactId
      );

      // Remove chat with this contact
      const filteredChats = state.chats.filter(
        (chat) => chat.id !== deletedContactId
      );

      return {
        ...state,
        contacts: filteredContacts,
        chats: filteredChats,
      };
    }

    //call actions
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
      return {
        ...state,
        call: { ...state.call, peerConnection: action.payload },
      };

    case "SET_LOCAL_STREAM":
      return { ...state, call: { ...state.call, localStream: action.payload } };

    case "SET_REMOTE_STREAM":
      return {
        ...state,
        call: { ...state.call, remoteStream: action.payload },
      };

    case "SET_CALLER":
      return { ...state, call: { ...state.call, caller: action.payload } };

    case "SET_CALLEE":
      return { ...state, call: { ...state.call, callee: action.payload } };

    case "RESET_CALL":
      return {
        ...state,
        call: {
          ...initialState.call,
          peerConnection: null, // Will be closed separately
        },
      };

    // case "SET_CALL_HISTORY":
    //   return { ...state, callHistory: action.payload };

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

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const iceCandidateQueueRef = useRef<RTCIceCandidate[]>([]);

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

  // WebRTC configuration
  // const configuration: RTCConfiguration = {
  //   iceServers: [
  //     { urls: "stun:stun.l.google.com:19302" },
  //     { urls: "stun:stun1.l.google.com:19302" }, // Add backup STUN servers
  //     // Add TURN server if needed for better connectivity
  //   ],
  // };

  // Cleanup call resources
  const cleanupCall = useCallback(() => {
    console.log("🧹 Cleaning up call resources");

    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    iceCandidateQueueRef.current = [];

    const currentCall = stateRef.current.call;

    if (currentCall.peerConnection) {
      currentCall.peerConnection.close();
    }

    if (currentCall.localStream) {
      currentCall.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log("🛑 Stopped track:", track.kind);
      });
    }

    dispatch({ type: "RESET_CALL" });
  }, []);

  // Helper function to process queued ICE candidates
  const processQueuedIceCandidates = useCallback(
    async (peerConnection: RTCPeerConnection) => {
      console.log(
        `🧊 Processing ${iceCandidateQueueRef.current.length} queued ICE candidates`
      );

      for (const candidate of iceCandidateQueueRef.current) {
        try {
          await peerConnection.addIceCandidate(candidate);
          console.log("✅ Added queued ICE candidate");
        } catch (error) {
          console.error("❌ Failed to add queued ICE candidate:", error);
        }
      }

      // Clear the queue after processing
      iceCandidateQueueRef.current = [];
    },
    []
  );

  // Initialize peer connection
  const createPeerConnection = useCallback(() => {
    console.log("🔗 Creating new peer connection");

    // Enhanced configuration for better connectivity and audio quality
    const enhancedConfiguration: RTCConfiguration = {
      iceServers: [
        // Google STUN servers
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
        { urls: "stun:stun3.l.google.com:19302" },
        { urls: "stun:stun4.l.google.com:19302" },
        // Additional reliable STUN servers
        { urls: "stun:stun.relay.metered.ca:80" },
        { urls: "stun:stun.cloudflare.com:3478" },
        // Free TURN servers (for better NAT traversal)
        {
          urls: "turn:openrelay.metered.ca:80",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
        {
          urls: "turn:openrelay.metered.ca:443?transport=tcp",
          username: "openrelayproject",
          credential: "openrelayproject",
        },
      ],
      iceCandidatePoolSize: 10, // Pre-gather ICE candidates
      iceTransportPolicy: "all", // Use both UDP and TCP
      bundlePolicy: "max-bundle", // Bundle all media streams
      rtcpMuxPolicy: "require", // Always multiplex RTCP
    };

    const pc = new RTCPeerConnection(enhancedConfiguration);

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log("🧊 Sending ICE candidate:", event.candidate.candidate);
        const currentCall = stateRef.current.call;
        const recipientId =
          currentCall.caller?.id === userRef.current?.id
            ? currentCall.callee?.id
            : currentCall.caller?.id;

        if (recipientId) {
          socketRef.current.emit("ice-candidate", {
            to: recipientId,
            candidate: event.candidate,
            callId: currentCall.callId,
          });
        }
      }
    };

    pc.ontrack = (event) => {
      console.log("📺 Received remote track:", event.track.kind);
      if (event.streams[0]) {
        dispatch({ type: "SET_REMOTE_STREAM", payload: event.streams[0] });

        // Log track details for debugging
        event.streams[0].getTracks().forEach((track) => {
          console.log(`🎵 Remote ${track.kind} track:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
          });
        });
      }
    };

    // Enhanced connection state monitoring
    pc.onconnectionstatechange = () => {
      console.log("🔗 Peer connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        console.log("✅ Peer connection established successfully");
      } else if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        console.log("❌ Peer connection failed/disconnected");
        cleanupCall();
      }
    };

    // Audio-specific monitoring
    pc.onsignalingstatechange = () => {
      console.log("📡 Signaling state:", pc.signalingState);
    };

    pc.oniceconnectionstatechange = () => {
      console.log("🧊 ICE connection state:", pc.iceConnectionState);

      switch (pc.iceConnectionState) {
        case "connected":
        case "completed":
          console.log("✅ ICE connection established");
          break;
        case "failed":
          console.log("❌ ICE connection failed - attempting restart");
          // Try to restart ICE
          if (pc.restartIce) {
            pc.restartIce();
          }
          break;
        case "disconnected":
          console.log(
            "⚠️ ICE connection disconnected - waiting for reconnection"
          );
          // Give some time for reconnection before failing
          setTimeout(() => {
            if (pc.iceConnectionState === "disconnected") {
              console.log("❌ ICE reconnection timeout - cleaning up call");
              cleanupCall();
            }
          }, 10000); // 10 second timeout
          break;
        case "closed":
          console.log("🔒 ICE connection closed");
          cleanupCall();
          break;
      }
    };

    // ICE gathering state monitoring
    pc.onicegatheringstatechange = () => {
      console.log("🔍 ICE gathering state:", pc.iceGatheringState);
      if (pc.iceGatheringState === "complete") {
        console.log("✅ ICE gathering completed");
      }
    };

    return pc;
  }, [cleanupCall]);

  // Initiate a call
  const initiateCall = useCallback(
    async (callee: User, callType: "audio" | "video") => {
      if (!socketRef.current || !isConnected || !userRef.current) {
        console.warn("❌ Cannot initiate call: missing requirements", {
          socket: !!socketRef.current,
          isConnected,
          user: !!userRef.current,
        });
        return;
      }

      try {
        console.log(`📞 Initiating ${callType} call to:`, callee.displayName);

        // Get user media based on call type - FIXED constraints
        const mediaConstraints = {
          audio: true, // Always request audio
          video: callType === "video",
        };

        const stream =
          await navigator.mediaDevices.getUserMedia(mediaConstraints);
        dispatch({ type: "SET_LOCAL_STREAM", payload: stream });

        // Create peer connection
        const pc = createPeerConnection();
        dispatch({ type: "SET_PEER_CONNECTION", payload: pc });

        // audio tracks FIRST, then video tracks
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream);
          console.log("➕ Added audio track to peer connection");
        });

        if (callType === "video") {
          stream.getVideoTracks().forEach((track) => {
            pc.addTrack(track, stream);
            console.log("➕ Added video track to peer connection");
          });
        }

        // Create offer with proper audio/video constraints
        const offerOptions: RTCOfferOptions = {
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === "video",
        };

        const offer = await pc.createOffer(offerOptions);
        await pc.setLocalDescription(offer);
        console.log(
          "📤 Created and set local offer with constraints:",
          offerOptions
        );

        await processQueuedIceCandidates(pc);

        const callId = `call_${Date.now()}_${userRef.current.id}_${callee.id}`;

        // Update call state
        dispatch({
          type: "INITIATE_CALL",
          payload: { callId, callee, callType, user: userRef.current },
        });

        // Emit call with both user ID and phone number for better reliability
        socketRef.current.emit("call-user", {
          to: callee.id,
          toPhone: callee.phoneNumber,
          callId,
          offer,
          callType,
          from: userRef.current.id,
          fromName: userRef.current.displayName,
          fromPhone: userRef.current.phoneNumber,
        });

        console.log("📤 Emitted call-user event", {
          to: callee.id,
          callId,
          callType,
        });

        // Set timeout for call
        callTimeoutRef.current = setTimeout(() => {
          console.log("⏰ Call timeout reached");
          if (stateRef.current.call.status === "calling") {
            dispatch({ type: "SET_CALL_STATUS", payload: "timeout" });
            socketRef.current?.emit("call-timeout", {
              callId,
              to: callee.id,
            });
            setTimeout(() => cleanupCall(), 2000);
          }
        }, 30000); // 30 seconds timeout
      } catch (error) {
        console.error("❌ Failed to initiate call:", error);
        cleanupCall();
      }
    },
    [isConnected, createPeerConnection, cleanupCall, processQueuedIceCandidates]
  );

  // Accept a call
  const acceptCall = useCallback(
    async (callId: string) => {
      const currentCall = stateRef.current.call;
      const currentUser = userRef.current;

      if (
        !socketRef.current ||
        !currentCall.peerConnection ||
        !currentCall.caller ||
        !currentUser
      ) {
        console.warn("❌ Cannot accept call: missing requirements");
        return;
      }

      try {
        console.log(`✅ Accepting ${currentCall.callType} call:`, callId);
        const pc = currentCall.peerConnection;

        // Check signaling state
        if (pc.signalingState !== "have-remote-offer") {
          console.error(
            "❌ Invalid signaling state for answer:",
            pc.signalingState
          );
          cleanupCall();
          return;
        }

        // FIXED: More explicit media constraints with proper fallbacks
        const mediaConstraints = {
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            currentCall.callType === "video"
              ? {
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 30 },
                }
              : false,
        };

        const stream =
          await navigator.mediaDevices.getUserMedia(mediaConstraints);

        dispatch({ type: "SET_LOCAL_STREAM", payload: stream });

        // audio first, then video
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream);
          console.log("➕ Added audio track for answer");
        });

        if (currentCall.callType === "video") {
          stream.getVideoTracks().forEach((track) => {
            pc.addTrack(track, stream);
            console.log("➕ Added video track for answer");
          });
        }

        // Create answer with explicit constraints
        const answerOptions: RTCAnswerOptions = {};
        const answer = await pc.createAnswer(answerOptions);
        await pc.setLocalDescription(answer);
        console.log("📤 Created and set local answer");

        // Send answer with multiple identifiers for reliability
        socketRef.current.emit("accept-call", {
          callId,
          answer,
          to: currentCall.caller.id,
          toPhone: currentCall.caller.phoneNumber,
          from: currentUser.id,
          fromPhone: currentUser.phoneNumber,
        });

        dispatch({ type: "SET_CALL_STATUS", payload: "connected" });
        console.log(`✅ ${currentCall.callType} call accepted and answer sent`);
      } catch (error) {
        console.error("❌ Failed to accept call:", error);
        cleanupCall();
      }
    },
    [cleanupCall]
  );

  // Decline a call
  const declineCall = useCallback(
    (callId: string) => {
      const currentCall = stateRef.current.call;
      const currentUser = userRef.current;

      if (socketRef.current && currentCall.caller && currentUser) {
        console.log("❌ Declining call:", callId);

        socketRef.current.emit("decline-call", {
          callId,
          to: currentCall.caller.id,
          toPhone: currentCall.caller.phoneNumber,
          from: currentUser.id,
        });

        dispatch({ type: "SET_CALL_STATUS", payload: "declined" });
        setTimeout(() => cleanupCall(), 1000);
      }
    },
    [cleanupCall]
  );

  // End a call
  const endCall = useCallback(
    (callId: string) => {
      const currentCall = stateRef.current.call;
      const currentUser = userRef.current;

      if (!socketRef.current || !currentUser) {
        console.warn("❌ Cannot end call: missing requirements");
        cleanupCall();
        return;
      }

      const recipientId =
        currentCall.caller?.id === currentUser.id
          ? currentCall.callee?.id
          : currentCall.caller?.id;

      const recipientPhone =
        currentCall.caller?.id === currentUser.id
          ? currentCall.callee?.phoneNumber
          : currentCall.caller?.phoneNumber;

      if (recipientId) {
        console.log("🔚 Ending call:", callId);

        socketRef.current.emit("end-call", {
          callId,
          to: recipientId,
          toPhone: recipientPhone,
          from: currentUser.id,
        });
      }

      dispatch({ type: "SET_CALL_STATUS", payload: "ended" });
      setTimeout(() => cleanupCall(), 2000);
    },
    [cleanupCall]
  );

  // Send ICE candidate (kept as is but improved)
  const sendIceCandidate = useCallback((candidate: RTCIceCandidate) => {
    const currentCall = stateRef.current.call;
    const currentUser = userRef.current;

    if (socketRef.current && currentUser) {
      const recipientId =
        currentCall.caller?.id === currentUser.id
          ? currentCall.callee?.id
          : currentCall.caller?.id;

      if (recipientId) {
        socketRef.current.emit("ice-candidate", {
          to: recipientId,
          candidate,
          callId: currentCall.callId,
        });
      }
    }
  }, []);

  // Socket.IO event handlers for calls
  useEffect(() => {
    if (!socketRef.current || !isAuthenticated) return;

    const socket = socketRef.current;

    socket.on("incoming-call", async (data) => {
      console.log("📞 Received incoming call:", data);
      const { callId, from, fromName, fromPhone, callType, offer } = data;

      // Find caller in contacts
      const caller = stateRef.current.contacts.find(
        (c) => c.id === from || c.phoneNumber === fromPhone
      );

      try {
        const pc = createPeerConnection();

        // Store the peer connection immediately
        dispatch({ type: "SET_PEER_CONNECTION", payload: pc });

        // CRITICAL: Set remote offer first
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        console.log("📥 Set remote offer, signaling state:", pc.signalingState);

        // Log the offer details for debugging
        console.log("🔍 Offer details:", {
          type: offer.type,
          hasAudio: offer.sdp.includes("m=audio"),
          hasVideo: offer.sdp.includes("m=video"),
          callType,
        });

        // Process any ICE candidates received before remote description was set
        await processQueuedIceCandidates(pc);

        // Store call info
        dispatch({
          type: "SET_CALLER",
          payload: caller || {
            id: from,
            displayName: fromName,
            phoneNumber: fromPhone || from,
            isOnline: false,
            lastSeen: new Date(),
          },
        });

        dispatch({
          type: "SET_CALL",
          payload: { callId, callType, status: "ringing" },
        });

        console.log("📞 Incoming call processed successfully");
      } catch (error) {
        console.error("❌ Failed to handle incoming call:", error);
        socket.emit("call-error", {
          callId,
          to: from,
          message: "Failed to process incoming call",
        });
      }
    });

    socket.on("call-accepted", async (data) => {
      console.log("✅ Call accepted:", data);
      const { callId, answer } = data;
      const currentCall = stateRef.current.call;

      if (currentCall.peerConnection && currentCall.callId === callId) {
        try {
          await currentCall.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );

          console.log("📥 Set remote answer from callee");

          // Now process queued candidates for the caller
          await processQueuedIceCandidates(currentCall.peerConnection);

          dispatch({ type: "SET_CALL_STATUS", payload: "connected" });
          console.log("🔗 Call connected successfully");

          // Clear timeout
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
        } catch (error) {
          console.error("❌ Failed to set remote answer:", error);
          cleanupCall();
        }
      }
    });

    socket.on("call-declined", (data) => {
      console.log("❌ Call declined:", data);
      const { callId } = data;
      const currentCall = stateRef.current.call;

      if (currentCall.callId === callId) {
        dispatch({ type: "SET_CALL_STATUS", payload: "declined" });
        setTimeout(() => cleanupCall(), 2000);
      }
    });

    socket.on("call-ended", (data) => {
      console.log("🔚 Call ended:", data);
      const { callId } = data;
      const currentCall = stateRef.current.call;

      if (currentCall.callId === callId) {
        dispatch({ type: "SET_CALL_STATUS", payload: "ended" });
        setTimeout(() => cleanupCall(), 2000);
      }
    });

    socket.on("call-timeout", (data) => {
      console.log("⏰ Call timeout:", data);
      const { callId } = data;
      const currentCall = stateRef.current.call;

      if (currentCall.callId === callId) {
        dispatch({ type: "SET_CALL_STATUS", payload: "timeout" });
        setTimeout(() => cleanupCall(), 2000);
      }
    });

    socket.on("ice-candidate", (data) => {
      console.log("🧊 Received ICE candidate");
      const { candidate } = data;
      const currentCall = stateRef.current.call;

      if (!candidate) return;

      if (
        currentCall.peerConnection &&
        currentCall.peerConnection.remoteDescription &&
        currentCall.peerConnection.remoteDescription.type
      ) {
        // Safe to add
        currentCall.peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .then(() => console.log("✅ ICE candidate added successfully"))
          .catch((err) =>
            console.error("❌ Failed to add ICE candidate:", err)
          );
      } else {
        // Queue for later
        console.log("📥 Queuing ICE candidate until remoteDescription is set");
        iceCandidateQueueRef.current.push(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call-error", (data) => {
      console.error("❌ Call error:", data);
      cleanupCall();
    });

    // socket.on("missed-call", (data) => {
    //   const { callId, from, callType } = data;
    //   const caller = state.contacts.find((c) => c.id === from);
    //   if (caller) {
    //     dispatch({
    //       type: "SET_CALLER",
    //       payload: caller,
    //     });
    //     dispatch({
    //       type: "SET_CALL",
    //       payload: { callId, callType, status: "missed" },
    //     });
    //     cleanupCall();
    //   }
    // });

    return () => {
      socket.off("incoming-call");
      socket.off("call-accepted");
      socket.off("call-declined");
      socket.off("call-ended");
      socket.off("call-timeout");
      socket.off("ice-candidate");
      socket.off("call-error");
    };
  }, [
    isAuthenticated,
    state.call.peerConnection,
    state.call.callId,
    acceptCall,
    cleanupCall,
    createPeerConnection,
    state.contacts,
  ]);

  //call timeout logic
  useEffect(() => {
    if (
      state.call.status === "ringing" &&
      state.call.callId &&
      socketRef.current
    ) {
      const timeout = setTimeout(() => {
        dispatch({
          type: "SET_CALL",
          payload: {
            callId: state.call.callId!,
            callType: state.call.callType!,
            status: "missed",
          },
        });
        socketRef.current?.emit("call-timeout", { callId: state.call.callId });
        cleanupCall();
      }, 30000); // 30 seconds
      return () => clearTimeout(timeout);
    }
  }, [state.call.status, state.call.callId, state.call.callType, cleanupCall]);

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

    console.log("Incoming message data:", msgData);

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
      type: data.type || msgData.type || "text", // Check data.type first, then msgData.type
      status: msgData.seen ? "read" : msgData.delivered ? "delivered" : "sent",
      mediaUrl: data.mediaUrl || msgData.path || msgData.mediaUrl,
      fileName: data.fileName || msgData.fileName,
      fileSize: data.fileSize || msgData.fileSize,
      duration: data.duration || msgData.duration,
    };

    console.log("Incoming message:", message);

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
      console.log("📡 Received user status change:", data);
      dispatch({
        type: "UPDATE_USER_STATUS",
        payload: {
          ...data,
          lastSeen: new Date(data.lastSeen), // Ensure lastSeen is a proper Date object
        },
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

  const deleteContact = useCallback(async (contactId: string) => {
    try {
      const res = await api.post("/api/user/delete-contact", {
        contactId: contactId,
      });
      console.log("✅ Contact deleted:", res.data);

      // Update local state to remove the contact
      dispatch({ type: "DELETE_CONTACT", payload: contactId });

      // If the deleted contact was the active chat, close it
      const currentState = stateRef.current;
      if (currentState.activeChat?.id === contactId) {
        dispatch({ type: "SET_ACTIVE_CHAT", payload: null });
      }

      return res.data;
    } catch (error) {
      console.error("Failed to delete contact:", error);
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
        dispatch({ type: "RESET_CALL" });
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
              isBlocked: contact.blocked, // Include isBlocked status
              isPinned: contact.pinned, // Include isPinned status
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
                    isBlocked: contact.blocked,
                    isPinned: contact.pinned,
                  },
                ]
              : []),
          ],
          messages: [], // Start with empty messages
          isGroup: false,
          unreadCount: 0,
          isPinned: contact.pinned,
          isMuted: false,
        })
      );

      console.log("Transformed chats from contacts:", chatsFromContacts);
      dispatch({ type: "SET_CHATS", payload: chatsFromContacts });

      // Fetch last message for each chat to populate previews
      const chatsWithLastMessages = await Promise.all(
        chatsFromContacts.map(async (chat) => {
          try {
            const otherUser = chat.participants.find(
              (p) => p.id !== userRef.current?.id
            );
            if (!otherUser) return chat;

            const response = await api.get(
              `/api/chats/${otherUser.id}/messages`
            );
            const messages = response.data.messages || [];

            if (messages.length > 0) {
              const lastMessage = messages[messages.length - 1];
              const mappedLastMessage = {
                id: lastMessage._id,
                senderId: lastMessage.from,
                receiverId: lastMessage.to,
                content: lastMessage.content,
                timestamp: new Date(lastMessage.timestamp),
                type: lastMessage.type || "text",
                status: lastMessage.delivered ? "delivered" : "sent",
                mediaUrl: lastMessage.mediaUrl,
                fileName: lastMessage.fileName,
                fileSize: lastMessage.fileSize,
                duration: lastMessage.duration || 0,
              };

              return { ...chat, lastMessage: mappedLastMessage };
            }
            return chat;
          } catch (error) {
            console.error(
              `Failed to fetch last message for chat ${chat.id}:`,
              error
            );
            return chat;
          }
        })
      );

      console.log("Chats with last messages:", chatsWithLastMessages);
      dispatch({ type: "SET_CHATS", payload: chatsWithLastMessages });

      // Also set contacts separately for status updates
      const contactsList = res.data.contacts.map((contact: any) => ({
        id: contact.user.toString(),
        displayName: contact.name,
        phoneNumber: contact.phonenumber,
        avatarUrl: contact.avatarUrl,
        isOnline: contact.isOnline || false,
        lastSeen: contact.lastSeen ? new Date(contact.lastSeen) : undefined,
      }));

      dispatch({ type: "ADD_CONTACT", payload: contactsList });
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
        type: msg.type || "text", // Default to text if type is not provided
        mediaUrl: msg.path || null, // Handle media URL if available
        status: msg.seen ? "read" : msg.delivered ? "delivered" : "sent",
        isBlocked: msg.blocked, // Add isBlocked field if available
        isPinned: msg.pinned, // Add isPinned field if available
        duration: msg.duration || 0, // Add duration field if available
      }));

      console.log("Mapped messages:", mappedMessages);

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

  const sendAudioMessage = useCallback(
    async (audioBlob: Blob, duration: number) => {
      const currentState = stateRef.current;
      const currentUser = userRef.current;

      if (
        !currentState.activeChat ||
        !currentUser ||
        !socketRef.current ||
        !isConnected
      ) {
        console.warn("Cannot send audio message: missing requirements");
        return;
      }

      try {
        // Create FormData for file upload
        const formData = new FormData();
        const audioFile = new File([audioBlob], `audio_${Date.now()}.webm`, {
          type: audioBlob.type,
        });

        formData.append("audio", audioFile);
        formData.append("duration", duration.toString());
        formData.append("receiverId", currentState.activeChat.id);

        // Upload audio file to server
        const uploadResponse = await api.post("/api/upload/audio", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        const { audioUrl, fileName, fileSize } = uploadResponse.data;

        // Create message with audio metadata
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

        // Add message to local state immediately
        dispatch({ type: "SEND_MESSAGE", payload: message });

        // Send via socket
        const recipientPhone = currentState.activeChat.participants.find(
          (p) => p.id !== currentUser.id
        )?.phoneNumber;

        if (recipientPhone) {
          console.log("📤 Sending audio message to:", recipientPhone);
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
      } catch (error) {
        console.error("Failed to send audio message:", error);
        throw error;
      }
    },
    [isConnected]
  );

  const sendMediaMessage = useCallback(
    async (file: File, mediaType: "image" | "video") => {
      const currentState = stateRef.current;
      const currentUser = userRef.current;

      if (
        !currentState.activeChat ||
        !currentUser ||
        !socketRef.current ||
        !isConnected
      ) {
        console.warn("Cannot send media message: missing requirements");
        return;
      }

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append(mediaType, file);
        formData.append("receiverId", currentState.activeChat.id);

        // Upload media file to server
        const uploadEndpoint = `/api/upload/${mediaType}`;
        const uploadResponse = await api.post(uploadEndpoint, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        console.log("Media upload response:", uploadResponse.data);

        const { imageUrl, videoUrl, fileName, fileSize } = uploadResponse.data;

        const mediaUrl = imageUrl || videoUrl;

        // Create message with media metadata
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

        console.log("Media message created:", message);

        // Add message to local state immediately
        dispatch({ type: "SEND_MESSAGE", payload: message });

        // Send via socket
        const recipientPhone = currentState.activeChat.participants.find(
          (p) => p.id !== currentUser.id
        )?.phoneNumber;

        if (recipientPhone) {
          console.log(`📤 Sending ${mediaType} message to:`, recipientPhone);
          socketRef.current.emit("one_to_one_message", {
            to: recipientPhone,
            message: message.content,
            timestamp: message.timestamp.toISOString(),
            type: mediaType,
            mediaUrl,
            fileName,
            fileSize,
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
      } catch (error) {
        console.error(`Failed to send ${mediaType} message:`, error);
        throw error;
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

  const pinChat = useCallback(async (chatId: string) => {
    const res = await api.post("/api/user/pin-contact", { contactId: chatId });
    console.log("📌 Pinning chat:", res);
    dispatch({ type: "PIN_CHAT", payload: chatId });
  }, []);

  const unpinChat = useCallback(async (chatId: string) => {
    const res = await api.post("/api/user/unpin-contact", {
      contactId: chatId,
    });
    console.log("📌 Unpinning chat:", res);
    dispatch({ type: "UNPIN_CHAT", payload: chatId });
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
        sendAudioMessage,
        sendMediaMessage,
        markAsRead,
        addContact,
        setSearchQuery,
        createGroupChat,
        addUserToGroup,
        removeUserFromGroup,
        pinChat,
        unpinChat,
        muteChat,
        sendContactRequest,
        acceptContactRequest,
        rejectContactRequest,
        startTyping,
        stopTyping,
        isConnected,
        blockContact,
        unblockContact,
        deleteContact,
        initiateCall,
        acceptCall,
        declineCall,
        endCall,
        sendIceCandidate,
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
