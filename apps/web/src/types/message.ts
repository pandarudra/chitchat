/** A single chat message. */
export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  type: "text" | "image" | "file" | "audio" | "video";
  status: "sent" | "delivered" | "read";
  replyTo?: string;
  fileName?: string;
  fileSize?: number;
  /** URL for media attachments (images, videos, audio). */
  mediaUrl?: string;
  /** Duration in seconds for audio messages. */
  duration?: number;
  /** True if the message came from a blocked contact. */
  isBlocked?: boolean;
  isPinned?: boolean;
  isAIMessage?: boolean;
}
