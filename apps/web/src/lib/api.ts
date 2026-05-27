/**
 * Backward-compatible re-export barrel.
 *
 * All existing imports of the form:
 *   import api, { addAuthEventListener, ... } from '../lib/api'
 * continue to work without changes.
 *
 * New code should import from the specific modules:
 *   import api from './axiosInstance'
 *   import { addAuthEventListener } from './authEvents'
 *   import { getCallHistory } from './callApi'
 */

export { default } from "./axiosInstance";
export { addAuthEventListener, removeAuthEventListener } from "./authEvents";
export {
  getCallHistory,
  deleteCallHistoryEntry,
  clearCallHistory,
} from "./callApi";
export {
  searchUserSuggestions,
  sendContactRequest,
  getContactRequests,
  acceptContactRequest,
  rejectContactRequest,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "./notificationsApi";
