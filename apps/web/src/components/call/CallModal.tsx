/**
 * CallModal — orchestrates all call-phase UIs.
 *
 * Heavy logic lives in:
 *   - hooks/useCallMedia.ts   (stream attachment, track toggles, audio unlock)
 *   - hooks/useCallPip.ts     (picture-in-picture drag & resize)
 *   - hooks/useCallTimer.ts   (duration counter)
 *
 * Presentational sub-components:
 *   - CallAvatar.tsx     (user avatar with optional pulse)
 *   - CallControls.tsx   (mute / video / end-call bar)
 *   - CallSettings.tsx   (settings panel)
 */

import { useEffect, useState, useRef } from "react";
import { Settings, Maximize2, Minimize2, User, VideoOff } from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { CallAvatar } from "./CallAvatar";
import { CallControls } from "./CallControls";
import { CallSettings } from "./CallSettings";
import { useCallMedia } from "../../hooks/useCallMedia";
import { useCallPip } from "../../hooks/useCallPip";
import { useCallTimer } from "../../hooks/useCallTimer";

function CallModal() {
  const { call, endCall, acceptCall, declineCall } = useChat();
  const { user } = useAuth();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const hiddenRemoteAudioRef = useRef<HTMLAudioElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [videoLayout, setVideoLayout] = useState<"remote-main" | "local-main">(
    "remote-main",
  );
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────

  const {
    isVideoEnabled,
    isAudioEnabled,
    audioUnlockNeeded,
    toggleVideo,
    toggleAudio,
  } = useCallMedia({
    call,
    localVideoRef,
    remoteVideoRef,
    localAudioRef,
    hiddenRemoteAudioRef,
  });

  const {
    position: pipPos,
    size: pipSize,
    startDrag,
    startResize,
  } = useCallPip();

  const callDuration = useCallTimer(call.status === "connected");

  // ── Derived ────────────────────────────────────────────────────────────────

  const otherUser = call.caller?.id === user?.id ? call.callee : call.caller;

  // ── Auto-hide controls in fullscreen ──────────────────────────────────────

  useEffect(() => {
    if (call.status !== "connected" || !isFullscreen) {
      setShowControls(true);
      return;
    }

    const reset = () => {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(
        () => setShowControls(false),
        3_000,
      );
    };

    document.addEventListener("mousemove", reset);
    reset();

    return () => {
      document.removeEventListener("mousemove", reset);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [call.status, isFullscreen]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    if (call.status !== "connected") return;

    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case "m":
          e.preventDefault();
          toggleAudio();
          break;
        case "v":
          if (call.callType === "video") {
            e.preventDefault();
            toggleVideo();
          }
          break;
        case "f":
          e.preventDefault();
          setIsFullscreen((p) => !p);
          break;
        case "s":
          e.preventDefault();
          setShowSettings((p) => !p);
          break;
        case "t":
          if (call.callType === "video") {
            e.preventDefault();
            setVideoLayout((p) =>
              p === "remote-main" ? "local-main" : "remote-main",
            );
          }
          break;
        case "escape":
          e.preventDefault();
          if (isFullscreen) setIsFullscreen(false);
          else if (showSettings) setShowSettings(false);
          break;
        case "q":
          if ((e.ctrlKey || e.metaKey) && call.callId) {
            e.preventDefault();
            endCall(call.callId);
          }
          break;
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [
    call.status,
    call.callType,
    call.callId,
    isFullscreen,
    showSettings,
    toggleAudio,
    toggleVideo,
    endCall,
  ]);

  if (call.status === "idle") return null;

  const toggleVideoLayout = () =>
    setVideoLayout((p) => (p === "remote-main" ? "local-main" : "remote-main"));

  return (
    <div
      className={`fixed inset-0 bg-transparent bg-opacity-95 flex items-center justify-center z-[60] ${isFullscreen ? "p-0" : "p-4"}`}
    >
      {/* Hidden audio element — ensures audio works in all cases */}
      <audio
        ref={hiddenRemoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      <div
        className={`bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden ${isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-4xl"}`}
      >
        {/* Audio unlock banner */}
        {audioUnlockNeeded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-2 rounded-lg z-10">
            Click anywhere to enable audio
          </div>
        )}

        {/* ── Outgoing / Calling ───────────────────────────────────────── */}
        {call.status === "calling" && (
          <div className="p-8 text-center">
            <CallAvatar
              avatarUrl={otherUser?.avatarUrl}
              displayName={otherUser?.displayName}
              size="md"
            />
            <h2 className="text-2xl font-semibold mt-4 mb-2">Calling...</h2>
            <p className="text-xl text-gray-300">{otherUser?.displayName}</p>
            <p className="text-sm text-gray-400 mt-1">{otherUser?.email}</p>
            <button
              onClick={() => call.callId && endCall(call.callId)}
              className="mt-8 w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors mx-auto"
            >
              <span className="text-2xl">📵</span>
            </button>
          </div>
        )}

        {/* ── Incoming / Ringing ───────────────────────────────────────── */}
        {call.status === "ringing" && (
          <div className="p-8 text-center">
            <CallAvatar
              avatarUrl={otherUser?.avatarUrl}
              displayName={otherUser?.displayName}
              size="md"
              pulsing
            />
            <h2 className="text-2xl font-semibold mt-4 mb-2">
              Incoming {call.callType} call
            </h2>
            <p className="text-xl text-gray-300">{otherUser?.displayName}</p>
            <p className="text-sm text-gray-400 mt-1">{otherUser?.email}</p>

            <div className="flex items-center justify-center space-x-12 mt-8">
              <button
                onClick={() => call.callId && declineCall(call.callId)}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                title="Decline call"
              >
                <span className="text-2xl">📵</span>
              </button>
              <button
                onClick={() => call.callId && acceptCall(call.callId)}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors animate-pulse"
                title="Accept call"
              >
                <span className="text-2xl">📞</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Connected ────────────────────────────────────────────────── */}
        {call.status === "connected" && (
          <div
            className={`relative ${isFullscreen ? "h-screen" : "h-96"} flex flex-col`}
          >
            {/* Header */}
            <div
              className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10 transition-opacity duration-300 ${isFullscreen && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CallAvatar
                    avatarUrl={otherUser?.avatarUrl}
                    displayName={otherUser?.displayName}
                    size="sm"
                  />
                  <div>
                    <p className="font-medium">{otherUser?.displayName}</p>
                    <p className="text-sm text-gray-300">{callDuration}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsFullscreen((p) => !p)}
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    title={`${isFullscreen ? "Exit fullscreen" : "Fullscreen"} (F)`}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowSettings((p) => !p)}
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    title="Settings (S)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video / Audio content */}
            {call.callType === "video" ? (
              <div className="call-container flex-1 relative">
                {/* Main video */}
                <div
                  className="w-full h-full cursor-pointer"
                  onClick={toggleVideoLayout}
                  title="Switch videos (T)"
                >
                  {videoLayout === "remote-main" ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover bg-gray-800"
                    />
                  ) : isVideoEnabled && call.localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover bg-gray-800"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <VideoOff className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Picture-in-picture */}
                <div
                  className="pip-container absolute rounded-lg overflow-hidden bg-gray-800 border-2 border-white/20 cursor-grab hover:border-white/40 transition-colors z-10"
                  style={{
                    left: pipPos.x,
                    top: pipPos.y,
                    width: pipSize.width,
                    height: pipSize.height,
                  }}
                  onMouseDown={startDrag}
                  onTouchStart={startDrag}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleVideoLayout();
                  }}
                >
                  {videoLayout === "remote-main" ? (
                    isVideoEnabled && call.localStream ? (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <VideoOff className="w-4 h-4 text-gray-400" />
                      </div>
                    )
                  ) : call.remoteStream ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}

                  {/* Resize handle */}
                  <div
                    className="absolute bottom-0 right-0 w-4 h-4 bg-white/20 hover:bg-white/40 cursor-nw-resize z-30"
                    style={{ clipPath: "polygon(100% 0%, 0% 100%, 100% 100%)" }}
                    onMouseDown={startResize}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ) : (
              /* Audio call */
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <CallAvatar
                    avatarUrl={otherUser?.avatarUrl}
                    displayName={otherUser?.displayName}
                    size="md"
                  />
                  <h3 className="text-xl font-semibold mt-4 mb-2">
                    {otherUser?.displayName}
                  </h3>
                  <p className="text-gray-300">Audio call in progress</p>
                </div>
              </div>
            )}

            {/* Controls */}
            <CallControls
              callId={call.callId!}
              callType={call.callType}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isFullscreen={isFullscreen}
              showControls={showControls}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onEndCall={endCall}
            />

            {/* Settings panel */}
            {showSettings && (
              <CallSettings
                callType={call.callType}
                isAudioEnabled={isAudioEnabled}
                isVideoEnabled={isVideoEnabled}
                isFullscreen={isFullscreen}
                videoLayout={videoLayout}
                callDuration={callDuration}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onToggleLayout={toggleVideoLayout}
                onToggleFullscreen={() => setIsFullscreen((p) => !p)}
                onClose={() => setShowSettings(false)}
                onEndCall={() => call.callId && endCall(call.callId)}
              />
            )}
          </div>
        )}

        {/* ── End states ──────────────────────────────────────────────── */}
        {(call.status === "declined" ||
          call.status === "missed" ||
          call.status === "ended") && (
          <div className="p-8 text-center">
            <CallAvatar
              avatarUrl={otherUser?.avatarUrl}
              displayName={otherUser?.displayName}
              size="sm"
            />
            <h3 className="text-xl font-semibold text-gray-300 mt-4">
              {call.status === "declined" && "Call Declined"}
              {call.status === "missed" &&
                `Missed Call from ${otherUser?.displayName}`}
              {call.status === "ended" && "Call Ended"}
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallModal;
