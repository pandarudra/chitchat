/**
 * useCall — WebRTC call management hook.
 *
 * Encapsulates all peer connection lifecycle logic so ChatContext stays focused
 * on messaging and chat state. This hook:
 *  - Creates and configures RTCPeerConnection with STUN/TURN servers
 *  - Manages the ICE candidate queue (candidates arriving before remote desc is set)
 *  - Handles initiateCall, acceptCall, declineCall, endCall flows
 *  - Registers socket event listeners for incoming call signalling
 *  - Cleans up media streams and peer connections on call end
 */

import { useCallback, useRef, useEffect } from "react";
import { Socket } from "socket.io-client";
import type { User } from "../types/user";
import type { ChatState } from "../types/chat";
import type { ChatAction } from "../context/chat/chatReducer";

// ICE server configuration — Google STUN + reliable free TURN relays
const RTC_CONFIGURATION: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
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
  iceCandidatePoolSize: 10,
  iceTransportPolicy: "all",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
};

interface UseCallProps {
  socketRef: React.MutableRefObject<Socket | null>;
  isConnected: boolean;
  stateRef: React.MutableRefObject<ChatState>;
  userRef: React.MutableRefObject<User | null>;
  dispatch: React.Dispatch<ChatAction>;
  isAuthenticated: boolean;
}

export function useCall({
  socketRef,
  isConnected,
  stateRef,
  userRef,
  dispatch,
  isAuthenticated,
}: UseCallProps) {
  const iceCandidateQueueRef = useRef<RTCIceCandidate[]>([]);
  const callTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Resource cleanup ───────────────────────────────────────────────────────

  const cleanupCall = useCallback(() => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    iceCandidateQueueRef.current = [];

    const { call } = stateRef.current;

    call.peerConnection?.close();

    call.localStream?.getTracks().forEach((track) => track.stop());

    dispatch({ type: "RESET_CALL" });
  }, [dispatch, stateRef]);

  // ── ICE candidate queue ───────────────────────────────────────────────────

  const processQueuedIceCandidates = useCallback(
    async (pc: RTCPeerConnection) => {
      for (const candidate of iceCandidateQueueRef.current) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          // Non-fatal — log and continue
        }
      }
      iceCandidateQueueRef.current = [];
    },
    [],
  );

  // ── Peer connection factory ────────────────────────────────────────────────

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection(RTC_CONFIGURATION);

    // Forward local ICE candidates to the remote peer
    pc.onicecandidate = (event) => {
      if (!event.candidate || !socketRef.current) return;

      const { call } = stateRef.current;
      const recipientId =
        call.caller?.id === userRef.current?.id
          ? call.callee?.id
          : call.caller?.id;

      if (recipientId) {
        socketRef.current.emit("ice-candidate", {
          to: recipientId,
          candidate: event.candidate,
          callId: call.callId,
        });
      }
    };

    pc.ontrack = (event) => {
      if (event.streams[0]) {
        dispatch({ type: "SET_REMOTE_STREAM", payload: event.streams[0] });
      }
    };

    pc.onconnectionstatechange = () => {
      if (
        pc.connectionState === "failed" ||
        pc.connectionState === "disconnected"
      ) {
        cleanupCall();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        pc.restartIce?.();
      } else if (pc.iceConnectionState === "closed") {
        cleanupCall();
      } else if (pc.iceConnectionState === "disconnected") {
        // Give 10 s for ICE to recover before tearing down
        setTimeout(() => {
          if (pc.iceConnectionState === "disconnected") cleanupCall();
        }, 10_000);
      }
    };

    return pc;
  }, [cleanupCall, dispatch, socketRef, stateRef, userRef]);

  // ── Outgoing call ──────────────────────────────────────────────────────────

  const initiateCall = useCallback(
    async (callee: User, callType: "audio" | "video") => {
      if (!socketRef.current || !isConnected || !userRef.current) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === "video",
        });
        dispatch({ type: "SET_LOCAL_STREAM", payload: stream });

        const pc = createPeerConnection();
        dispatch({ type: "SET_PEER_CONNECTION", payload: pc });

        // Audio tracks first, then video
        stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));
        if (callType === "video") {
          stream.getVideoTracks().forEach((t) => pc.addTrack(t, stream));
        }

        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: callType === "video",
        });
        await pc.setLocalDescription(offer);
        await processQueuedIceCandidates(pc);

        const callId = `call_${Date.now()}_${userRef.current.id}_${callee.id}`;

        dispatch({
          type: "INITIATE_CALL",
          payload: { callId, callee, callType, user: userRef.current },
        });

        socketRef.current.emit("call-user", {
          to: callee.id,
          toPhone: callee.email,
          callId,
          offer,
          callType,
          from: userRef.current.id,
          fromName: userRef.current.displayName,
          fromPhone: userRef.current.email,
        });

        // Auto-timeout if callee doesn't answer in 30 s
        callTimeoutRef.current = setTimeout(() => {
          if (stateRef.current.call.status === "calling") {
            dispatch({ type: "SET_CALL_STATUS", payload: "timeout" });
            socketRef.current?.emit("call-timeout", { callId, to: callee.id });
            setTimeout(() => cleanupCall(), 2_000);
          }
        }, 30_000);
      } catch {
        cleanupCall();
      }
    },
    [
      isConnected,
      createPeerConnection,
      cleanupCall,
      processQueuedIceCandidates,
      dispatch,
      socketRef,
      stateRef,
      userRef,
    ],
  );

  // ── Accept incoming call ───────────────────────────────────────────────────

  const acceptCall = useCallback(
    async (callId: string) => {
      const { call } = stateRef.current;
      const currentUser = userRef.current;

      if (
        !socketRef.current ||
        !call.peerConnection ||
        !call.caller ||
        !currentUser
      )
        return;

      try {
        const pc = call.peerConnection;

        if (pc.signalingState !== "have-remote-offer") {
          cleanupCall();
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video:
            call.callType === "video"
              ? {
                  width: { ideal: 640 },
                  height: { ideal: 480 },
                  frameRate: { ideal: 30 },
                }
              : false,
        });

        dispatch({ type: "SET_LOCAL_STREAM", payload: stream });

        stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));
        if (call.callType === "video") {
          stream.getVideoTracks().forEach((t) => pc.addTrack(t, stream));
        }

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socketRef.current.emit("accept-call", {
          callId,
          answer,
          to: call.caller.id,
          toPhone: call.caller.email,
          from: currentUser.id,
          fromPhone: currentUser.email,
        });

        dispatch({ type: "SET_CALL_STATUS", payload: "connected" });
      } catch {
        cleanupCall();
      }
    },
    [cleanupCall, dispatch, socketRef, stateRef, userRef],
  );

  // ── Decline call ──────────────────────────────────────────────────────────

  const declineCall = useCallback(
    (callId: string) => {
      const { call } = stateRef.current;
      const currentUser = userRef.current;

      if (socketRef.current && call.caller && currentUser) {
        socketRef.current.emit("decline-call", {
          callId,
          to: call.caller.id,
          toPhone: call.caller.email,
          from: currentUser.id,
        });
        dispatch({ type: "SET_CALL_STATUS", payload: "declined" });
        setTimeout(() => cleanupCall(), 1_000);
      }
    },
    [cleanupCall, dispatch, socketRef, stateRef, userRef],
  );

  // ── End call ──────────────────────────────────────────────────────────────

  const endCall = useCallback(
    (callId: string) => {
      const { call } = stateRef.current;
      const currentUser = userRef.current;

      if (!socketRef.current || !currentUser) {
        cleanupCall();
        return;
      }

      const recipientId =
        call.caller?.id === currentUser.id ? call.callee?.id : call.caller?.id;
      const recipientEmail =
        call.caller?.id === currentUser.id
          ? call.callee?.email
          : call.caller?.email;

      if (recipientId) {
        socketRef.current.emit("end-call", {
          callId,
          to: recipientId,
          toPhone: recipientEmail,
          from: currentUser.id,
        });
      }

      dispatch({ type: "SET_CALL_STATUS", payload: "ended" });
      setTimeout(() => cleanupCall(), 2_000);
    },
    [cleanupCall, dispatch, socketRef, stateRef, userRef],
  );

  // ── Send ICE candidate manually ───────────────────────────────────────────

  const sendIceCandidate = useCallback(
    (candidate: RTCIceCandidate) => {
      const { call } = stateRef.current;
      const currentUser = userRef.current;

      if (!socketRef.current || !currentUser) return;

      const recipientId =
        call.caller?.id === currentUser.id ? call.callee?.id : call.caller?.id;

      if (recipientId) {
        socketRef.current.emit("ice-candidate", {
          to: recipientId,
          candidate,
          callId: call.callId,
        });
      }
    },
    [socketRef, stateRef, userRef],
  );

  // ── Incoming call socket events ───────────────────────────────────────────

  useEffect(() => {
    if (!socketRef.current || !isAuthenticated) return;

    const socket = socketRef.current;

    socket.on("incoming-call", async (data) => {
      const { callId, from, fromName, fromPhone, callType, offer } = data;

      const caller = stateRef.current.contacts.find(
        (c) => c.id === from || c.email === fromPhone,
      );

      try {
        const pc = createPeerConnection();
        dispatch({ type: "SET_PEER_CONNECTION", payload: pc });

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        await processQueuedIceCandidates(pc);

        dispatch({
          type: "SET_CALLER",
          payload: caller ?? {
            id: from,
            displayName: fromName,
            email: fromPhone ?? from,
            isOnline: false,
            lastSeen: new Date(),
          },
        });

        dispatch({
          type: "SET_CALL",
          payload: { callId, callType, status: "ringing" },
        });
      } catch {
        socket.emit("call-error", {
          callId,
          to: from,
          message: "Failed to process incoming call.",
        });
      }
    });

    socket.on("call-accepted", async (data) => {
      const { callId, answer } = data;
      const { call } = stateRef.current;

      if (call.peerConnection && call.callId === callId) {
        try {
          await call.peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer),
          );
          await processQueuedIceCandidates(call.peerConnection);
          dispatch({ type: "SET_CALL_STATUS", payload: "connected" });
          if (callTimeoutRef.current) {
            clearTimeout(callTimeoutRef.current);
            callTimeoutRef.current = null;
          }
        } catch {
          cleanupCall();
        }
      }
    });

    socket.on("call-declined", ({ callId }) => {
      if (stateRef.current.call.callId === callId) {
        dispatch({ type: "SET_CALL_STATUS", payload: "declined" });
        setTimeout(() => cleanupCall(), 2_000);
      }
    });

    socket.on("call-ended", ({ callId }) => {
      if (stateRef.current.call.callId === callId) {
        dispatch({ type: "SET_CALL_STATUS", payload: "ended" });
        setTimeout(() => cleanupCall(), 2_000);
      }
    });

    socket.on("call-timeout", ({ callId }) => {
      if (stateRef.current.call.callId === callId) {
        dispatch({ type: "SET_CALL_STATUS", payload: "timeout" });
        setTimeout(() => cleanupCall(), 2_000);
      }
    });

    socket.on("ice-candidate", ({ candidate }) => {
      if (!candidate) return;
      const { call } = stateRef.current;

      if (call.peerConnection?.remoteDescription?.type) {
        call.peerConnection
          .addIceCandidate(new RTCIceCandidate(candidate))
          .catch(() => {});
      } else {
        iceCandidateQueueRef.current.push(new RTCIceCandidate(candidate));
      }
    });

    socket.on("call-error", () => cleanupCall());

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
    socketRef,
    stateRef,
    createPeerConnection,
    processQueuedIceCandidates,
    cleanupCall,
    dispatch,
  ]);

  // ── Ringing auto-timeout ──────────────────────────────────────────────────

  useEffect(() => {
    const { call } = stateRef.current;
    if (call.status !== "ringing" || !call.callId || !socketRef.current) return;

    const timeout = setTimeout(() => {
      const currentCall = stateRef.current.call;
      dispatch({
        type: "SET_CALL",
        payload: {
          callId: currentCall.callId!,
          callType: currentCall.callType!,
          status: "missed",
        },
      });
      socketRef.current?.emit("call-timeout", { callId: currentCall.callId });
      cleanupCall();
    }, 30_000);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateRef.current.call.status, stateRef.current.call.callId]);

  return {
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    sendIceCandidate,
    cleanupCall,
  };
}
