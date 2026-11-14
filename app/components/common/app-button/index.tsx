"use client";

import React, { type ButtonHTMLAttributes, type ReactNode } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import styles from "./app-button.module.css";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type AppButtonSize = "default" | "small" | "pill";

export interface AppButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
  loading?: boolean;
}

export default function AppButton({
  variant = "primary",
  size = "default",
  icon,
  children,
  className = "",
  disabled,
  loading = false,
  type = "button",
  ...props
}: AppButtonProps) {
  const variantClass = styles[variant] || styles.primary;
  const sizeClass =
    size === "small"
      ? styles.sizeSmall
      : size === "pill"
        ? styles.sizePill
        : "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${styles.button} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {loading ? (
        <LoadingOutlined spin style={{ display: "inline-flex", alignItems: "center" }} />
      ) : (
        icon && <span style={{ display: "inline-flex", alignItems: "center" }}>{icon}</span>
      )}
      {children && <span>{children}</span>}
    </button>
  );
}

export { styles as appButtonStyles };
