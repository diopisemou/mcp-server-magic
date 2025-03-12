
import React from 'react';
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Sparkles } from 'lucide-react';
import { cn } from "@/lib/utils";

interface BetaBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeProps["variant"];
  size?: "sm" | "md";
}

export function BetaBadge({ 
  variant = "outline", 
  size = "sm", 
  className, 
  ...props 
}: BetaBadgeProps) {
  return (
    <Badge 
      variant={variant} 
      className={cn(
        "bg-yellow-100 text-yellow-800 border-yellow-300",
        size === "sm" ? "text-xs" : "text-sm",
        className
      )} 
      {...props}
    >
      <Sparkles className={cn("mr-1", size === "sm" ? "h-3 w-3" : "h-4 w-4")} />
      BETA
    </Badge>
  );
}
