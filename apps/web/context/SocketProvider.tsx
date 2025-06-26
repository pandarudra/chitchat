"use client";
import React, { createContext, useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "../hooks/useAuth";

export interface SocketContextType {
  socket: Socket | null;
  sendMessage: (message: string, recipientId: string, name: string) => void;
}

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log(isAuthenticated, loading);
    if (loading && !isAuthenticated) {
      console.log(
        "Socket not initialized: User not authenticated",
        isAuthenticated,
        loading
      );
      return;
    }
    const _socket = io("http://localhost:8000", {
      withCredentials: true,
    });
    _socket.on("connected", (data) =>
      console.log("✅ Connected:", data.socketId)
    );
    _socket.on("one_to_one_message", (data) =>
      console.log("📩 Received:", data)
    );
    _socket.on("disconnect", () => console.log("❌ Disconnected"));

    setSocket(_socket);
    return () => {
      _socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback(
    (message: string, recipientId: string, name: string) => {
      if (!socket) return console.error("Socket not ready");
      socket.emit("one_to_one_message", { to: recipientId, message, name });
    },
    [socket]
  );
  // memorize
  const value = React.useMemo(
    () => ({ socket, sendMessage }),
    [socket, sendMessage]
  );
  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
