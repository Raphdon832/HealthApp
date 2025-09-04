export function Card({ className = '', children, ...props }) {
  return <div className={`rounded-3xl border border-zinc-200 bg-white ${className}`} {...props}>{children}</div>;
}