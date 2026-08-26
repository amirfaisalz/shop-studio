import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  shadow?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'sm' | 'md' | 'lg';
}

const shadowStyles = {
  sm: 'shadow-2xs',
  md: 'shadow-xs',
  lg: 'shadow-md',
  xl: 'shadow-xl',
};

const paddingStyles = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  shadow = 'md',
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-neutral-200/90 ${shadowStyles[shadow]} ${paddingStyles[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

