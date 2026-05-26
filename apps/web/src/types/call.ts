import type { User } from "./user";

export type CallStatus =
  | "idle"
  | "calling"
  | "ringing"
  | "connected"
  | "ended"
  | "declined"
  | "missed"
  | "timeout";

export type CallType = "audio" | "video";

export interface CallState {
  callId: string | null;
  status: CallStatus;
  callType: CallType | null;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  caller: User | null;
  callee: User | null;
}

export interface CallHistory {
  id: string;
  callId: string;
  type: CallType;
  status: "completed" | "missed" | "declined" | "failed";
  direction: "incoming" | "outgoing";
  /** Duration in seconds. */
  duration: number;
  timestamp: Date;
  startTime: Date;
  endTime?: Date;
  user: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    phoneNumber: string;
  };
}
