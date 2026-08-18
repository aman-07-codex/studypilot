import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps {
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "secondary" | "outline" | "danger" | "success" | "warning";
}

export function Badge({ className, children, variant = "default", ...props }: BadgeProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "bg-primary text-primary-foreground hover:bg-primary/80": variant === "default",
          "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
          "text-foreground border border-input": variant === "outline",
          "bg-danger text-danger-foreground hover:bg-danger/80": variant === "danger",
          "bg-success text-success-foreground hover:bg-success/80": variant === "success",
          "bg-warning text-warning-foreground hover:bg-warning/80": variant === "warning",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
