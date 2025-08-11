import { Request, Response } from "express";
import { UserModel } from "../models/User";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const onAddContact = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?._id;
  const contactNo = req.body.contactNumber;

  if (!userId || !contactNo) {
    return res
      .status(400)
      .json({ error: "User ID and contact number are required." });
  }

  try {
    const existingUser = await UserModel.findById(userId);
    if (!existingUser) {
      return res.status(404).json({ error: "User not found." });
    }

    const existingContact = await UserModel.findOne({
      phoneNumber: contactNo,
    });
    if (!existingContact) {
      return res.status(404).json({ error: "Contact not found." });
    }

    // Check if contact already exists
    const contactExists = existingUser.contacts.some(
      (contact) =>
        contact.user.toString() ===
        (existingContact._id as mongoose.Types.ObjectId).toString()
    );

    if (contactExists) {
      return res.status(400).json({ error: "Contact already exists." });
    }

    // Don't allow adding yourself as a contact
    if (
      (existingUser._id as mongoose.Types.ObjectId).toString() ===
      (existingContact._id as mongoose.Types.ObjectId).toString()
    ) {
      return res
        .status(400)
        .json({ error: "Cannot add yourself as a contact." });
    }

    existingUser.contacts.push({
      user: existingContact._id as mongoose.Types.ObjectId,
      name: existingContact.displayName,
      phonenumber: existingContact.phoneNumber,
    });
    await existingUser.save();

    existingContact.contacts.push({
      user: existingUser._id as mongoose.Types.ObjectId,
      name: existingUser.displayName,
      phonenumber: existingUser.phoneNumber,
    });
    await existingContact.save();

    return res.status(200).json({
      message: "Contact added successfully.",
      contact: existingContact,
    });
  } catch (error) {
    console.error("Error adding contact:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const onGetContacts = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.contacts.length === 0) {
      return res.status(200).json({
        message: "No contacts found.",
        contacts: [],
      });
    }

    const contact_obj = await Promise.all(
      user.contacts.map(async (contact) => {
        const contactUser = await UserModel.findById(contact.user);
        return {
          user: contact.user.toString(), // Convert ObjectId to string
          name: contact.name,
          phonenumber: contact.phonenumber,
          avatarUrl: contactUser?.avatarUrl,
          isOnline: contactUser?.isOnline || false,
          lastSeen: contactUser?.lastSeen,
          displayName: contactUser?.displayName,
          blocked: user.blockedContacts?.includes(contactUser?._id as any),
          pinned: user.pinnedContacts?.includes(contactUser?._id as any),
        };
      })
    );

    return res.status(200).json({
      message: "Contacts retrieved successfully.",
      contacts: contact_obj,
    });
  } catch (error) {
    console.error("Error getting contacts:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

const getAvatarUrl = async (userId: any): Promise<string | undefined> => {
  const user = await UserModel.findById(userId);
  return user?.avatarUrl;
};

export const isUserExists = async (
  req: Request,
  res: Response
): Promise<any> => {
  const phoneNumber = req.body.phoneNumber;
  const user = await UserModel.findOne({ phoneNumber });
  return res.status(200).json({
    exists: !!user,
  });
};

export const getUserOnlineStatus = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Consider user online if lastSeen is within the last 5 minutes
    const isOnline = user.lastSeen
      ? new Date().getTime() - new Date(user.lastSeen).getTime() < 5 * 60 * 1000
      : false;

    return res.json({
      isOnline,
      lastSeen: user.lastSeen,
      status: user.status,
    });
  } catch (error) {
    console.error("Error checking user online status:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// block and unblock contacts
export const onBlockContact = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?._id;
  const blockUserId = req.body.blockUserId;

  if (!userId || !blockUserId) {
    return res
      .status(400)
      .json({ error: "User ID and block user ID are required." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the user is already blocked
    if (user.blockedContacts?.includes(blockUserId)) {
      return res.status(400).json({ error: "User is already blocked." });
    }

    // Add to blocked contacts
    user.blockedContacts = [...(user.blockedContacts || []), blockUserId];
    await user.save();

    return res.status(200).json({
      message: "User blocked successfully.",
      blockedUserId: blockUserId,
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const onUnblockContact = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const userId = req.user?._id;
    const unblockUserId = req.body.unblockUserId;

    if (!userId || !unblockUserId) {
      return res
        .status(400)
        .json({ error: "User ID and unblock user ID are required." });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { blockedContacts: unblockUserId } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found." });
    }
    return res.status(200).json({
      message: "User unblocked successfully.",
      updatedBlockedContacts: updatedUser.blockedContacts,
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const onPinContact = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?._id;
  const contactId = req.body.contactId;
  if (!userId || !contactId) {
    return res
      .status(400)
      .json({ error: "User ID and contact ID are required." });
  }
  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the contact is already pinned
    if (user.pinnedContacts?.includes(contactId)) {
      return res.status(400).json({ error: "Contact is already pinned." });
    }

    // Add to pinned contacts
    user.pinnedContacts = [...(user.pinnedContacts || []), contactId];
    await user.save();

    return res.status(200).json({
      message: "Contact pinned successfully.",
      pinnedContactId: user.pinnedContacts,
    });
  } catch (error) {
    console.error("Error pinning contact:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const onUnpinContact = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?._id;
  const contactId = req.body.contactId;

  if (!userId || !contactId) {
    return res
      .status(400)
      .json({ error: "User ID and contact ID are required." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Check if the contact is pinned
    if (!user.pinnedContacts?.includes(contactId)) {
      return res.status(400).json({ error: "Contact is not pinned." });
    }

    // Remove from pinned contacts
    user.pinnedContacts = user.pinnedContacts.filter(
      (id) => id.toString() !== contactId.toString()
    );
    await user.save();

    return res.status(200).json({
      message: "Contact unpinned successfully.",
      unpinnedContactId: user.pinnedContacts,
    });
  } catch (error) {
    console.error("Error unpinning contact:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../../uploads/avatars");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Helper function to delete old Cloudinary image
const deleteOldCloudinaryImage = async (imageUrl: string): Promise<void> => {
  try {
    // Check if it's a Cloudinary URL
    if (!imageUrl.includes("cloudinary.com")) {
      console.log("Not a Cloudinary URL, skipping deletion:", imageUrl);
      return;
    }

    // Extract public_id from Cloudinary URL
    // URL formats:
    // https://res.cloudinary.com/[cloud_name]/image/upload/v[version]/[folder]/[public_id].[format]
    // https://res.cloudinary.com/[cloud_name]/image/upload/[folder]/[public_id].[format]
    // https://res.cloudinary.com/[cloud_name]/image/upload/[public_id].[format]

    const urlMatch = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (!urlMatch) {
      console.error("Could not extract public_id from URL:", imageUrl);
      return;
    }

    // Get the path after /upload/ (and optional version)
    const pathAfterUpload = urlMatch[1];

    // Remove file extension (.jpg, .png, etc.)
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, "");

    console.log(
      `Attempting to delete Cloudinary image with public_id: ${publicId}`
    );

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      console.log(`Successfully deleted old Cloudinary image: ${publicId}`);
    } else if (result.result === "not found") {
      console.log(
        `Cloudinary image not found (may have been already deleted): ${publicId}`
      );
    } else {
      console.warn(
        `Unexpected result when deleting Cloudinary image: ${result.result}`
      );
    }
  } catch (error) {
    console.error("Error deleting old Cloudinary image:", error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response
): Promise<any> => {
  const userId = req.user?._id;
  const { displayName, status } = req.body;
  const avatarFile = req.file;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required." });
  }

  if (!displayName?.trim()) {
    return res.status(400).json({ error: "Display name is required." });
  }

  try {
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Update basic fields
    user.displayName = displayName.trim();
    if (status !== undefined) {
      user.status = status.trim() || "Hey there! I am using ChitChat.";
    }

    // Handle avatar upload with Cloudinary
    if (avatarFile) {
      const localFilePath = path.resolve(avatarFile.path);
      const oldAvatarUrl = user.avatarUrl; // Store old URL before updating

      try {
        // 1. Upload local file to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {
          folder: "chat-avatars",
          public_id: `avatar_${userId}_${Date.now()}`,
          overwrite: true,
          resource_type: "image",
        });

        // 2. Update user with new avatar URL
        user.avatarUrl = result.secure_url;

        // 3. Delete the local file
        fs.unlink(localFilePath, (err) => {
          if (err) console.error("Error deleting local file:", err);
        });

        // 4. Delete old avatar from Cloudinary if it exists (do this after successful upload)
        if (oldAvatarUrl && oldAvatarUrl !== result.secure_url) {
          // Run deletion in background to not block the response
          deleteOldCloudinaryImage(oldAvatarUrl).catch((error) => {
            console.error("Background deletion of old avatar failed:", error);
          });
        }
      } catch (cloudinaryError) {
        console.error("Error uploading to Cloudinary:", cloudinaryError);

        // Clean up local file if Cloudinary upload fails
        fs.unlink(localFilePath, (err) => {
          if (err)
            console.error(
              "Error deleting local file after failed upload:",
              err
            );
        });

        return res
          .status(500)
          .json({ error: "Failed to upload avatar image." });
      }
    }

    await user.save();

    // Update contacts in other users who have this user as contact
    await UserModel.updateMany(
      { "contacts.user": userId },
      {
        $set: {
          "contacts.$.name": user.displayName,
        },
      }
    );

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: {
        _id: user._id,
        phoneNumber: user.phoneNumber,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        status: user.status,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const uploadMiddleware = upload.single("avatar");

// Optional: Function to manually delete a Cloudinary image (for testing/cleanup)
export const deleteCloudinaryImage = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "Image URL is required." });
  }

  try {
    await deleteOldCloudinaryImage(imageUrl);
    return res.status(200).json({
      message: "Image deletion attempted.",
      imageUrl,
    });
  } catch (error) {
    console.error("Error in manual image deletion:", error);
    return res.status(500).json({ error: "Failed to delete image." });
  }
};
