export const COUNTRY_CODES = [
  { name: "India", dial_code: "+91", code: "IN", flag: "🇮🇳" },
  { name: "United States", dial_code: "+1", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", dial_code: "+44", code: "GB", flag: "🇬🇧" },
  { name: "Canada", dial_code: "+1", code: "CA", flag: "🇨🇦" },
  { name: "Australia", dial_code: "+61", code: "AU", flag: "🇦🇺" },
  { name: "Germany", dial_code: "+49", code: "DE", flag: "🇩🇪" },
  { name: "France", dial_code: "+33", code: "FR", flag: "🇫🇷" },
  { name: "Brazil", dial_code: "+55", code: "BR", flag: "🇧🇷" },
  { name: "Japan", dial_code: "+81", code: "JP", flag: "🇯🇵" },
  { name: "China", dial_code: "+86", code: "CN", flag: "🇨🇳" },
  { name: "Russia", dial_code: "+7", code: "RU", flag: "🇷🇺" },
  { name: "Nepal", dial_code: "+977", code: "NP", flag: "🇳🇵" },
  { name: "Pakistan", dial_code: "+92", code: "PK", flag: "🇵🇰" },
  { name: "Bangladesh", dial_code: "+880", code: "BD", flag: "🇧🇩" },
];

// Get the backend URL from environment variables
export const API_BASE_URL =
  import.meta.env.VITE_BE_URL || "http://localhost:8000";

// Utility function to get full avatar URL
export const getAvatarUrl = (avatarPath?: string): string => {
  if (!avatarPath) return "";

  // If it's already a full URL, return as is
  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  // If it's a data URL (base64), return as is
  if (avatarPath.startsWith("data:")) {
    return avatarPath;
  }

  // If it's a relative path, prepend the API base URL
  return `${API_BASE_URL}${avatarPath.startsWith("/") ? "" : "/"}${avatarPath}`;
};
