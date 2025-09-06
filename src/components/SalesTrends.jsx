import React from 'react';

export default function SalesTrends({ data }) {
  // data: [{ label: 'Jan', value: 10 }, ...]
  // Simple SVG line chart
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#F7F7F7] rounded-2xl border border-sky-500 p-5 mt-8 text-zinc-400 text-sm text-center">
        No sales trend data.
      </div>
    );
  }
  const max = Math.max(...data.map(d => d.value)) || 1;
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 180 + 20;
    const y = 60 - (d.value / max) * 40 + 10;
    return `${x},${y}`;
  }).join(' ');
  return (
    <div className="bg-[#F7F7F7] rounded-2xl border border-sky-500 p-5 mt-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-black font-light text-lg tracking-tight">Sales Trends</h2>
      </div>
      <svg width="220" height="80" className="block mx-auto">
        <polyline
          fill="none"
          stroke="#36A5FF"
          strokeWidth="3"
          points={points}
        />
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 180 + 20;
          const y = 60 - (d.value / max) * 40 + 10;
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="#36A5FF" />
          );
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-zinc-500">
        {data.map((d, i) => (
          <span key={i} className="w-8 text-center truncate">{d.label}</span>
        ))}
      </div>
    </div>
  );
}
