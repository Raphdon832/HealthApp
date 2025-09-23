export function Button({ className = '', children, variant = 'primary', size = 'md', ...props }) {
  const baseClasses = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed btn-interactive';
  
  const variants = {
    primary: 'border-transparent bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500 shadow-md hover:shadow-lg',
    secondary: 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-500 shadow-sm hover:shadow-md',
    outline: 'border-sky-600 bg-transparent text-sky-600 hover:bg-sky-50 focus:ring-sky-500',
    ghost: 'border-transparent bg-transparent text-zinc-600 hover:bg-zinc-100 focus:ring-zinc-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}