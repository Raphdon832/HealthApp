import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingButton({ 
  loading = false, 
  children, 
  loadingText = 'Loading...', 
  className = '', 
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props 
}) {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed btn-interactive relative overflow-hidden';
  
  const variants = {
    primary: 'border-transparent bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 shadow-md hover:shadow-lg disabled:bg-sky-400',
    secondary: 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-500 shadow-sm hover:shadow-md disabled:bg-zinc-100',
    outline: 'border-sky-600 bg-transparent text-sky-600 hover:bg-sky-50 focus:ring-sky-500 disabled:border-zinc-300 disabled:text-zinc-400',
    ghost: 'border-transparent bg-transparent text-zinc-600 hover:bg-zinc-100 focus:ring-zinc-500 disabled:text-zinc-400'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const isDisabled = disabled || loading;

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${
        loading ? 'cursor-wait' : ''
      }`}
      disabled={isDisabled}
      {...props}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-full">
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText && (
            <span className="ml-2 text-inherit">{loadingText}</span>
          )}
        </div>
      )}
      
      {/* Button content */}
      <div className={`transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>

      {/* Ripple effect on click */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 rounded-full transition-all duration-300 hover:bg-white/10" />
      </div>
    </button>
  );
}
