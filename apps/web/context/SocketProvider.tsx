"use client";
import React, { useCallback, useContext, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface SocketProviderProps {
  children?: React.ReactNode;
}

interface ISocketContext {
  sendMessage: (message: string, recipientId: string, name: string) => void;
  username?: string;
}
const socketContext = React.createContext<ISocketContext | null>(null);

export const useSocket = () => {
  const state = useContext(socketContext);
  if (!state) {
    throw new Error("state is not defined");
  }
  return state;
};

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = React.useState<Socket | null>(null);
  const [username, setUsername] = React.useState<string | null>(null);

  useEffect(() => {
    const _socket = io("http://localhost:8000");
    setSocket(_socket);

    _socket.on("connected", (data) => {
      console.log("Connected to socket server:", data.socketId);
      const username =
        localStorage.getItem("username") || "guest_" + Date.now();
      setUsername(username);
      localStorage.setItem("username", username);
      _socket.emit("register_user", username);
      console.log("Registered user:", username);
    });

    _socket.on("one_to_one_message", (data) => {
      console.log("Received one-to-one message:", data);
    });

    _socket.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("username");
    if (user) {
      setUsername(user);
    } else {
      const newUser = "guest_" + Date.now();
      setUsername(newUser);
      localStorage.setItem("username", newUser);
    }
  }, []);

  const sendMessage = useCallback(
    (message: string, recipientUserName: string, name: string) => {
      if (socket) {
        socket.emit("one_to_one_message", {
          to: recipientUserName,
          message,
          name,
        });
      } else {
        console.error("Socket is not connected");
      }
    },
    [socket]
  );

  return (
    <socketContext.Provider
      value={{ sendMessage, username: username ?? undefined }}
    >
      {children}
    </socketContext.Provider>
  );
};
