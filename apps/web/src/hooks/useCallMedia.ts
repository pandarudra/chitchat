/**
 * useCallMedia — manages local/remote stream attachment to video/audio elements
 * and handles the "click to enable audio" unlock flow for browsers that require
 * a user gesture before playing audio.
 */

import { useEffect, useState, useCallback } from "react";
import type { RefObject } from "react";
import type { CallState } from "../types/call";

interface UseCallMediaProps {
  call: Pick<CallState, "status" | "localStream" | "remoteStream" | "callType">;
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  localAudioRef: RefObject<HTMLAudioElement | null>;
  hiddenRemoteAudioRef: RefObject<HTMLAudioElement | null>;
}

export function useCallMedia({
  call,
  localVideoRef,
  remoteVideoRef,
  localAudioRef,
  hiddenRemoteAudioRef,
}: UseCallMediaProps) {
  const [audioUnlockNeeded, setAudioUnlockNeeded] = useState(false);

  // ── Stream attachment ──────────────────────────────────────────────────────

  useEffect(() => {
    if (call.status !== "connected") return;

    async function setupStreams() {
      // Local video
      if (localVideoRef.current && call.localStream) {
        localVideoRef.current.srcObject = call.localStream;
        await localVideoRef.current.play().catch(() => {});
      }

      // Local audio (muted to prevent echo)
      if (localAudioRef.current && call.localStream) {
        localAudioRef.current.srcObject = call.localStream;
        localAudioRef.current.muted = true;
      }

      if (!call.remoteStream) return;

      // Remote video (for video calls)
      if (remoteVideoRef.current && call.callType === "video") {
        remoteVideoRef.current.srcObject = call.remoteStream;
        remoteVideoRef.current.muted = false;
        await remoteVideoRef.current.play().catch(() => {});
      }

      // Hidden audio element — covers audio calls and acts as fallback
      if (hiddenRemoteAudioRef.current) {
        hiddenRemoteAudioRef.current.srcObject = call.remoteStream;
        hiddenRemoteAudioRef.current.muted = false;
        try {
          await hiddenRemoteAudioRef.current.play();
        } catch {
          setAudioUnlockNeeded(true);
        }
      }
    }

    setupStreams();
  }, [
    call.status,
    call.localStream,
    call.remoteStream,
    call.callType,
    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    hiddenRemoteAudioRef,
  ]);

  // ── Track state sync ───────────────────────────────────────────────────────

  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    if (!call.localStream) return;
    const videoTrack = call.localStream.getVideoTracks()[0];
    const audioTrack = call.localStream.getAudioTracks()[0];
    if (videoTrack) setIsVideoEnabled(videoTrack.enabled);
    if (audioTrack) setIsAudioEnabled(audioTrack.enabled);
  }, [call.localStream]);

  // ── Controls ──────────────────────────────────────────────────────────────

  const toggleVideo = useCallback(() => {
    if (!call.localStream) return;
    const tracks = call.localStream.getVideoTracks();
    const next = !isVideoEnabled;
    tracks.forEach((track) => (track.enabled = next));
    setIsVideoEnabled(next);
  }, [call.localStream, isVideoEnabled]);

  const toggleAudio = useCallback(() => {
    if (!call.localStream) return;
    const tracks = call.localStream.getAudioTracks();
    const next = !isAudioEnabled;
    tracks.forEach((track) => (track.enabled = next));
    setIsAudioEnabled(next);
  }, [call.localStream, isAudioEnabled]);

  // ── Audio unlock on user click ────────────────────────────────────────────

  const unlockAudio = useCallback(async () => {
    const elements = [
      remoteVideoRef.current,
      hiddenRemoteAudioRef.current,
    ].filter(Boolean) as (HTMLVideoElement | HTMLAudioElement)[];

    for (const el of elements) {
      await el.play().catch(() => {});
    }
    setAudioUnlockNeeded(false);
  }, [remoteVideoRef, hiddenRemoteAudioRef]);

  useEffect(() => {
    if (!audioUnlockNeeded) return;
    document.addEventListener("click", unlockAudio, { once: true });
    return () => document.removeEventListener("click", unlockAudio);
  }, [audioUnlockNeeded, unlockAudio]);

  return {
    isVideoEnabled,
    isAudioEnabled,
    audioUnlockNeeded,
    toggleVideo,
    toggleAudio,
    clearAudioError: () => setAudioUnlockNeeded(false),
  };
}
