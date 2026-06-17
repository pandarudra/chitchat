import React from "react";
import { cn } from "../../lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-hairline dark:border-hairline bg-canvas dark:bg-canvas px-4 py-2 text-body-sm placeholder-muted dark:placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
