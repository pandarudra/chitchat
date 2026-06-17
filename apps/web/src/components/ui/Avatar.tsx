import { useState } from "react";
import { getAvatarUrl } from "../../utils/constants";

interface AvatarProps {
  user?: {
    avatarUrl?: string | null;
    displayName?: string | null;
  } | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  showOnlineBadge?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8 rounded-md text-xs",
  md: "w-10 h-10 rounded-md text-sm",
  lg: "w-12 h-12 rounded-lg text-base",
};

export function Avatar({ user, size = "md", className = "", showOnlineBadge = false }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initial = user?.displayName?.charAt(0)?.toUpperCase() || "U";
  const hasValidImage = user?.avatarUrl && !imageError;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {hasValidImage ? (
        <img
          src={getAvatarUrl(user.avatarUrl as string)}
          alt={user?.displayName || "User Avatar"}
          className={`${sizeClasses[size]} object-cover shadow-xs border border-hairline bg-surface-card`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} bg-primary flex items-center justify-center text-on-dark font-medium shadow-xs border border-hairline`}
        >
          {initial}
        </div>
      )}
      {showOnlineBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success border-2 border-canvas rounded-full"></div>
      )}
    </div>
  );
}
