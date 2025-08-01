import { Request, Response } from "express";
import { UserModel } from "../models/User";
import mongoose from "mongoose";

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
          user: contact.user,
          name: contact.name,
          phonenumber: contact.phonenumber,
          avatarUrl: contactUser?.avatarUrl,
          isOnline: contactUser?.isOnline || false,
          lastSeen: contactUser?.lastSeen,
          displayName: contactUser?.displayName,
          blocked: user.blockedContacts?.includes(contactUser?._id as any),
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
