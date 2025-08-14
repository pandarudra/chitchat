import type { User } from "../types";

/**
 * Determines if a user is considered online
 * A user is online if:
 * 1. Their isOnline flag is true, OR
 * 2. Their lastSeen is within the last 5 minutes
 */
export const isUserOnline = (user: User): boolean => {
  if (user.isOnline) {
    return true;
  }

  if (!user.lastSeen) {
    return false;
  }

  const now = new Date();
  const lastSeen = new Date(user.lastSeen);
  const timeDifference = now.getTime() - lastSeen.getTime();
  const fiveMinutesInMs = 5 * 60 * 1000; // 5 minutes in milliseconds

  return timeDifference <= fiveMinutesInMs;
};

/**
 * Gets the online status text for a user
 */
export const getUserOnlineStatusText = (user: User): string => {
  if (isUserOnline(user)) {
    return "Online";
  }

  if (!user.lastSeen) {
    return "Last seen recently";
  }

  const now = new Date();
  const lastSeen = new Date(user.lastSeen);
  const timeDifference = now.getTime() - lastSeen.getTime();

  const minutes = Math.floor(timeDifference / (1000 * 60));
  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  if (minutes < 1) {
    return "Last seen just now";
  } else if (minutes < 60) {
    return `Last seen ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    return `Last seen ${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (days < 7) {
    return `Last seen ${days} day${days === 1 ? "" : "s"} ago`;
  } else {
    return "Last seen recently";
  }
};

/**
 * Gets the online status indicator color
 */
export const getOnlineStatusColor = (user: User): string => {
  return isUserOnline(user) ? "bg-green-500" : "bg-gray-400";
};
