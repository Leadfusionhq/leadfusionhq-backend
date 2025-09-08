// components/ui/SpinnerLoader.tsx
import React from "react";

export type SpinnerSize = "small" | "medium" | "large" | "xlarge";
export type SpinnerColor = "blue" | "gray" | "white" | "green" | "red" | "purple" | "indigo";
export type SpinnerVariant = "default" | "dots" | "bars" | "pulse" | "nominal";

interface SpinnerLoaderProps {
  message?: string;
  size?: SpinnerSize;
  color?: SpinnerColor;
  variant?: SpinnerVariant;
  className?: string;
  fullScreen?: boolean;
}

const SpinnerLoader: React.FC<SpinnerLoaderProps> = ({ 
  message = "Loading...", 
  size = "medium",
  color = "blue",
  variant = "default",
  className = "",
  fullScreen = false
}) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    small: "h-6 w-6",
    medium: "h-8 w-8",
    large: "h-12 w-12",
    xlarge: "h-16 w-16"
  };
  
  const colorClasses: Record<SpinnerColor, string> = {
    blue: "text-blue-600",
    gray: "text-gray-600",
    white: "text-white",
    green: "text-green-600",
    red: "text-red-600",
    purple: "text-purple-600",
    indigo: "text-indigo-600"
  };

  const renderSpinner = () => {
    switch (variant) {
      case "dots":
        return (
          <div className={`flex space-x-1 ${colorClasses[color]}`}>
            <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-2 w-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
          </div>
        );
      
      case "bars":
        return (
          <div className={`flex space-x-1 ${colorClasses[color]} ${sizeClasses[size]}`}>
            <div className="h-full w-1 bg-current animate-pulse" style={{ animationDelay: '0.1s' }}></div>
            <div className="h-full w-1 bg-current animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-full w-1 bg-current animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="h-full w-1 bg-current animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            <div className="h-full w-1 bg-current animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          </div>
        );
      
      case "pulse":
        return (
          <div className={`rounded-full bg-current ${sizeClasses[size]} animate-pulse ${colorClasses[color]}`}></div>
        );
      
      case "nominal":
        return (
          <div className={`relative ${sizeClasses[size]}`}>
            <div className={`absolute inset-0 rounded-full border-2 border-current opacity-20`}></div>
            <div className={`absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin ${colorClasses[color]}`}></div>
          </div>
        );
      
      default:
        return (
          <div className={`animate-spin rounded-full border-2 border-current border-t-transparent ${sizeClasses[size]} ${colorClasses[color]}`}></div>
        );
    }
  };

  const containerClass = fullScreen 
    ? "fixed inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-50" 
    : "flex flex-col items-center justify-center py-12";

  return (
    <div className={`${containerClass} ${className}`}>
      {renderSpinner()}
      {message && <p className={`mt-4 text-sm ${color === 'white' ? 'text-white' : 'text-gray-600'}`}>{message}</p>}
    </div>
  );
};

export default SpinnerLoader;