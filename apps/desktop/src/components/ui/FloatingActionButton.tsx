import React from "react";
import { Plus } from "lucide-react";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  className?: string;
  title?: string;
  position?: "bottom-right" | "bottom-left";
}

export function FloatingActionButton({
  onClick,
  icon = <Plus className="h-6 w-6" />,
  className = "",
  title = "Add Contact",
  position = "bottom-right",
}: FloatingActionButtonProps) {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        fixed ${positionClasses[position]}
        w-14 h-14 
        bg-green-500 hover:bg-green-600 
        text-white 
        rounded-full 
        shadow-lg hover:shadow-xl 
        flex items-center justify-center 
        transition-all duration-200 
        z-40
        group
        ${className}
      `}
    >
      <div className="transform group-hover:scale-110 transition-transform">
        {icon}
      </div>
    </button>
  );
}
