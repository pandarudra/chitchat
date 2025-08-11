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
      <div className="flex items-center space-x-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
        <MicOff className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-600">{error}</span>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center space-x-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <Mic className="h-4 w-4 text-red-500" />
        </div>
        <span className="text-sm font-mono text-red-600">
          {formatTime(recordingTime)}
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={onCancel}
            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            title="Cancel recording"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={onStop}
            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Stop recording"
          >
            <MicOff className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  if (hasRecording) {
    return (
      <div className="flex items-center space-x-3 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <Mic className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">
            Voice message ({formatTime(recordingTime)})
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={onCancel}
            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
            title="Delete recording"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={onSend}
            className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
            title="Send voice message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
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
