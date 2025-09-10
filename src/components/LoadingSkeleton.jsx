export default function LoadingSkeleton({ className = '', style = {}, lines = 3 }) {
  return (
    <div className={className} style={style}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-zinc-200 rounded h-4 mb-2 last:mb-0"
          style={{ width: `${80 + Math.random() * 20}%`, height: 16 }}
        />
      ))}
    </div>
  );
}
