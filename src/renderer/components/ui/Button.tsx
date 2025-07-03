import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "warning";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
}

const Button: React.FC<ButtonProps> = React.memo(
  ({
    children,
    onClick,
    variant = "primary",
    size = "medium",
    disabled = false,
    type = "button",
    className = "",
    ...restProps
  }) => {
    const baseClasses = "button";
    const variantClasses = {
      primary: "button-primary",
      secondary: "button-secondary",
      danger: "button-danger",
      warning: "button-warning",
    };
    const sizeClasses = {
      small: "button-sm",
      medium: "",
      large: "button-lg",
    };

    const classes = [
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      disabled ? "button-disabled" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        type={type}
        className={classes}
        onClick={onClick}
        disabled={disabled}
        {...restProps}
      >
        {children}
      </button>
    );
  }
);

export default Button;
