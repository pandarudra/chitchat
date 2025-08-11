// redis map userid -> socketId key
export const socketKey = (userId: string): string => {
  return `socket:${userId}`;
};
