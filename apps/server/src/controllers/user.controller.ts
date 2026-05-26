import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UserModel } from "../models/User";
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

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const onAddContact = async (req: Request, res: Response): Promise<void> => {
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

    const existingContactId = (existingContact._id as any).toString();
    const currentUserId = (existingUser._id as any).toString();

    if (currentUserId === existingContactId) {
      res.status(400).json({ error: "Cannot add yourself as a contact." });
      return;
    }

    const alreadyAdded = existingUser.contacts.some(
      (c) => c.user.toString() === existingContactId
    );
    if (alreadyAdded) {
      res.status(400).json({ error: "Contact already exists." });
      return;
    }

    // Add the contact bidirectionally
    existingUser.contacts.push({
      user: existingContact._id as any,
      name: existingContact.displayName,
      email: existingContact.email,
    });

    existingContact.contacts.push({
      user: existingUser._id as any,
      name: existingUser.displayName,
      email: existingUser.email,
    });

    await Promise.all([existingUser.save(), existingContact.save()]);

    res.status(200).json({
      message: "Contact added successfully.",
      contact: existingContact,
    });
  } catch (error) {
    Logger.error("Error adding contact", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onGetContacts = async (req: Request, res: Response): Promise<void> => {
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
          blocked: user.blockedContacts?.some(
            (b) => b.toString() === contactUser?._id?.toString()
          ) ?? false,
          pinned: user.pinnedContacts?.some(
            (p) => p.toString() === contactUser?._id?.toString()
          ) ?? false,
          isAI: false,
        };
      })
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

export const onDeleteContact = async (req: Request, res: Response): Promise<void> => {
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
      (c) => c.user.toString() === contactId
    );
    if (contactIndex === -1) {
      res.status(404).json({ error: "Contact not found." });
      return;
    }

    user.contacts.splice(contactIndex, 1);

    // Also unpin the contact if it was pinned
    if (user.pinnedContacts) {
      user.pinnedContacts = user.pinnedContacts.filter(
        (id) => id.toString() !== contactId
      );
    }

    await user.save();
    res.status(200).json({ success: true, message: "Contact deleted successfully." });
  } catch (error) {
    Logger.error("Error deleting contact", error);
    res.status(500).json({ error: "Failed to delete contact." });
  }
};

// ---------------------------------------------------------------------------
// Block / Unblock
// ---------------------------------------------------------------------------

export const onBlockContact = async (req: Request, res: Response): Promise<void> => {
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

    res.status(200).json({ message: "User blocked successfully.", blockedUserId: blockUserId });
  } catch (error) {
    Logger.error("Error blocking user", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onUnblockContact = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?._id;
  const { unblockUserId } = req.body;

  if (!userId || !unblockUserId) {
    res.status(400).json({ error: "User ID and unblock user ID are required." });
    return;
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { blockedContacts: unblockUserId } },
      { new: true }
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

export const onPinContact = async (req: Request, res: Response): Promise<void> => {
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

    res.status(200).json({ message: "Contact pinned successfully.", pinnedContactId: contactId });
  } catch (error) {
    Logger.error("Error pinning contact", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const onUnpinContact = async (req: Request, res: Response): Promise<void> => {
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
      (id) => id.toString() !== contactId
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

export const isUserExists = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await UserModel.findOne({ email });
  res.status(200).json({ exists: !!user });
};

export const getUserOnlineStatus = async (req: Request, res: Response): Promise<void> => {
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

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
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
            Logger.error("Background deletion of old avatar failed", err)
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
      { $set: { "contacts.$.name": user.displayName } }
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
