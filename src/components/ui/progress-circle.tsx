import React from "react";

interface ProgressCircleProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({ className, ...props }) => {
  return (
    <div 
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${className}`} 
      role="status"
      {...props}
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};