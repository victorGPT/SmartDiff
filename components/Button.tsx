import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  icon,
  className = '',
  disabled,
  ...props 
}) => {
  
  const baseStyles = "inline-flex items-center justify-center px-5 py-2 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-20 disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-wide";
  
  const variants = {
    primary: "bg-[#0071e3] text-white hover:bg-[#0077ED] focus:ring-[#0071e3] shadow-md hover:shadow-lg transform active:scale-95",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus:ring-slate-300 shadow-sm hover:shadow transform active:scale-95",
    ghost: "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 focus:ring-slate-200"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {!isLoading && icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};