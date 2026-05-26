/** UserAvatar shown inside call screens. */

import { User } from "lucide-react";
import { getAvatarUrl } from "../../utils/constants";

interface CallAvatarProps {
  avatarUrl?: string;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  pulsing?: boolean;
}

const SIZE_CLASSES = {
  sm: { outer: "w-24 h-24", icon: "w-12 h-12" },
  md: { outer: "w-32 h-32", icon: "w-16 h-16" },
  lg: { outer: "w-32 h-32", icon: "w-16 h-16" },
};

export function CallAvatar({
  avatarUrl,
  displayName,
  size = "md",
  pulsing = false,
}: CallAvatarProps) {
  const cls = SIZE_CLASSES[size];
  return (
    <div
      className={`${cls.outer} mx-auto rounded-full overflow-hidden bg-gray-700 flex items-center justify-center ${pulsing ? "ring-4 ring-green-500 ring-opacity-50 animate-pulse" : ""}`}
    >
      {avatarUrl ? (
        <img
          src={getAvatarUrl(avatarUrl)}
          alt={displayName}
          className="w-full h-full object-cover"
        />
      ) : (
        <User className={`${cls.icon} text-gray-400`} />
      )}
    </div>
  );
}
