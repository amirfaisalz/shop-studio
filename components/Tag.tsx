import React from 'react';
import { X } from 'lucide-react';

type TagVariant = 'default' | 'primary' | 'fiery' | 'success' | 'warning' | 'error' | 'info' | 'purple';

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant;
  onRemove?: () => void;
  children: React.ReactNode;
}

const variantStyles: Record<TagVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: 'bg-neutral-100',
    text: 'text-neutral-700',
    border: 'border-neutral-200',
  },
  primary: {
    bg: 'bg-[#FFF3EE]',
    text: 'text-[#FF3B00]',
    border: 'border-[#FFCCBC]',
  },
  fiery: {
    bg: 'bg-[#FFF3EE]',
    text: 'text-[#FF3B00]',
    border: 'border-[#FFCCBC]',
  },
  success: {
    bg: 'bg-[#F0FDF4]',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  warning: {
    bg: 'bg-[#FFFBEB]',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  error: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
  info: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  purple: {
    bg: 'bg-[#F0E9FF]',
    text: 'text-[#8B5CF8]',
    border: 'border-[#DDD6FE]',
  },
};

export default function Tag({
  variant = 'default',
  onRemove,
  children,
  className = '',
  ...props
}: TagProps) {
  const styles = variantStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles.bg} ${styles.text} ${styles.border} ${className}`}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
          aria-label="Remove tag"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}

