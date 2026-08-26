'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: boolean;
}

export default function Input({
  label,
  helperText,
  error = false,
  type = 'text',
  className = '',
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={effectiveType}
          className={`h-11 w-full rounded-xl border bg-white px-4 py-2 text-sm text-neutral-950 transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-[#FF4500]/30 disabled:bg-neutral-100 disabled:text-neutral-400 ${
            error
              ? 'border-red-500 text-red-600 focus:border-red-500 focus:ring-red-500/20'
              : 'border-neutral-200 hover:border-[#FF5722]/50 focus:border-[#FF3B00]'
          } ${isPassword ? 'pr-11' : ''} ${className}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {helperText && (
        <span className={`text-xs ${error ? 'text-red-600 font-medium' : 'text-neutral-500'}`}>
          {helperText}
        </span>
      )}
    </div>
  );
}

