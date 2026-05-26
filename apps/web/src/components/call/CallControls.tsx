/** Controls bar rendered during an active call (mute, video, end, screen). */

import { PhoneOff, Video, VideoOff, Mic, MicOff, Monitor } from "lucide-react";

interface CallControlsProps {
  callId: string;
  callType: "audio" | "video" | null;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isFullscreen: boolean;
  showControls: boolean;
  onToggleAudio: () => void;
  onToggleVideo: () => void;
  onEndCall: (callId: string) => void;
}

export function CallControls({
  callId,
  callType,
  isAudioEnabled,
  isVideoEnabled,
  isFullscreen,
  showControls,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
}: CallControlsProps) {
  const containerClass = `absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
    isFullscreen && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"
  }`;

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-center space-x-6">
        {/* Microphone toggle */}
        <button
          onClick={onToggleAudio}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isAudioEnabled ? "bg-gray-600 hover:bg-gray-700" : "bg-red-500 hover:bg-red-600"
          }`}
          title={`${isAudioEnabled ? "Mute" : "Unmute"} microphone (M)`}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        {/* Camera toggle — video calls only */}
        {callType === "video" && (
          <button
            onClick={onToggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              isVideoEnabled ? "bg-gray-600 hover:bg-gray-700" : "bg-red-500 hover:bg-red-600"
            }`}
            title={`${isVideoEnabled ? "Turn off" : "Turn on"} camera (V)`}
          >
            {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>
        )}

        {/* End call */}
        <button
          onClick={() => onEndCall(callId)}
          className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
          title="End call (Ctrl+Q)"
        >
          <PhoneOff className="w-6 h-6" />
        </button>

        {/* Screen share — placeholder */}
        <button
          disabled
          className="w-12 h-12 rounded-full bg-gray-600/50 flex items-center justify-center opacity-50 cursor-not-allowed"
          title="Screen share (Coming soon)"
        >
          <Monitor className="w-5 h-5" />
        </button>
      </div>

      {isFullscreen && showControls && (
        <div className="absolute bottom-2 left-4 text-xs text-gray-400">
          <p>M: Mute • V: Video • F: Fullscreen • S: Settings • Esc: Exit</p>
        </div>
      )}
    </div>
  );
}
