import React from "react";

interface LoadingIndicatorProps {
  message?: string;
  size?: "small" | "medium" | "large";
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = React.memo(
  ({ message = "読み込み中...", size = "medium" }) => {
    const sizeClasses = {
      small: "loading-small",
      medium: "",
      large: "loading-large",
    };

    return (
      <div
        className={`loading-indicator ${sizeClasses[size]}`}
        role="status"
        aria-label="データを読み込んでいます"
      >
        <div className="spinner"></div>
        <p>{message}</p>
      </div>
    );
  }
);

export default LoadingIndicator;
