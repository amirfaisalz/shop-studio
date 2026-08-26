import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon' | 'dark';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-gradient-to-r from-[#FF3B00] via-[#FF5E00] to-[#FFAA00] text-white shadow-[0_2px_12px_rgba(255,59,0,0.3)] hover:brightness-105 hover:shadow-[0_4px_16px_rgba(255,59,0,0.4)] active:scale-[0.98] disabled:opacity-50 disabled:shadow-none',
  secondary: 'border border-neutral-200 bg-white text-neutral-800 shadow-2xs hover:bg-neutral-50 hover:border-neutral-300 active:bg-neutral-100 disabled:opacity-50 disabled:bg-neutral-100',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 active:bg-neutral-200 disabled:text-neutral-300',
  dark: 'bg-neutral-950 text-white shadow-xs hover:bg-neutral-900 active:scale-[0.98] disabled:opacity-50',
  icon: 'p-2 text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 disabled:text-neutral-300 rounded-xl',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl h-8',
  md: 'px-4 py-2 text-xs sm:text-sm font-bold rounded-xl h-10',
  lg: 'px-6 py-3 text-sm sm:text-base font-bold rounded-2xl h-12',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  asChild = false,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'font-bold transition-all inline-flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#FF4500]/30 disabled:cursor-not-allowed';
  const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<Record<string, unknown>>, {
      className: `${classes} ${(children as React.ReactElement<Record<string, unknown>>).props.className || ''}`,
      disabled,
      ...props,
    });
  }

  return (
    <button
      className={classes}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

