/**
 * useCallTimer — tracks call duration and formats it as HH:MM:SS / MM:SS.
 */

import { useState, useEffect, useRef } from "react";

export function useCallTimer(isConnected: boolean): string {
  const [seconds, setSeconds] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isConnected) {
      startRef.current = null;
      setSeconds(0);
      return;
    }

    if (!startRef.current) startRef.current = Date.now();

    const interval = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current!) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  return formatDuration(seconds);
}

function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;

  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");

  if (h > 0) return `${String(h).padStart(2, "0")}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}
