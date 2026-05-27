import express from "express";
import {
  isUserExists,
  onAddContact,
  onGetContacts,
  onSearchUsers,
  onGetContactRequests,
  onAcceptContactRequest,
  onRejectContactRequest,
  onGetNotifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  getUserOnlineStatus,
  onBlockContact,
  onUnblockContact,
  onPinContact,
  onUnpinContact,
  onDeleteContact,
  updateProfile,
  uploadMiddleware,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
const userRouter = express.Router();

userRouter.post("/add-contact", authenticate, onAddContact);
userRouter.get("/suggestions", authenticate, onSearchUsers);
userRouter.get("/requests", authenticate, onGetContactRequests);
userRouter.post(
  "/requests/:requestId/accept",
  authenticate,
  onAcceptContactRequest,
);
userRouter.post(
  "/requests/:requestId/reject",
  authenticate,
  onRejectContactRequest,
);
userRouter.get("/contacts", authenticate, onGetContacts);
userRouter.post("/delete-contact", authenticate, onDeleteContact);
userRouter.get("/notifications", authenticate, onGetNotifications);
userRouter.post(
  "/notifications/:notificationId/read",
  authenticate,
  onMarkNotificationRead,
);
userRouter.post(
  "/notifications/read-all",
  authenticate,
  onMarkAllNotificationsRead,
);

userRouter.post("/is-user-exists", isUserExists);
userRouter.get("/online-status/:userId", authenticate, getUserOnlineStatus);

userRouter.post("/block-contact", authenticate, onBlockContact);
userRouter.post("/unblock-contact", authenticate, onUnblockContact);

userRouter.post("/pin-contact", authenticate, onPinContact);
userRouter.post("/unpin-contact", authenticate, onUnpinContact);

userRouter.put("/profile", authenticate, uploadMiddleware, updateProfile);

export default userRouter;
