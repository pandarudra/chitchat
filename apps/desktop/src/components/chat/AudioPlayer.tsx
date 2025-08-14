import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

const be_url = import.meta.env.VITE_BE_URL;

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  isOwn?: boolean;
}

export function AudioPlayer({
  audioUrl,
  duration,
  isOwn = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Construct full URL if audioUrl is a relative path
  const fullAudioUrl = audioUrl.startsWith("http")
    ? audioUrl
    : `${be_url}${audioUrl}`;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      } else if (duration && duration > 0) {
        setAudioDuration(duration);
      }
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
      console.error("Error loading audio:", fullAudioUrl);
    };

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [fullAudioUrl, duration]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || safeAudioDuration === 0) return;

    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const progressWidth = rect.width;
    const clickProgress = clickX / progressWidth;

    const newTime = clickProgress * safeAudioDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time) || time < 0) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const safeAudioDuration =
    audioDuration && isFinite(audioDuration) && audioDuration > 0
      ? audioDuration
      : 0;
  const progressPercentage =
    safeAudioDuration > 0 ? (currentTime / safeAudioDuration) * 100 : 0;

  const buttonColorClass = isOwn
    ? "text-green-100 hover:text-white hover:bg-green-600"
    : "text-gray-600 hover:text-gray-800 hover:bg-gray-100";

  const progressBarColorClass = isOwn ? "bg-green-600" : "bg-green-500";

  const timeColorClass = isOwn ? "text-green-100" : "text-gray-500";

  if (hasError) {
    return (
      <div className="flex items-center space-x-3 min-w-0">
        <div className={`p-2 rounded-full bg-red-500 text-white`}>
          <Volume2 className="h-4 w-4" />
        </div>
        <span className={`text-xs ${timeColorClass}`}>
          Audio failed to load
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3 min-w-0">
      <audio ref={audioRef} src={fullAudioUrl} preload="metadata" />

      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`p-2 rounded-full transition-colors ${buttonColorClass} ${
          isLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {isLoading ? (
          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <Volume2 className={`h-3 w-3 ${timeColorClass}`} />
          <div
            className="flex-1 h-2 bg-gray-300 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div
              className={`h-2 ${progressBarColorClass} rounded-full transition-all duration-150`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className={`flex justify-between text-xs mt-1 ${timeColorClass}`}>
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(safeAudioDuration)}</span>
        </div>
      </div>
    </div>
  );
}
