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
        <label className="text-xs font-bold uppercase tracking-wider text-[#0F1724]">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type={effectiveType}
          className={`h-11 w-full rounded-xl border bg-neutral-50/60 px-4 py-2 text-sm text-[#0F1724] transition-all placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF5840]/30 disabled:bg-neutral-100 disabled:text-neutral-400 ${
            error
              ? 'border-error text-error focus:border-error focus:ring-error/20'
              : 'border-[#e2dcda] hover:border-[#FF5840]/50 focus:border-[#FF5840]'
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
        <span className={`text-xs ${error ? 'text-error font-medium' : 'text-neutral-500'}`}>
          {helperText}
        </span>
      )}
    </div>
  );
}
