
export function Textarea({ className = '', ...props }) {
  return <textarea className={`w-full rounded-2xl border px-3 py-2 outline-none ${className}`} {...props} />;
}