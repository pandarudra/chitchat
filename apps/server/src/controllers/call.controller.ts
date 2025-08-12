import { Request, Response } from "express";
import { CallHistoryModel, ICallHistory } from "../models/CallHistory";
import { UserModel, IUser } from "../models/User";
import mongoose from "mongoose";

export const getCallHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get call history where user is either caller or callee
    const callHistory = await CallHistoryModel.find({
      $or: [{ caller: userId }, { callee: userId }],
    })
      .populate("caller", "displayName avatarUrl phoneNumber")
      .populate("callee", "displayName avatarUrl phoneNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Transform data for frontend
    const transformedHistory = callHistory.map((call) => {
      const caller = call.caller as any;
      const callee = call.callee as any;
      const isOutgoing = caller._id.toString() === userId;
      const otherUser = isOutgoing ? callee : caller;

      return {
        id: call._id,
        callId: call.callId,
        type: call.callType,
        status: call.status,
        direction: isOutgoing ? "outgoing" : "incoming",
        duration: call.duration,
        timestamp: call.createdAt,
        startTime: call.startTime,
        endTime: call.endTime,
        user: {
          id: otherUser._id,
          displayName: otherUser.displayName,
          avatarUrl: otherUser.avatarUrl,
          phoneNumber: otherUser.phoneNumber,
        },
      };
    });

    // Get total count for pagination
    const totalCount = await CallHistoryModel.countDocuments({
      $or: [{ caller: userId }, { callee: userId }],
    });

    res.json({
      success: true,
      data: {
        calls: transformedHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasMore: skip + callHistory.length < totalCount,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching call history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch call history",
    });
  }
};

export const deleteCallHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;
    const { callId } = req.params;

    // Find and delete call history entry
    const deletedCall = await CallHistoryModel.findOneAndDelete({
      _id: callId,
      $or: [{ caller: userId }, { callee: userId }],
    });

    if (!deletedCall) {
      res.status(404).json({
        success: false,
        message: "Call history entry not found",
      });
      return;
    }

    res.json({
      success: true,
      message: "Call history entry deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting call history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete call history entry",
    });
  }
};

export const clearCallHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user.id;

    // Delete all call history for the user
    await CallHistoryModel.deleteMany({
      $or: [{ caller: userId }, { callee: userId }],
    });

    res.json({
      success: true,
      message: "Call history cleared successfully",
    });
  } catch (error) {
    console.error("Error clearing call history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to clear call history",
    });
  }
};
