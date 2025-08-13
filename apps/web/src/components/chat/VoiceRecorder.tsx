import { Mic, MicOff, Send, X } from "lucide-react";

interface VoiceRecorderProps {
  isRecording: boolean;
  recordingTime: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  onSend: () => void;
  hasRecording: boolean;
  error?: string | null;
}

export function VoiceRecorder({
  isRecording,
  recordingTime,
  onStart,
  onStop,
  onCancel,
  onSend,
  hasRecording,
  error,
}: VoiceRecorderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (error) {
    return (
      <button
        onClick={onStart}
        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        title={error}
      >
        <MicOff className="h-5 w-5" />
      </button>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center space-x-2">
        {/* Timer display */}
        <span className="text-xs font-mono text-red-600 bg-red-50 px-2 py-1 rounded-full">
          {formatTime(recordingTime)}
        </span>

        {/* Recording button with animation */}
        <button
          onClick={onStop}
          className="relative p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors animate-pulse"
          title="Stop recording"
        >
          <Mic className="h-5 w-5" />
          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
        </button>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Cancel"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (hasRecording) {
    return (
      <div className="flex items-center space-x-2">
        {/* Duration display */}
        <span className="text-xs font-mono text-green-600 bg-green-50 px-2 py-1 rounded-full">
          {formatTime(recordingTime)}
        </span>

        {/* Send button */}
        <button
          onClick={onSend}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          title="Send voice message"
        >
          <Send className="h-5 w-5" />
        </button>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onStart}
      className="p-2 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
      title="Record voice message"
    >
      <Mic className="h-5 w-5" />
    </button>
  );
}
