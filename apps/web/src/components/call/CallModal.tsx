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
import { Settings, Maximize2, Minimize2, User, VideoOff, PhoneOff, Phone } from "lucide-react";
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
      className={`fixed inset-0 bg-black/90 flex items-center justify-center z-[60] ${isFullscreen ? "p-0" : "p-0 sm:p-4"}`}
    >
      {/* Hidden audio element — ensures audio works in all cases */}
      <audio
        ref={hiddenRemoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />

      <div
        className={`bg-[#0b141a] text-white shadow-2xl overflow-hidden relative flex flex-col ${isFullscreen ? "w-full h-full" : "w-full h-full sm:h-[600px] sm:max-h-[90vh] sm:rounded-2xl sm:max-w-4xl"}`}
      >
        {/* Audio unlock banner */}
        {audioUnlockNeeded && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-600 text-white px-4 py-2 rounded-lg z-10">
            Click anywhere to enable audio
          </div>
        )}

        {/* ── Outgoing / Calling ───────────────────────────────────────── */}
        {call.status === "calling" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative h-full min-h-[60vh]">
            <div className="absolute inset-0 opacity-20 pointer-events-none blur-3xl scale-150 flex items-center justify-center">
              <img src={otherUser?.avatarUrl ?? undefined} className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <CallAvatar
                avatarUrl={otherUser?.avatarUrl}
                displayName={otherUser?.displayName}
                size="md"
              />
              <h2 className="text-2xl font-semibold mt-6 mb-1">{otherUser?.displayName}</h2>
              <p className="text-gray-400 text-sm">{otherUser?.email}</p>
              <p className="text-emerald-400 font-medium mt-4">Calling...</p>
            </div>
            <button
              onClick={() => call.callId && endCall(call.callId)}
              className="mt-16 w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-transform hover:scale-105 mx-auto relative z-10 shadow-lg"
            >
              <PhoneOff className="w-8 h-8 text-white" />
            </button>
          </div>
        )}

        {/* ── Incoming / Ringing ───────────────────────────────────────── */}
        {call.status === "ringing" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative h-full min-h-[60vh]">
            <div className="absolute inset-0 opacity-20 pointer-events-none blur-3xl scale-150 flex items-center justify-center">
              <img src={otherUser?.avatarUrl ?? undefined} className="w-full h-full object-cover" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <CallAvatar
                avatarUrl={otherUser?.avatarUrl}
                displayName={otherUser?.displayName}
                size="md"
                pulsing
              />
              <h2 className="text-2xl font-semibold mt-6 mb-1">{otherUser?.displayName}</h2>
              <p className="text-gray-400 text-sm">{otherUser?.email}</p>
              <p className="text-emerald-400 font-medium mt-4">WhatsApp {call.callType === "video" ? "Video" : "Voice"} Call</p>
            </div>

            <div className="flex items-center justify-center space-x-16 mt-16 relative z-10">
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => call.callId && declineCall(call.callId)}
                  className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-transform hover:scale-105 shadow-lg"
                  title="Decline call"
                >
                  <PhoneOff className="w-7 h-7 text-white" />
                </button>
              </div>
              <div className="flex flex-col items-center space-y-2">
                <button
                  onClick={() => call.callId && acceptCall(call.callId)}
                  className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-transform hover:scale-105 animate-pulse shadow-lg"
                  title="Accept call"
                >
                  <Phone className="w-7 h-7 text-white fill-white" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Connected ────────────────────────────────────────────────── */}
        {call.status === "connected" && (
          <div
            className={`relative flex flex-col flex-1`}
          >
            {/* Header (Only for Video Calls or when controls are shown) */}
            {call.callType === "video" && (
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
            )}

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
              <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden bg-[#0b141a]">
                <div className="absolute inset-0 opacity-10 pointer-events-none blur-3xl scale-150 flex items-center justify-center">
                  <img src={otherUser?.avatarUrl ?? undefined} className="w-full h-full object-cover" />
                </div>
                <div className="relative z-10 text-center flex flex-col items-center">
                  <CallAvatar
                    avatarUrl={otherUser?.avatarUrl}
                    displayName={otherUser?.displayName}
                    size="lg"
                  />
                  <h3 className="text-2xl font-semibold mt-6 mb-1">
                    {otherUser?.displayName}
                  </h3>
                  <p className="text-gray-400">{callDuration || "Connecting..."}</p>
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
