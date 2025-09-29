export function Card({ className = '', children, ...props }) {
  return <div className={`rounded-3xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-gray-800 ${className}`} {...props}>{children}</div>;
}