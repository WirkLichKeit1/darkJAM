"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: {
    backgroundColor: "var(--accent)",
    color: "var(--background)",
    border: "none",
  },
  secondary: {
    backgroundColor: "transparent",
    color: "var(--text-primary)",
    border: "1px solid var(--border)",
  },
  ghost: {
    backgroundColor: "transparent",
    color: "var(--text-secondary)",
    border: "none",
  },
  danger: {
    backgroundColor: "transparent",
    color: "#ef4444",
    border: "1px solid #ef444440",
  },
};

const sizeStyles = {
  sm: { padding: "0.35rem 0.75rem", fontSize: "0.8rem" },
  md: { padding: "0.6rem 1.25rem", fontSize: "0.875rem" },
  lg: { padding: "0.75rem 1.75rem", fontSize: "1rem" },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, fullWidth, children, disabled, style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{
          ...variantStyles[variant],
          ...sizeStyles[size],
          width: fullWidth ? "100%" : undefined,
          borderRadius: "8px",
          fontWeight: 600,
          cursor: disabled || loading ? "not-allowed" : "pointer",
          opacity: disabled || loading ? 0.5 : 1,
          transition: "all 0.2s ease",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          letterSpacing: "0.01em",
          ...style,
        }}
        onMouseEnter={(e) => {
          if (!disabled && !loading) {
            if (variant === "primary") e.currentTarget.style.backgroundColor = "var(--accent-hover)";
            if (variant === "secondary") e.currentTarget.style.borderColor = "var(--text-muted)";
            if (variant === "ghost") e.currentTarget.style.color = "var(--text-primary)";
          }
        }}
        onMouseLeave={(e) => {
          if (variant === "primary") e.currentTarget.style.backgroundColor = "var(--accent)";
          if (variant === "secondary") e.currentTarget.style.borderColor = "var(--border)";
          if (variant === "ghost") e.currentTarget.style.color = "var(--text-secondary)";
        }}
        {...props}
      >
        {loading ? (
          <>
            <span style={{
              width: "14px", height: "14px",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              display: "inline-block",
            }} />
            Carregando...
          </>
        ) : children}
      </button>
    );
  }
);

Button.displayName = "Button";

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.8rem", fontWeight: 500, color: "var(--text-secondary)", letterSpacing: "0.03em" }}>
          {label}
        </label>
      )}
      <input
        style={{
          backgroundColor: "var(--surface-alt)",
          border: `1px solid ${error ? "#ef4444" : "var(--border)"}`,
          borderRadius: "8px",
          padding: "0.65rem 1rem",
          fontSize: "0.9rem",
          color: "var(--text-primary)",
          outline: "none",
          transition: "border-color 0.2s",
          width: "100%",
          ...style,
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "var(--accent)"; }}
        onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "var(--border)"; }}
        {...props}
      />
      {error && <span style={{ fontSize: "0.75rem", color: "#ef4444" }}>{error}</span>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ width = "100%", height = "1rem", borderRadius = "6px", style }: SkeletonProps) {
  return (
    <>
      <div style={{
        width, height, borderRadius,
        backgroundColor: "var(--surface-alt)",
        backgroundImage: "linear-gradient(90deg, var(--surface-alt) 0%, var(--border) 50%, var(--surface-alt) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s infinite",
        ...style,
      }} />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "success" | "warning" | "error";
}

const badgeVariants = {
  default: { backgroundColor: "var(--surface-alt)", color: "var(--text-secondary)" },
  accent: { backgroundColor: "var(--accent-muted)", color: "var(--accent)" },
  success: { backgroundColor: "#16a34a20", color: "#4ade80" },
  warning: { backgroundColor: "#d9770620", color: "#fb923c" },
  error: { backgroundColor: "#ef444420", color: "#f87171" },
};

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span style={{
      ...badgeVariants[variant],
      fontSize: "0.7rem",
      fontWeight: 600,
      padding: "0.2rem 0.6rem",
      borderRadius: "999px",
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      display: "inline-block",
    }}>
      {children}
    </span>
  );
}