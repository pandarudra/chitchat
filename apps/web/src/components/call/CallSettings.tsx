/** Settings panel (slide-in) shown during an active call. */

import { Maximize2, Minimize2, Monitor, Video, VideoOff, Mic, MicOff, PhoneOff } from "lucide-react";

interface CallSettingsProps {
  callType: "audio" | "video" | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isFullscreen: boolean;
  videoLayout: "remote-main" | "local-main";
  callDuration: string;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onToggleLayout: () => void;
  onToggleFullscreen: () => void;
  onClose: () => void;
  onEndCall: () => void;
}

export function CallSettings({
  callType,
  isAudioEnabled,
  isVideoEnabled,
  isFullscreen,
  videoLayout,
  callDuration,
  onToggleAudio,
  onToggleVideo,
  onToggleLayout,
  onToggleFullscreen,
  onClose,
  onEndCall,
}: CallSettingsProps) {
  return (
    <div className="absolute top-16 right-4 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 min-w-64 z-20 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-white">Call Settings</h4>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center text-gray-300 text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Connection info */}
      <div className="space-y-2 text-sm mb-4">
        <Row label="Call Type" value={<span className="text-blue-400 capitalize">{callType}</span>} />
        <Row label="Quality" value={<span className="text-green-400">HD Ready</span>} />
        <Row
          label="Connection"
          value={
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400">Stable</span>
            </div>
          }
        />
        <Row label="Duration" value={<span className="text-white font-mono">{callDuration}</span>} />
        {callType === "video" && (
          <Row
            label="Main Video"
            value={<span className="text-purple-400">{videoLayout === "remote-main" ? "Their Camera" : "Your Camera"}</span>}
          />
        )}
      </div>

      {/* Media controls */}
      <div className="border-t border-gray-700 pt-3 mb-4">
        <h5 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Media Controls</h5>
        <div className="space-y-2">
          <Row
            label={<span className="text-gray-300 text-sm">Microphone</span>}
            value={
              <ToggleBtn active={isAudioEnabled} onClick={onToggleAudio}>
                {isAudioEnabled ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
              </ToggleBtn>
            }
          />
          {callType === "video" && (
            <>
              <Row
                label={<span className="text-gray-300 text-sm">Camera</span>}
                value={
                  <ToggleBtn active={isVideoEnabled} onClick={onToggleVideo}>
                    {isVideoEnabled ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
                  </ToggleBtn>
                }
              />
              <Row
                label={<span className="text-gray-300 text-sm">Video Layout</span>}
                value={
                  <button
                    onClick={onToggleLayout}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
                    title="Switch video layout (T)"
                  >
                    <Monitor className="w-3 h-3" />
                  </button>
                }
              />
            </>
          )}
        </div>
      </div>

      {/* Technical info */}
      <div className="border-t border-gray-700 pt-3 mb-4">
        <h5 className="text-xs text-gray-400 uppercase tracking-wide mb-2">Technical Info</h5>
        <div className="space-y-1 text-xs">
          <Row label={<span className="text-gray-400">Protocol</span>} value={<span className="text-gray-300">WebRTC</span>} />
          <Row label={<span className="text-gray-400">Codec</span>} value={<span className="text-gray-300">{callType === "video" ? "VP8/Opus" : "Opus"}</span>} />
          <Row label={<span className="text-gray-400">Encryption</span>} value={<span className="text-green-400">DTLS-SRTP</span>} />
          <Row label={<span className="text-gray-400">NAT Type</span>} value={<span className="text-gray-300">STUN</span>} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="border-t border-gray-700 pt-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onToggleFullscreen}
            className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm"
          >
            {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            <span>{isFullscreen ? "Exit" : "Fullscreen"}</span>
          </button>
          <button
            onClick={onEndCall}
            className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-sm"
          >
            <PhoneOff className="w-3 h-3" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors text-white ${
        active ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
      }`}
    >
      {children}
    </button>
  );
}
