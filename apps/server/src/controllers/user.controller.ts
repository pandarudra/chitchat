import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UserModel } from "../models/User";
import { ContactRequestModel } from "../models/ContactRequest";
import { NotificationModel } from "../models/Notification";
import { AIService } from "../services/ai.service";
import { deleteCloudinaryAsset, uploadToCloudinary } from "../utils/cloudinary";
import { Logger } from "../utils/logger";

// ---------------------------------------------------------------------------
// Multer — avatar upload (disk → Cloudinary)
// ---------------------------------------------------------------------------

const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

/** Express middleware that accepts a single `avatar` file field. */
export const uploadMiddleware = avatarUpload.single("avatar");

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function createNotification(params: {
  user: string;
  type:
    | "contact_request"
    | "contact_request_accepted"
    | "contact_request_rejected"
    | "system";
  title: string;
  message: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await NotificationModel.create({
    user: params.user,
    type: params.type,
    title: params.title,
    message: params.message,
    payload: params.payload ?? {},
  });
}

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const onAddContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const contactEmail = req.body.contactEmail;

  if (!userId || !contactEmail) {
    res.status(400).json({ error: "User ID and contact email are required." });
    return;
  }

  try {
    const [existingUser, existingContact] = await Promise.all([
      UserModel.findById(userId),
      UserModel.findOne({ email: contactEmail }),
    ]);

    if (!existingUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }
    if (!existingContact) {
      res.status(404).json({ error: "Contact not found." });
      return;
    }

    const existingContactId = String((existingContact as any)._id);
    const currentUserId = String((existingUser as any)._id);

    if (currentUserId === existingContactId) {
      res.status(400).json({ error: "Cannot add yourself as a contact." });
      return;
    }

    const alreadyAdded = existingUser.contacts.some(
      (c) => c.user.toString() === existingContactId,
    );
    if (alreadyAdded) {
      res.status(400).json({ error: "Contact already exists." });
      return;
    }

    const pendingRequest = await ContactRequestModel.findOne({
      sender: existingUser._id,
      receiver: existingContact._id,
      status: "pending",
    });
    if (pendingRequest) {
      res.status(409).json({ error: "Contact request already sent." });
      return;
    }

    const reverseRequest = await ContactRequestModel.findOne({
      sender: existingContact._id,
      receiver: existingUser._id,
      status: "pending",
    });
    if (reverseRequest) {
      res
        .status(409)
        .json({
          error: "This user already sent you a request. Check notifications.",
        });
      return;
    }

    const request = await ContactRequestModel.create({
      sender: existingUser._id,
      receiver: existingContact._id,
      status: "pending",
    });

    await createNotification({
      user: existingContactId,
      type: "contact_request",
      title: `${existingUser.displayName} sent you a contact request`,
      message: `Open notifications to accept or reject ${existingUser.displayName}'s request.`,
      payload: {
        requestId: String((request as any)._id),
        actorId: currentUserId,
        actorName: existingUser.displayName,
        actorEmail: existingUser.email,
        actorAvatarUrl: existingUser.avatarUrl ?? null,
      },
    });

    res.status(200).json({
      message: "Contact request sent successfully.",
      request: {
        id: String((request as any)._id),
        senderId: currentUserId,
        receiverId: existingContactId,
        status: request.status,
        timestamp: request.createdAt,
      },
    });
  } catch (error) {
    Logger.error("Error adding contact", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onSearchUsers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const query = String(req.query.query ?? req.query.q ?? "").trim();
  const currentUserId = String(userId);

  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  try {
    const currentUser = await UserModel.findById(userId).select(
      "contacts blockedContacts",
    );

    if (!currentUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const contactIds = new Set(
      currentUser.contacts.map((contact) => contact.user.toString()),
    );
    const pendingRequests = await ContactRequestModel.find({
      $or: [{ sender: userId }, { receiver: userId }],
      status: "pending",
    }).lean();

    const pendingSent = new Set(
      pendingRequests
        .filter((request) => String((request as any).sender) === currentUserId)
        .map((request) => String((request as any).receiver)),
    );
    const pendingReceived = new Set(
      pendingRequests
        .filter(
          (request) => String((request as any).receiver) === currentUserId,
        )
        .map((request) => String((request as any).sender)),
    );

    const filters: Record<string, unknown>[] = [{ _id: { $ne: userId } }];
    if (query) {
      const regex = new RegExp(escapeRegex(query), "i");
      filters.push({ $or: [{ email: regex }, { displayName: regex }] });
    }

    const users = await UserModel.find({ $and: filters })
      .limit(12)
      .sort({ displayName: 1 })
      .select("email displayName avatarUrl status lastSeen isOnline");

    const suggestions = users
      .filter((user) => !contactIds.has(String((user as any)._id)))
      .map((user) => ({
        id: String((user as any)._id),
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        lastSeen: user.lastSeen,
        isOnline: user.isOnline,
        isContact: false,
        requestStatus: pendingSent.has(String((user as any)._id))
          ? "sent"
          : pendingReceived.has(String((user as any)._id))
            ? "received"
            : "none",
      }));

    res.status(200).json({ suggestions });
  } catch (error) {
    Logger.error("Error searching users", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onGetContacts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  try {
    const [user, aiBot] = await Promise.all([
      UserModel.findById(userId),
      AIService.getDefaultAIBot(),
    ]);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Fetch contact details in parallel
    const contact_obj = await Promise.all(
      user.contacts.map(async (contact) => {
        const contactUser = await UserModel.findById(contact.user);
        return {
          user: contact.user.toString(),
          name: contact.name,
          email: contact.email,
          avatarUrl: contactUser?.avatarUrl,
          isOnline: contactUser?.isOnline ?? false,
          lastSeen: contactUser?.lastSeen,
          displayName: contactUser?.displayName,
          status: contactUser?.status,
          blocked:
            user.blockedContacts?.some(
              (b) => b.toString() === contactUser?._id?.toString(),
            ) ?? false,
          pinned:
            user.pinnedContacts?.some(
              (p) => p.toString() === contactUser?._id?.toString(),
            ) ?? false,
          isAI: false,
        };
      }),
    );

    // AI bot is always first in the list (pinned by default)
    const aiContact = {
      user: (aiBot._id as any).toString(),
      name: aiBot.displayName,
      email: aiBot.email,
      avatarUrl: aiBot.avatarUrl,
      isOnline: true,
      lastSeen: new Date(),
      displayName: aiBot.displayName,
      status: aiBot.status,
      blocked: false,
      pinned: true,
      isAI: true,
    };

    res.status(200).json({
      message: "Contacts retrieved successfully.",
      contacts: [aiContact, ...contact_obj],
    });
  } catch (error) {
    Logger.error("Error getting contacts", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onGetContactRequests = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  try {
    const requests = await ContactRequestModel.find({
      receiver: userId,
      status: "pending",
    })
      .sort({ createdAt: -1 })
      .lean();

    const enriched = await Promise.all(
      requests.map(async (request) => {
        const sender = await UserModel.findById((request as any).sender).select(
          "email displayName avatarUrl status isOnline lastSeen",
        );

        return {
          id: String((request as any)._id),
          senderId: String((request as any).sender),
          receiverId: String((request as any).receiver),
          senderInfo: sender
            ? {
                id: String((sender as any)._id),
                email: sender.email,
                displayName: sender.displayName,
                avatarUrl: sender.avatarUrl,
                status: sender.status,
                isOnline: sender.isOnline,
                lastSeen: sender.lastSeen,
              }
            : null,
          status: request.status,
          timestamp: (request as any).createdAt,
        };
      }),
    );

    res.status(200).json({ requests: enriched });
  } catch (error) {
    Logger.error("Error getting contact requests", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onAcceptContactRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const requestId = req.params.requestId || req.body.requestId;

  if (!userId || !requestId) {
    res.status(400).json({ error: "User ID and request ID are required." });
    return;
  }

  try {
    const request = await ContactRequestModel.findById(requestId);
    if (!request || String((request as any).receiver) !== String(userId)) {
      res.status(404).json({ error: "Request not found." });
      return;
    }

    if (request.status !== "pending") {
      res.status(400).json({ error: "Request has already been handled." });
      return;
    }

    const [receiver, sender] = await Promise.all([
      UserModel.findById((request as any).receiver),
      UserModel.findById((request as any).sender),
    ]);

    if (!receiver || !sender) {
      res.status(404).json({ error: "Users not found." });
      return;
    }

    const senderId = String((sender as any)._id);
    const receiverId = String((receiver as any)._id);

    const ensureContact = (owner: typeof sender, other: typeof receiver) => {
      const alreadyExists = owner.contacts.some(
        (contact) => contact.user.toString() === String((other as any)._id),
      );

      if (!alreadyExists) {
        owner.contacts.push({
          user: (other as any)._id,
          name: other.displayName,
          email: other.email,
        });
      }
    };

    ensureContact(sender, receiver);
    ensureContact(receiver, sender);

    request.status = "accepted";
    request.respondedAt = new Date();

    await Promise.all([sender.save(), receiver.save(), request.save()]);

    // Update the original notification
    await NotificationModel.updateOne(
      { user: receiverId, type: "contact_request", "payload.requestId": requestId },
      { $set: { type: "system", message: `You accepted the contact request from ${sender.displayName}.`, isRead: true } }
    );

    await createNotification({
      user: senderId,
      type: "contact_request_accepted",
      title: `${receiver.displayName} accepted your request`,
      message: `You can now chat with ${receiver.displayName}.`,
      payload: {
        requestId: String((request as any)._id),
        actorId: receiverId,
        actorName: receiver.displayName,
        actorEmail: receiver.email,
        actorAvatarUrl: receiver.avatarUrl ?? null,
      },
    });

    res.status(200).json({
      message: "Contact request accepted.",
      contact: {
        user: senderId,
        name: sender.displayName,
        email: sender.email,
      },
    });
  } catch (error) {
    Logger.error("Error accepting contact request", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onRejectContactRequest = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const requestId = req.params.requestId || req.body.requestId;

  if (!userId || !requestId) {
    res.status(400).json({ error: "User ID and request ID are required." });
    return;
  }

  try {
    const request = await ContactRequestModel.findById(requestId);
    if (!request || String((request as any).receiver) !== String(userId)) {
      res.status(404).json({ error: "Request not found." });
      return;
    }

    if (request.status !== "pending") {
      res.status(400).json({ error: "Request has already been handled." });
      return;
    }

    const receiver = await UserModel.findById((request as any).receiver);
    const sender = await UserModel.findById((request as any).sender);

    request.status = "rejected";
    request.respondedAt = new Date();
    await request.save();

    // Update the original notification
    await NotificationModel.updateOne(
      { user: userId, type: "contact_request", "payload.requestId": requestId },
      { $set: { type: "system", message: `You rejected the contact request from ${sender?.displayName ?? "Unknown"}.`, isRead: true } }
    );

    if (receiver && sender) {
      await createNotification({
        user: String((sender as any)._id),
        type: "contact_request_rejected",
        title: `${receiver.displayName} rejected your request`,
        message: `Your request to connect with ${receiver.displayName} was rejected.`,
        payload: {
          requestId: String((request as any)._id),
          actorId: String((receiver as any)._id),
          actorName: receiver.displayName,
          actorEmail: receiver.email,
          actorAvatarUrl: receiver.avatarUrl ?? null,
        },
      });
    }

    res.status(200).json({ message: "Contact request rejected." });
  } catch (error) {
    Logger.error("Error rejecting contact request", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onGetNotifications = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  try {
    const notifications = await NotificationModel.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      notifications: notifications.map((notification) => ({
        id: notification._id.toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        payload: notification.payload ?? {},
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
      })),
    });
  } catch (error) {
    Logger.error("Error getting notifications", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onMarkNotificationRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const notificationId = req.params.notificationId || req.body.notificationId;

  if (!userId || !notificationId) {
    res
      .status(400)
      .json({ error: "User ID and notification ID are required." });
    return;
  }

  try {
    const notification = await NotificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { isRead: true } },
      { new: true },
    );

    if (!notification) {
      res.status(404).json({ error: "Notification not found." });
      return;
    }

    res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    Logger.error("Error marking notification read", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onMarkAllNotificationsRead = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;

  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  try {
    await NotificationModel.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } },
    );

    res.status(200).json({ message: "All notifications marked as read." });
  } catch (error) {
    Logger.error("Error marking all notifications read", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onDeleteContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const { contactId } = req.body;

  if (!userId || !contactId) {
    res.status(400).json({ error: "User ID and contact ID are required." });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const contactIndex = user.contacts.findIndex(
      (c) => c.user.toString() === contactId,
    );
    if (contactIndex === -1) {
      res.status(404).json({ error: "Contact not found." });
      return;
    }

    user.contacts.splice(contactIndex, 1);

    // Also unpin the contact if it was pinned
    if (user.pinnedContacts) {
      user.pinnedContacts = user.pinnedContacts.filter(
        (id) => id.toString() !== contactId,
      );
    }

    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Contact deleted successfully." });
  } catch (error) {
    Logger.error("Error deleting contact", error);
    res.status(500).json({ error: "Failed to delete contact." });
  }
};

// ---------------------------------------------------------------------------
// Block / Unblock
// ---------------------------------------------------------------------------

export const onBlockContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const { blockUserId } = req.body;

  if (!userId || !blockUserId) {
    res.status(400).json({ error: "User ID and block user ID are required." });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (user.blockedContacts?.some((id) => id.toString() === blockUserId)) {
      res.status(400).json({ error: "User is already blocked." });
      return;
    }

    user.blockedContacts = [...(user.blockedContacts ?? []), blockUserId];
    await user.save();

    res
      .status(200)
      .json({
        message: "User blocked successfully.",
        blockedUserId: blockUserId,
      });
  } catch (error) {
    Logger.error("Error blocking user", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onUnblockContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const { unblockUserId } = req.body;

  if (!userId || !unblockUserId) {
    res
      .status(400)
      .json({ error: "User ID and unblock user ID are required." });
    return;
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { blockedContacts: unblockUserId } },
      { new: true },
    );

    if (!updatedUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.status(200).json({
      message: "User unblocked successfully.",
      updatedBlockedContacts: updatedUser.blockedContacts,
    });
  } catch (error) {
    Logger.error("Error unblocking user", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ---------------------------------------------------------------------------
// Pin / Unpin
// ---------------------------------------------------------------------------

export const onPinContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const { contactId } = req.body;

  if (!userId || !contactId) {
    res.status(400).json({ error: "User ID and contact ID are required." });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (user.pinnedContacts?.some((id) => id.toString() === contactId)) {
      res.status(400).json({ error: "Contact is already pinned." });
      return;
    }

    user.pinnedContacts = [...(user.pinnedContacts ?? []), contactId];
    await user.save();

    res
      .status(200)
      .json({
        message: "Contact pinned successfully.",
        pinnedContactId: contactId,
      });
  } catch (error) {
    Logger.error("Error pinning contact", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onUnpinContact = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const { contactId } = req.body;

  if (!userId || !contactId) {
    res.status(400).json({ error: "User ID and contact ID are required." });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    if (!user.pinnedContacts?.some((id) => id.toString() === contactId)) {
      res.status(400).json({ error: "Contact is not pinned." });
      return;
    }

    user.pinnedContacts = user.pinnedContacts.filter(
      (id) => id.toString() !== contactId,
    );
    await user.save();

    res.status(200).json({ message: "Contact unpinned successfully." });
  } catch (error) {
    Logger.error("Error unpinning contact", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ---------------------------------------------------------------------------
// User lookup helpers
// ---------------------------------------------------------------------------

export const isUserExists = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  res.status(200).json({ exists: !!user });
};

export const getUserOnlineStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    // Treat user as online if lastSeen is within the past 5 minutes
    const ONLINE_THRESHOLD_MS = 5 * 60 * 1000;
    const isOnline = user.lastSeen
      ? Date.now() - new Date(user.lastSeen).getTime() < ONLINE_THRESHOLD_MS
      : false;

    res.json({ isOnline, lastSeen: user.lastSeen, status: user.status });
  } catch (error) {
    Logger.error("Error checking user online status", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// ---------------------------------------------------------------------------
// Profile update
// ---------------------------------------------------------------------------

export const updateProfile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.user?._id;
  const { displayName, status } = req.body;
  const avatarFile = req.file;

  if (!userId) {
    res.status(400).json({ error: "User ID is required." });
    return;
  }

  if (!displayName?.trim()) {
    res.status(400).json({ error: "Display name is required." });
    return;
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    user.displayName = displayName.trim();
    if (status !== undefined) {
      user.status = status.trim() || "Hey there! I am using ChitChat.";
    }

    if (avatarFile) {
      const localFilePath = avatarFile.path;
      const oldAvatarUrl = user.avatarUrl;

      try {
        const secureUrl = await uploadToCloudinary(localFilePath, {
          folder: "chat-avatars",
          publicId: `avatar_${userId}_${Date.now()}`,
        });

        user.avatarUrl = secureUrl;

        // Clean up local temp file
        fs.unlink(localFilePath, (err) => {
          if (err) Logger.warn(`Could not delete temp file: ${localFilePath}`);
        });

        // Delete the old Cloudinary image in the background
        if (oldAvatarUrl && oldAvatarUrl !== secureUrl) {
          deleteCloudinaryAsset(oldAvatarUrl).catch((err) =>
            Logger.error("Background deletion of old avatar failed", err),
          );
        }
      } catch (uploadError) {
        // Clean up local temp file before responding
        fs.unlink(localFilePath, () => {});
        Logger.error("Cloudinary upload failed", uploadError);
        res.status(500).json({ error: "Failed to upload avatar image." });
        return;
      }
    }

    await user.save();

    // Propagate display name changes to other users' contact lists
    await UserModel.updateMany(
      { "contacts.user": userId },
      { $set: { "contacts.$.name": user.displayName } },
    );

    res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    Logger.error("Error updating profile", error);
    res.status(500).json({ error: "Internal server error." });
  }
};
