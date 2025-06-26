"use client";
import React from "react";
import { AuthContext, IAuthContext } from "../context/AuthProvider";

export const useAuth = (): IAuthContext => {
  const state = React.useContext(AuthContext);
  if (!state) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return state;
};
