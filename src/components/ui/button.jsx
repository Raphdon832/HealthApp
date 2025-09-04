export function Button({ className = '', children, ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-4 py-2 font-medium transition border border-transparent bg-sky-600 text-white hover:opacity-95 disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}