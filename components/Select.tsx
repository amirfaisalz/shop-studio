import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: boolean;
}

export default function Select({
  label,
  options,
  helperText,
  error = false,
  className = '',
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          {label}
        </label>
      )}
      <select
        className={`h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm text-neutral-950 transition-all focus:outline-none focus:ring-2 focus:ring-[#FF4500]/30 disabled:bg-neutral-100 disabled:text-neutral-400 ${
          error
            ? 'border-red-500 text-red-600 focus:border-red-500'
            : 'border-neutral-200 hover:border-[#FF5722]/50 focus:border-[#FF3B00]'
        } ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && (
        <span className={`text-xs ${error ? 'text-red-600 font-medium' : 'text-neutral-500'}`}>
          {helperText}
        </span>
      )}
    </div>
  );
}

