import { useEffect, useRef } from "react";

export function useRingtone(isRinging: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio on first user interaction
  useEffect(() => {
    const initializeAudio = () => {
      const audio = audioRef.current;
      if (audio) {
        audio.load();
        audio.volume = 0;
        audio
          .play()
          .then(() => {
            audio.pause();
            audio.volume = 0.8;
            audio.currentTime = 0;
          })
          .catch(() => {});
      }
    };

    const handleUserInteraction = () => {
      initializeAudio();
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };

    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);

    return () => {
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
    };
  }, []);

  // Handle ringing state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isRinging) {
      audio.loop = true;
      audio.volume = 0.8;
      audio.currentTime = 0;

      const attemptPlay = async () => {
        try {
          await audio.play();
        } catch (error) {
          const playOnInteraction = () => {
            audio.play().catch(() => {});
            document.removeEventListener("click", playOnInteraction);
            document.removeEventListener("keydown", playOnInteraction);
          };
          document.addEventListener("click", playOnInteraction);
          document.addEventListener("keydown", playOnInteraction);
        }
      };

      attemptPlay();

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
  }, [isRinging]);

  const stopRingtone = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  return { audioRef, stopRingtone };
}
