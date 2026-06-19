'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--brand)',
    color: 'white',
    border: 'none',
  },
  secondary: {
    background: 'white',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--brand)',
    border: '1px solid var(--brand)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
  danger: {
    background: '#EF4444',
    color: 'white',
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: '6px 14px', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-sm)' },
  md: { padding: '9px 18px', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-md)' },
  lg: { padding: '12px 24px', fontSize: 'var(--text-lg)', borderRadius: 'var(--radius-md)' },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  onClick,
  type = 'button',
  className,
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      type={type}
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        lineHeight: 1.3,
        fontFamily: 'inherit',
        opacity: disabled ? 0.55 : 1,
        transition: 'all 0.15s ease',
        ...(variant === 'primary' && hovered && !disabled ? { background: 'var(--brand-hover)', boxShadow: '0 4px 12px rgba(232, 83, 29, 0.3)' } : {}),
        ...(variant === 'secondary' && hovered && !disabled ? { background: 'var(--bg-hover)', borderColor: 'var(--border-strong)' } : {}),
        ...(variant === 'outline' && hovered && !disabled ? { background: 'var(--brand-light)' } : {}),
        ...(variant === 'ghost' && hovered && !disabled ? { background: 'var(--bg-hover)' } : {}),
        ...(variant === 'danger' && hovered && !disabled ? { background: '#DC2626' } : {}),
      }}
    >
      {loading ? (
        <span style={{ width: 16, height: 16, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      ) : icon ? (
        icon
      ) : null}
      {children}
    </button>
  );
}
