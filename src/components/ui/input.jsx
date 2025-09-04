
export function Input({ className = '', ...props }) {
  return <input className={`w-full rounded-2xl border px-3 py-2 outline-none ${className}`} {...props} />;
}