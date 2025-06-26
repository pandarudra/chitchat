"use client";
import React from "react";
import { SocketContext, SocketContextType } from "../context/SocketProvider";

export const useSocket = (): SocketContextType => {
  const ctx = React.useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};
