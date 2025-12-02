import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export default function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}: ButtonProps) {
  const baseStyles = 'rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    // 🌸 Nouveau rose Bespona
    primary: 'bg-[#E31FC1] text-white hover:bg-[#d91bb3] active:bg-[#c217a4]',

    secondary: 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800',

    // 🌸 Outline rose
    outline: 'border-2 border-[#E31FC1] text-[#E31FC1] hover:bg-[#ffe4f7] active:bg-[#ffd2f1]',

    ghost: 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
