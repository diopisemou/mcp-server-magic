
import React from 'react';
import { cn } from "@/lib/utils";

interface ProgressCircleProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  size = 'md',
  className,
}) => {
  const radius = size === 'sm' ? 9 : size === 'md' ? 18 : 27;
  const strokeWidth = size === 'sm' ? 2 : size === 'md' ? 3 : 4;
  const viewBoxSize = radius * 2 + strokeWidth * 2;
  const center = viewBoxSize / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className={cn(sizeClasses[size], "relative", className)}>
      <svg
        className="h-full w-full -rotate-90"
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted-foreground/20"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300 ease-in-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
        {Math.round(value)}%
      </div>
    </div>
  );
};
