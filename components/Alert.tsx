import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

type AlertVariant = 'success' | 'warning' | 'error' | 'info';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
  children: React.ReactNode;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; iconColor: string; titleColor: string; textColor: string; icon: React.ReactNode }> = {
  success: {
    bg: 'bg-[#F0FDF4]',
    border: 'border-emerald-200',
    iconColor: 'text-[#10B981]',
    titleColor: 'text-emerald-950',
    textColor: 'text-emerald-800',
    icon: <CheckCircle2 size={18} className="text-[#10B981]" />,
  },
  warning: {
    bg: 'bg-[#FFFBEB]',
    border: 'border-amber-200',
    iconColor: 'text-[#F59E0B]',
    titleColor: 'text-amber-950',
    textColor: 'text-amber-800',
    icon: <AlertTriangle size={18} className="text-[#F59E0B]" />,
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-950',
    textColor: 'text-red-800',
    icon: <AlertCircle size={18} className="text-red-600]" />,
  },
  info: {
    bg: 'bg-[#FFF3EE]',
    border: 'border-[#FFCCBC]',
    iconColor: 'text-[#FF3B00]',
    titleColor: 'text-neutral-950',
    textColor: 'text-neutral-700',
    icon: <Info size={18} className="text-[#FF3B00]" />,
  },
};

export default function Alert({
  variant = 'info',
  title,
  onDismiss,
  children,
  className = '',
  ...props
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={`${styles.bg} ${styles.border} border rounded-2xl p-4 flex items-start gap-3 shadow-2xs ${className}`}
      {...props}
    >
      <div className="shrink-0 mt-0.5">
        {styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className={`${styles.titleColor} font-bold text-xs sm:text-sm mb-0.5`}>
            {title}
          </h3>
        )}
        <div className={`${styles.textColor} text-xs sm:text-sm font-medium leading-relaxed`}>
          {children}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-neutral-400 hover:text-neutral-700 transition-colors shrink-0 p-0.5 rounded-lg hover:bg-black/5"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

