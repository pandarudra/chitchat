import { Socket, Server as SocketIOServer } from "socket.io";
import { UserModel } from "../../models/User";
import { CallHistoryModel } from "../../models/CallHistory";
import { pub } from "../../utils/redisClient";
import { socketKey } from "../../lib/ext";
import { Logger } from "../../utils/logger";

/** All possible states a call can be in during its lifecycle. */
const CALL_STATES = {
  CALLING: "calling",
  RINGING: "ringing",
  CONNECTED: "connected",
  ENDED: "ended",
  DECLINED: "declined",
  MISSED: "missed",
} as const;

type CallStatus = (typeof CALL_STATES)[keyof typeof CALL_STATES];

interface CallData {
  callId: string;
  caller: string;
  callee: string;
  callType: "audio" | "video";
  status: CallStatus;
  startTime: number;
  acceptedAt?: number;
  endTime?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCallData(callId: string): Promise<CallData | null> {
  const raw = await pub.get(`call:${callId}`);
  return raw ? (JSON.parse(raw) as CallData) : null;
}

async function saveCallData(callData: CallData, ttlSeconds: number): Promise<void> {
  await pub.setex(`call:${callData.callId}`, ttlSeconds, JSON.stringify(callData));
}

async function persistCallHistory(callData: CallData, status: string): Promise<void> {
  try {
    const duration =
      callData.endTime && callData.acceptedAt
        ? Math.floor((callData.endTime - callData.acceptedAt) / 1000)
        : 0;

    await CallHistoryModel.create({
      callId: callData.callId,
      caller: callData.caller,
      callee: callData.callee,
      callType: callData.callType,
      status,
      duration,
      startTime: new Date(callData.startTime),
      endTime: callData.endTime ? new Date(callData.endTime) : undefined,
    });

    Logger.info(`Call history saved: ${callData.callId} — ${status}`);
  } catch (error) {
    Logger.error("Error saving call history", error);
  }
}

async function resolveSocketId(
  ...identifiers: (string | undefined)[]
): Promise<string | null> {
  for (const id of identifiers) {
    if (!id) continue;
    const socketId = await pub.get(socketKey(id));
    if (socketId) return socketId;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Handler registration
// ---------------------------------------------------------------------------

/**
 * Registers all call-related Socket.IO event handlers on the given socket.
 */
export function registerCallHandlers(
  io: SocketIOServer,
  socket: Socket,
  userId: string
): void {
  // ── call-user ─────────────────────────────────────────────────────────────
  socket.on("call-user", async (data) => {
    const { to, toPhone, callId, offer, callType, from, fromName, fromPhone } = data;

    if (!callId || !offer || !callType || !from) {
      socket.emit("call-error", { callId, message: "Invalid call data." });
      return;
    }

    try {
      // Resolve recipient — try by ID first, then phone number
      let recipient =
        (to ? await UserModel.findById(to).catch(() => null) : null) ??
        (toPhone ? await UserModel.findOne({ email: toPhone }) : null);

      if (!recipient) {
        socket.emit("call-error", { callId, message: "User not found." });
        return;
      }

      const recipientId = (recipient._id as any).toString();

      if (recipient.blockedContacts?.some((b) => b.toString() === from)) {
        socket.emit("call-error", { callId, message: "User has blocked you." });
        return;
      }

      const recipientSocketId = await pub.get(socketKey(recipientId));
      if (!recipientSocketId) {
        socket.emit("call-error", { callId, message: "User is not online." });
        return;
      }

      const callData: CallData = {
        callId,
        caller: from,
        callee: recipientId,
        callType,
        status: CALL_STATES.CALLING,
        startTime: Date.now(),
      };
      await saveCallData(callData, 300);

      const caller = await UserModel.findById(from);

      io.to(recipientSocketId).emit("incoming-call", {
        callId,
        from,
        fromName: fromName ?? caller?.displayName ?? "Unknown",
        fromPhone: fromPhone ?? caller?.email ?? "",
        callType,
        offer,
      });

      socket.emit("call-initiated", { callId, to: recipientId });
      Logger.info(`Call initiated: ${callId} from ${from} to ${recipientId}`);
    } catch (error) {
      Logger.error("Error initiating call", error);
      socket.emit("call-error", { callId, message: "Failed to initiate call." });
    }
  });

  // ── accept-call ───────────────────────────────────────────────────────────
  socket.on("accept-call", async (data) => {
    const { callId, answer, to } = data;

    if (!callId || !answer) {
      socket.emit("call-error", { callId, message: "Invalid accept data." });
      return;
    }

    try {
      const callData = await getCallData(callId);
      if (!callData) {
        socket.emit("call-error", { callId, message: "Call not found." });
        return;
      }

      callData.status = CALL_STATES.CONNECTED;
      callData.acceptedAt = Date.now();
      await saveCallData(callData, 300);

      const callerSocketId = await resolveSocketId(to, callData.caller);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call-accepted", { callId, answer, from: userId });
        Logger.info(`Call accepted: ${callId}`);
      } else {
        socket.emit("call-error", { callId, message: "Caller not online." });
      }
    } catch (error) {
      Logger.error("Error accepting call", error);
      socket.emit("call-error", { callId, message: "Failed to accept call." });
    }
  });

  // ── decline-call ──────────────────────────────────────────────────────────
  socket.on("decline-call", async (data) => {
    const { callId, to } = data;

    if (!callId) {
      socket.emit("call-error", { callId, message: "Invalid decline data." });
      return;
    }

    try {
      const callData = await getCallData(callId);
      if (!callData) return;

      callData.status = CALL_STATES.DECLINED;
      callData.endTime = Date.now();
      await saveCallData(callData, 60);

      const callerSocketId = await resolveSocketId(to, callData.caller);
      if (callerSocketId) {
        io.to(callerSocketId).emit("call-declined", { callId });
      }

      await persistCallHistory(callData, "declined");
      Logger.info(`Call declined: ${callId}`);
    } catch (error) {
      Logger.error("Error declining call", error);
      socket.emit("call-error", { callId, message: "Failed to decline call." });
    }
  });

  // ── end-call ──────────────────────────────────────────────────────────────
  socket.on("end-call", async (data) => {
    const { callId } = data;

    if (!callId) {
      socket.emit("call-error", { callId, message: "Invalid end-call data." });
      return;
    }

    try {
      const callData = await getCallData(callId);
      if (!callData) return;

      callData.status = CALL_STATES.ENDED;
      callData.endTime = Date.now();

      // Notify the other participant
      const otherParticipantId =
        callData.caller === userId ? callData.callee : callData.caller;
      const otherSocketId = await pub.get(socketKey(otherParticipantId));
      if (otherSocketId) {
        io.to(otherSocketId).emit("call-ended", { callId });
      }

      const status = callData.acceptedAt ? "completed" : "ended";
      await persistCallHistory(callData, status);
      await pub.del(`call:${callId}`);

      Logger.info(`Call ended: ${callId}`);
    } catch (error) {
      Logger.error("Error ending call", error);
      socket.emit("call-error", { callId, message: "Failed to end call." });
    }
  });

  // ── ice-candidate ─────────────────────────────────────────────────────────
  socket.on("ice-candidate", async (data) => {
    const { to, candidate, callId } = data;

    if (!to || !candidate) return;

    try {
      // Verify the user is a participant in this call before forwarding
      if (callId) {
        const callData = await getCallData(callId);
        if (callData && callData.caller !== userId && callData.callee !== userId) {
          Logger.warn(`User ${userId} tried to send ICE for call ${callId} they're not in.`);
          return;
        }
      }

      const toSocketId = await pub.get(socketKey(to));
      if (toSocketId) {
        io.to(toSocketId).emit("ice-candidate", { from: userId, candidate, callId });
      }
    } catch (error) {
      Logger.error("Error forwarding ICE candidate", error);
    }
  });

  // ── call-timeout ──────────────────────────────────────────────────────────
  socket.on("call-timeout", async (data) => {
    const { callId } = data;
    if (!callId) return;

    try {
      const callData = await getCallData(callId);
      if (
        !callData ||
        (callData.status !== CALL_STATES.CALLING && callData.status !== CALL_STATES.RINGING)
      ) {
        return;
      }

      callData.status = CALL_STATES.MISSED;
      callData.endTime = Date.now();
      await saveCallData(callData, 60);
      await persistCallHistory(callData, "missed");

      // Notify all participants about the timeout
      for (const participantId of [callData.caller, callData.callee]) {
        const participantSocketId = await pub.get(socketKey(participantId));
        if (participantSocketId) {
          io.to(participantSocketId).emit("call-timeout", { callId });
        }
      }

      Logger.info(`Call timeout handled: ${callId}`);
    } catch (error) {
      Logger.error("Error handling call timeout", error);
    }
  });
}

// ---------------------------------------------------------------------------
// Disconnect helper — handles calls that were active when a user disconnected
// ---------------------------------------------------------------------------

export async function handleDisconnectedCalls(
  io: SocketIOServer,
  userId: string
): Promise<void> {
  const keys = await pub.keys("call:*");

  for (const key of keys) {
    const raw = await pub.get(key);
    if (!raw) continue;

    const callData = JSON.parse(raw) as CallData;

    const isParticipant = callData.caller === userId || callData.callee === userId;
    const isActiveCall =
      callData.status === CALL_STATES.CALLING ||
      callData.status === CALL_STATES.RINGING ||
      callData.status === CALL_STATES.CONNECTED;

    if (!isParticipant || !isActiveCall) continue;

    callData.status = CALL_STATES.ENDED;
    callData.endTime = Date.now();
    await pub.setex(key, 60, JSON.stringify(callData));

    const otherUserId =
      callData.caller === userId ? callData.callee : callData.caller;
    const otherSocketId = await pub.get(socketKey(otherUserId));
    if (otherSocketId) {
      io.to(otherSocketId).emit("call-ended", {
        callId: callData.callId,
        reason: "user_disconnected",
      });
    }

    const status = callData.acceptedAt ? "completed" : "missed";
    await persistCallHistory(callData, status);
  }
}
