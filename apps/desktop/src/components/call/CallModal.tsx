import { useEffect, useState, useRef, useCallback } from "react";
import {
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Settings,
  Maximize2,
  Minimize2,
  User,
  Phone,
} from "lucide-react";
import { useChat } from "../../context/ChatContext";
import { useAuth } from "../../context/AuthContext";
import { getAvatarUrl } from "../../utils/constants";

function CallModal() {
  const { call, endCall, acceptCall } = useChat();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [videoLayout, setVideoLayout] = useState<"remote-main" | "local-main">(
    "remote-main"
  );
  const [pipPosition, setPipPosition] = useState({ x: 16, y: 64 }); // Default: top-16 right-4 (16px from right, 64px from top)
  const [pipSize, setPipSize] = useState({ width: 128, height: 96 }); // Default: w-32 h-24 (128px x 96px)
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStartPoint, setResizeStartPoint] = useState({ x: 0, y: 0 });
  const [initialSize, setInitialSize] = useState({ width: 0, height: 0 });
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const callStartTimeRef = useRef<number | null>(null);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (call.status === "connected") {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
      interval = setInterval(() => {
        if (callStartTimeRef.current) {
          setCallDuration(
            Math.floor((Date.now() - callStartTimeRef.current) / 1000)
          );
        }
      }, 1000);
    } else {
      callStartTimeRef.current = null;
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [call.status]);

  // Set up video streams
  useEffect(() => {
    if (localVideoRef.current && call.localStream) {
      localVideoRef.current.srcObject = call.localStream;
    }
    if (remoteVideoRef.current && call.remoteStream) {
      remoteVideoRef.current.srcObject = call.remoteStream;
    }
    if (localAudioRef.current && call.localStream) {
    localAudioRef.current.srcObject = call.localStream;
  }
  if (remoteAudioRef.current && call.remoteStream) {
    remoteAudioRef.current.srcObject = call.remoteStream;
    // audio plays automatically
    remoteAudioRef.current.play().catch(console.error);
  }
  }, [call.localStream, call.remoteStream]);

  // Sync track states with component state
  useEffect(() => {
    if (call.localStream) {
      const videoTracks = call.localStream.getVideoTracks();
      const audioTracks = call.localStream.getAudioTracks();

      // Sync video state
      if (videoTracks.length > 0) {
        const actualVideoState = videoTracks[0].enabled;
        if (actualVideoState !== isVideoEnabled) {
          setIsVideoEnabled(actualVideoState);
        }
      }

      // Sync audio state
      if (audioTracks.length > 0) {
        const actualAudioState = audioTracks[0].enabled;
        if (actualAudioState !== isAudioEnabled) {
          setIsAudioEnabled(actualAudioState);
        }
      }
    }
  }, [call.localStream, isVideoEnabled, isAudioEnabled]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (call.localStream) {
      const videoTracks = call.localStream.getVideoTracks();
      const newVideoState = !isVideoEnabled;

      videoTracks.forEach((track) => {
        track.enabled = newVideoState;
      });
      setIsVideoEnabled(newVideoState);
    }
  }, [call.localStream, isVideoEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (call.localStream) {
      const audioTracks = call.localStream.getAudioTracks();
      const newAudioState = !isAudioEnabled;

      audioTracks.forEach((track) => {
        track.enabled = newAudioState;
      });
      setIsAudioEnabled(newAudioState);
    }
  }, [call.localStream, isAudioEnabled]);

  // Toggle video layout (switch between remote and local as main)
  const toggleVideoLayout = useCallback(() => {
    setVideoLayout((prev) =>
      prev === "remote-main" ? "local-main" : "remote-main"
    );
    console.log("Video layout toggled:", videoLayout);
  }, [videoLayout]);

  // Drag handlers for picture-in-picture video
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent triggering layout toggle
    setIsDragging(true);

    const rect = (e.target as HTMLElement)
      .closest(".pip-container")
      ?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;

      e.preventDefault();

      // Get container bounds to keep PiP within viewport
      const container = document.querySelector(".call-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const pipWidth = pipSize.width;
      const pipHeight = pipSize.height;

      // Calculate new position
      let newX = e.clientX - containerRect.left - dragOffset.x;
      let newY = e.clientY - containerRect.top - dragOffset.y;

      // Keep within bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - pipWidth));
      newY = Math.max(0, Math.min(newY, containerRect.height - pipHeight));

      setPipPosition({ x: newX, y: newY });
    },
    [isDragging, dragOffset, pipSize]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Snap to edges for better UX
      const container = document.querySelector(".call-container");
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const pipWidth = 128;
        const pipHeight = 96;
        const margin = 16;

        let { x, y } = pipPosition;

        // Snap to nearest edge
        const centerX = x + pipWidth / 2;

        // Snap to left or right edge
        if (centerX < containerRect.width / 2) {
          x = margin; // Snap to left
        } else {
          x = containerRect.width - pipWidth - margin; // Snap to right
        }

        // Keep Y position but ensure it's within bounds
        y = Math.max(
          margin,
          Math.min(y, containerRect.height - pipHeight - margin)
        );

        setPipPosition({ x, y });
      }
    }
    setIsDragging(false);
  }, [isDragging, pipPosition]);

  const handleTouchEnd = useCallback(() => {
    if (isDragging) {
      // Snap to edges for better UX
      const container = document.querySelector(".call-container");
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const pipWidth = 128;
        const pipHeight = 96;
        const margin = 16;

        let { x, y } = pipPosition;

        // Snap to nearest edge
        const centerX = x + pipWidth / 2;

        // Snap to left or right edge
        if (centerX < containerRect.width / 2) {
          x = margin; // Snap to left
        } else {
          x = containerRect.width - pipWidth - margin; // Snap to right
        }

        // Keep Y position but ensure it's within bounds
        y = Math.max(
          margin,
          Math.min(y, containerRect.height - pipHeight - margin)
        );

        setPipPosition({ x, y });
      }
    }
    setIsDragging(false);
  }, [isDragging, pipPosition]);

  // Touch handlers for mobile support
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const touch = e.touches[0];
    const rect = (e.target as HTMLElement)
      .closest(".pip-container")
      ?.getBoundingClientRect();
    if (rect && touch) {
      setDragOffset({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      });
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;

      e.preventDefault();

      const touch = e.touches[0];
      if (!touch) return;

      // Get container bounds to keep PiP within viewport
      const container = document.querySelector(".call-container");
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const pipWidth = pipSize.width;
      const pipHeight = pipSize.height;

      // Calculate new position
      let newX = touch.clientX - containerRect.left - dragOffset.x;
      let newY = touch.clientY - containerRect.top - dragOffset.y;

      // Keep within bounds
      newX = Math.max(0, Math.min(newX, containerRect.width - pipWidth));
      newY = Math.max(0, Math.min(newY, containerRect.height - pipHeight));

      setPipPosition({ x: newX, y: newY });
    },
    [isDragging, dragOffset, pipSize]
  );

  // Resize handlers for picture-in-picture video
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeStartPoint({ x: e.clientX, y: e.clientY });
      setInitialSize({ width: pipSize.width, height: pipSize.height });
    },
    [pipSize]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      e.preventDefault();

      // Calculate size change based on mouse movement
      const deltaX = e.clientX - resizeStartPoint.x;
      const deltaY = e.clientY - resizeStartPoint.y;

      // Use the larger delta to maintain aspect ratio (16:12 or 4:3)
      const delta = Math.max(deltaX, deltaY);

      // Calculate new size (minimum 80x60, maximum 320x240)
      const newWidth = Math.max(80, Math.min(320, initialSize.width + delta));
      const newHeight = Math.max(60, Math.min(240, (newWidth * 3) / 4)); // Maintain 4:3 aspect ratio

      // Ensure the resized PiP stays within container bounds
      const container = document.querySelector(".call-container");
      if (container) {
        const containerRect = container.getBoundingClientRect();

        // Adjust position if needed to keep within bounds
        const currentPosition = pipPosition;
        const maxX = containerRect.width - newWidth;
        const maxY = containerRect.height - newHeight;

        if (currentPosition.x > maxX) {
          setPipPosition((prev) => ({ ...prev, x: maxX }));
        }
        if (currentPosition.y > maxY) {
          setPipPosition((prev) => ({ ...prev, y: maxY }));
        }
      }

      setPipSize({ width: newWidth, height: newHeight });
    },
    [isResizing, resizeStartPoint, initialSize, pipPosition]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Add global resize event listeners
  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleResizeMove);
      document.addEventListener("mouseup", handleResizeEnd);
      document.body.style.cursor = "nw-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleResizeMove);
        document.removeEventListener("mouseup", handleResizeEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Add global mouse and touch event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
      document.addEventListener("touchend", handleTouchEnd);
      document.body.style.cursor = "grabbing";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when call is active
      if (call.status !== "connected") return;

      // Prevent shortcuts when typing in input fields
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
          setIsFullscreen(!isFullscreen);
          break;
        case "s":
          e.preventDefault();
          setShowSettings(!showSettings);
          break;
        case "t":
          if (call.callType === "video") {
            e.preventDefault();
            toggleVideoLayout();
          }
          break;
        case "escape":
          e.preventDefault();
          if (isFullscreen) {
            setIsFullscreen(false);
          } else if (showSettings) {
            setShowSettings(false);
          }
          break;
        case "q":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            endCall(call.callId!);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [
    call.status,
    call.callType,
    call.callId,
    isFullscreen,
    showSettings,
    toggleAudio,
    toggleVideo,
    toggleVideoLayout,
    endCall,
  ]);

  // Auto-hide controls after inactivity
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (call.status === "connected" && isFullscreen) {
      const resetControlsTimer = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000); // Hide after 3 seconds of inactivity
      };

      const handleMouseMove = () => resetControlsTimer();
      const handleMouseEnter = () => setShowControls(true);

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseenter", handleMouseEnter);

      resetControlsTimer();

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseenter", handleMouseEnter);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
    }
  }, [call.status, isFullscreen]);

  // Get other user info
  const otherUser = call.caller?.id === user?.id ? call.callee : call.caller;

  // Don't show CallModal for incoming calls (ringing) - let CallNotification handle it
  // Show for all active call states including incoming calls
  if (call.status === "idle") return null;

  return (
    <div
      className={`fixed inset-0 bg-transparent bg-opacity-95 flex items-center justify-center z-[60] ${isFullscreen ? "p-0" : "p-4"}`}
    >
      <div
        className={`bg-gray-900 text-white rounded-xl shadow-2xl overflow-hidden ${isFullscreen ? "w-full h-full rounded-none" : "w-full max-w-4xl h-auto"}`}
      >
        {/* Error Display */}
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg z-10">
            <p>{error}</p>
            <button
              className="ml-2 text-xs underline"
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Outgoing Call UI */}
        {call.status === "calling" && (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {otherUser?.avatarUrl ? (
                  <img
                    src={getAvatarUrl(otherUser.avatarUrl)}
                    alt={otherUser.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <h2 className="text-2xl font-semibold mb-2">Calling...</h2>
              <p className="text-xl text-gray-300">{otherUser?.displayName}</p>
              <p className="text-sm text-gray-400 mt-1">
                {otherUser?.phoneNumber}
              </p>
            </div>

            <button
              onClick={() => endCall(call.callId!)}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors mx-auto"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          </div>
        )}

        {/* Incoming Call UI */}
        {call.status === "ringing" && (
          <div className="p-8 text-center">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center ring-4 ring-green-500 ring-opacity-50 animate-pulse">
                {otherUser?.avatarUrl ? (
                  <img
                    src={getAvatarUrl(otherUser.avatarUrl)}
                    alt={otherUser.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>
              <h2 className="text-2xl font-semibold mb-2">
                Incoming {call.callType} call
              </h2>
              <p className="text-xl text-gray-300">{otherUser?.displayName}</p>
              <p className="text-sm text-gray-400 mt-1">
                {otherUser?.phoneNumber}
              </p>
            </div>

            {/* Answer/Decline buttons */}
            <div className="flex items-center justify-center space-x-12">
              <button
                onClick={() => {
                  if (call.callId) {
                    endCall(call.callId);
                  }
                }}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                title="Decline call"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
              <button
                onClick={() => {
                  if (call.callId) {
                    acceptCall(call.callId);
                  }
                }}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center transition-colors animate-pulse"
                title="Accept call"
              >
                <Phone className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}

        {/* Active Call UI */}
        {call.status === "connected" && (
          <div
            className={`relative ${isFullscreen ? "h-full" : "h-96"} flex flex-col`}
          >
            {/* Header with user info and duration - Auto-hide in fullscreen */}
            <div
              className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 z-10 transition-opacity duration-300 ${
                isFullscreen && !showControls
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                    {otherUser?.avatarUrl ? (
                      <img
                        src={getAvatarUrl(otherUser.avatarUrl)}
                        alt={otherUser.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{otherUser?.displayName}</p>
                    <p className="text-sm text-gray-300">
                      {formatDuration(callDuration)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    title={`${isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} (F)`}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
                    title="Call settings (S)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Video Content */}
            {call.callType === "video" ? (
              <div className="call-container flex-1 relative">
                {/* Main video (changes based on layout) */}
                <div
                  className="w-full h-full cursor-pointer"
                  onClick={toggleVideoLayout}
                  title="Click to switch videos (T)"
                >
                  {videoLayout === "remote-main" ? (
                    /* Remote video as main */
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover bg-gray-800"
                    />
                  ) : /* Local video as main */
                  isVideoEnabled && call.localStream ? (
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
                      <p className="ml-3 text-gray-400">Camera is off</p>
                    </div>
                  )}
                </div>

                {/* Picture-in-picture video (changes based on layout) */}
                <div
                  className="pip-container absolute rounded-lg overflow-hidden bg-gray-800 border-2 border-white/20 cursor-grab hover:border-white/40 transition-colors z-10"
                  style={{
                    left: `${pipPosition.x}px`,
                    top: `${pipPosition.y}px`,
                    width: `${pipSize.width}px`,
                    height: `${pipSize.height}px`,
                    cursor: isDragging
                      ? "grabbing"
                      : isResizing
                        ? "nw-resize"
                        : "grab",
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onClick={(e) => {
                    // Only toggle layout if not dragging or resizing
                    if (!isDragging && !isResizing) {
                      e.stopPropagation();
                      toggleVideoLayout();
                    }
                  }}
                  title={
                    isDragging
                      ? "Dragging..."
                      : isResizing
                        ? "Resizing..."
                        : "Drag to move, resize from corner, or click to switch videos (T)"
                  }
                >
                  {/* Drag indicator */}
                  <div className="absolute top-1 left-1 right-1 h-1 bg-white/20 rounded-full flex justify-center z-20">
                    <div className="w-6 h-1 bg-white/40 rounded-full"></div>
                  </div>

                  {videoLayout === "remote-main" ? (
                    /* Local video as PiP */
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
                  ) : /* Remote video as PiP */
                  call.remoteStream ? (
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
                    onMouseDown={handleResizeStart}
                    onClick={(e) => e.stopPropagation()}
                    title="Drag to resize"
                    style={{
                      clipPath: "polygon(100% 0%, 0% 100%, 100% 100%)",
                    }}
                  />
                </div>

                {/* No video fallback for main view */}
                {videoLayout === "remote-main" && !call.remoteStream && (
                  <div
                    className="absolute inset-0 flex items-center justify-center bg-gray-800 cursor-pointer"
                    onClick={toggleVideoLayout}
                  >
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                        {otherUser?.avatarUrl ? (
                          <img
                            src={getAvatarUrl(otherUser.avatarUrl)}
                            alt={otherUser.displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-300">Camera is off</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Click to switch views
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Audio call UI */
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                      {call.callType === "audio" && call.remoteStream && (
                          <audio
                            ref={remoteAudioRef} 
                            autoPlay
                            playsInline
                            className="hidden"
                          />
                      )}
                    {otherUser?.avatarUrl ? (
                      <img
                        src={getAvatarUrl(otherUser.avatarUrl)}
                        alt={otherUser.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {otherUser?.displayName}
                  </h3>
                  <p className="text-gray-300">Audio call in progress</p>
                </div>
              </div>
            )}

            {/* Call Controls with Auto-hide */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 transition-opacity duration-300 ${
                isFullscreen && !showControls
                  ? "opacity-0 pointer-events-none"
                  : "opacity-100"
              }`}
            >
              <div className="flex items-center justify-center space-x-6">
                {/* Audio toggle */}
                <button
                  onClick={toggleAudio}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                    isAudioEnabled
                      ? "bg-gray-600 hover:bg-gray-700"
                      : "bg-red-500 hover:bg-red-600"
                  }`}
                  title={`${isAudioEnabled ? "Mute" : "Unmute"} microphone (M)`}
                >
                  {isAudioEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>

                {/* Video toggle (only for video calls) */}
                {call.callType === "video" && (
                  <button
                    onClick={toggleVideo}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                      isVideoEnabled
                        ? "bg-gray-600 hover:bg-gray-700"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                    title={`${isVideoEnabled ? "Turn off" : "Turn on"} camera (V)`}
                  >
                    {isVideoEnabled ? (
                      <Video className="w-5 h-5" />
                    ) : (
                      <VideoOff className="w-5 h-5" />
                    )}
                  </button>
                )}

                {/* End call */}
                <button
                  onClick={() => endCall(call.callId!)}
                  className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
                  title="End call (Ctrl+Q)"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>

                {/* Screen share (placeholder for future) */}
                <button
                  disabled
                  className="w-12 h-12 rounded-full bg-gray-600/50 flex items-center justify-center opacity-50 cursor-not-allowed"
                  title="Screen share (Coming soon)"
                >
                  <Monitor className="w-5 h-5" />
                </button>
              </div>

              {/* Keyboard shortcuts hint (only show in fullscreen) */}
              {isFullscreen && showControls && (
                <div className="absolute bottom-2 left-4 text-xs text-gray-400">
                  <p>
                    M: Mute • V: Video • F: Fullscreen • S: Settings • Esc: Exit
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Settings Panel */}
            {showSettings && (
              <div className="absolute top-16 right-4 bg-gray-800/95 backdrop-blur-sm rounded-lg p-4 min-w-64 z-20 border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Call Settings</h4>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
                  >
                    <User className="w-3 h-3" />
                  </button>
                </div>

                {/* Connection Info */}
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Call Type:</span>
                    <span className="text-blue-400 capitalize">
                      {call.callType}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Quality:</span>
                    <span className="text-green-400">HD Ready</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Connection:</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-green-400">Stable</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Duration:</span>
                    <span className="text-white font-mono">
                      {formatDuration(callDuration)}
                    </span>
                  </div>
                  {call.callType === "video" && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Main Video:</span>
                      <span className="text-purple-400 capitalize">
                        {videoLayout === "remote-main"
                          ? "Their Camera"
                          : "Your Camera"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Audio/Video Controls */}
                <div className="border-t border-gray-700 pt-3 mb-4">
                  <h5 className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Media Controls
                  </h5>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 text-sm">Microphone</span>
                      <button
                        onClick={toggleAudio}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isAudioEnabled
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "bg-red-500 hover:bg-red-600 text-white"
                        }`}
                      >
                        {isAudioEnabled ? (
                          <Mic className="w-3 h-3" />
                        ) : (
                          <MicOff className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                    {call.callType === "video" && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">Camera</span>
                          <button
                            onClick={toggleVideo}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isVideoEnabled
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-red-500 hover:bg-red-600 text-white"
                            }`}
                          >
                            {isVideoEnabled ? (
                              <Video className="w-3 h-3" />
                            ) : (
                              <VideoOff className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">
                            Video Layout
                          </span>
                          <button
                            onClick={toggleVideoLayout}
                            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors"
                            title={`Switch to ${videoLayout === "remote-main" ? "your" : "their"} video as main (T)`}
                          >
                            <Monitor className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300 text-sm">
                            PiP Size
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() =>
                                setPipSize({ width: 80, height: 60 })
                              }
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                                pipSize.width === 80
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                              }`}
                              title="Small"
                            >
                              S
                            </button>
                            <button
                              onClick={() =>
                                setPipSize({ width: 128, height: 96 })
                              }
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                                pipSize.width === 128
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                              }`}
                              title="Medium"
                            >
                              M
                            </button>
                            <button
                              onClick={() =>
                                setPipSize({ width: 192, height: 144 })
                              }
                              className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-colors ${
                                pipSize.width === 192
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-600 hover:bg-gray-500 text-gray-300"
                              }`}
                              title="Large"
                            >
                              L
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Technical Info */}
                <div className="border-t border-gray-700 pt-3">
                  <h5 className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Technical Info
                  </h5>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Protocol:</span>
                      <span className="text-gray-300">WebRTC</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Codec:</span>
                      <span className="text-gray-300">
                        {call.callType === "video" ? "VP8/Opus" : "Opus"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Encryption:</span>
                      <span className="text-green-400">DTLS-SRTP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">NAT Type:</span>
                      <span className="text-gray-300">STUN</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border-t border-gray-700 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setIsFullscreen(!isFullscreen)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-sm"
                    >
                      {isFullscreen ? (
                        <Minimize2 className="w-3 h-3" />
                      ) : (
                        <Maximize2 className="w-3 h-3" />
                      )}
                      <span>{isFullscreen ? "Exit" : "Fullscreen"}</span>
                    </button>
                    <button
                      onClick={() => endCall(call.callId!)}
                      className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-sm"
                    >
                      <PhoneOff className="w-3 h-3" />
                      <span>End Call</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Call End States */}
        {(call.status === "declined" ||
          call.status === "missed" ||
          call.status === "ended") && (
          <div className="p-8 text-center">
            <div className="mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {otherUser?.avatarUrl ? (
                  <img
                    src={getAvatarUrl(otherUser.avatarUrl)}
                    alt={otherUser.displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-300">
                {call.status === "declined" && "Call Declined"}
                {call.status === "missed" &&
                  `Missed Call from ${otherUser?.displayName}`}
                {call.status === "ended" && "Call Ended"}
              </h3>
              {call.status === "ended" && callDuration > 0 && (
                <p className="text-sm text-gray-400 mt-1">
                  Duration: {formatDuration(callDuration)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CallModal;
