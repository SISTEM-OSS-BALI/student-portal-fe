"use client";

import React, { HTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";
import styles from "./app-typography.module.css";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  className?: string;
}

export interface TextProps extends HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "muted" | "danger";
  strong?: boolean;
  as?: "p" | "span" | "div";
  className?: string;
}

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export interface CaptionProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  className?: string;
}

export const H1 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, className = "", ...props }, ref) => (
    <h1 ref={ref} className={`${styles.h1} ${className}`.trim()} {...props}>
      {children}
    </h1>
  ),
);
H1.displayName = "AppTypography.H1";

export const H2 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, className = "", ...props }, ref) => (
    <h2 ref={ref} className={`${styles.h2} ${className}`.trim()} {...props}>
      {children}
    </h2>
  ),
);
H2.displayName = "AppTypography.H2";

export const H3 = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ children, className = "", ...props }, ref) => (
    <h3 ref={ref} className={`${styles.h3} ${className}`.trim()} {...props}>
      {children}
    </h3>
  ),
);
H3.displayName = "AppTypography.H3";

export const Text = forwardRef<HTMLElement, TextProps>(
  (
    {
      children,
      variant = "default",
      strong = false,
      as = "span",
      className = "",
      ...props
    },
    ref,
  ) => {
    const Component = as as any;
    const variantClass =
      variant === "secondary"
        ? styles.textSecondary
        : variant === "muted"
          ? styles.textMuted
          : variant === "danger"
            ? styles.textDanger
            : styles.textDefault;

    const strongClass = strong ? styles.textStrong : "";

    return (
      <Component
        ref={ref}
        className={`${styles.text} ${variantClass} ${strongClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
Text.displayName = "AppTypography.Text";

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, required = false, className = "", ...props }, ref) => {
    const reqClass = required ? styles.labelRequired : "";
    return (
      <label
        ref={ref}
        className={`${styles.label} ${reqClass} ${className}`.trim()}
        {...props}
      >
        {children}
      </label>
    );
  },
);
Label.displayName = "AppTypography.Label";

export const Caption = forwardRef<HTMLSpanElement, CaptionProps>(
  ({ children, className = "", ...props }, ref) => (
    <span
      ref={ref}
      className={`${styles.caption} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  ),
);
Caption.displayName = "AppTypography.Caption";

export const AppTypography = {
  H1,
  H2,
  H3,
  Text,
  Label,
  Caption,
};

export default AppTypography;
