import React, { useState } from 'react';
import { useTranslation } from '@/lib/language';

export default function SalesTrends({ data }) {
  const { t } = useTranslation();
  const [hoveredPoint, setHoveredPoint] = useState(null);
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-[#F7F7F7] dark:bg-gray-800 rounded-2xl border border-sky-500 dark:border-gray-600 p-5 mt-8 text-zinc-400 dark:text-zinc-500 text-sm text-center">
        {t('no_sales_trend_data', 'No sales trend data.')}
      </div>
    );
  }

  const max = Math.max(...data.map(d => d.value)) || 1;
  const padding = 25;
  const chartWidth = 280;
  const chartHeight = 120;
  
  // Generate grid lines
  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * (chartHeight - 2 * padding);
    gridLines.push(
      <line
        key={i}
        x1={padding}
        y1={y}
        x2={chartWidth - padding}
        y2={y}
        stroke="#E5F3FF"
        strokeWidth="1"
        strokeDasharray="3,3"
      />
    );
  }

  // Generate points and path
  const points = data.map((d, i) => {
    const x = padding + (i / (data.length - 1)) * (chartWidth - 2 * padding);
    const y = chartHeight - padding - (d.value / max) * (chartHeight - 2 * padding);
    return { x, y, value: d.value, label: d.label };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  // Create gradient area path
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${chartHeight - padding} L ${points[0].x} ${chartHeight - padding} Z`;

  return (
    <div className="bg-[#F7F7F7] dark:bg-gray-800 rounded-2xl border border-sky-500 dark:border-gray-600 p-5 mt-8 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-black dark:text-white font-light text-lg tracking-tight">{t('sales_trends', 'Sales Trends')}</h2>
        <div className="text-xs text-zinc-500 dark:text-zinc-400">{t('last_6_months', 'Last 6 months')}</div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        <svg 
          width={chartWidth} 
          height={chartHeight} 
          className="block mx-auto overflow-visible"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(54, 165, 255, 0.1))' }}
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#36A5FF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#36A5FF" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#36A5FF" />
              <stop offset="50%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {gridLines}

          {/* Area Fill */}
          <path
            d={areaPath}
            fill="url(#areaGradient)"
            className="transition-all duration-300"
          />

          {/* Main Line */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(54, 165, 255, 0.3))'
            }}
          />

          {/* Data Points */}
          {points.map((point, i) => (
            <g key={i}>
              {/* Outer circle (glow effect) */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? "8" : "6"}
                fill="rgba(54, 165, 255, 0.2)"
                className="transition-all duration-200"
              />
              {/* Inner circle */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredPoint === i ? "4" : "3"}
                fill="#36A5FF"
                stroke="white"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-200 hover:r-4"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
                style={{
                  filter: hoveredPoint === i 
                    ? 'drop-shadow(0 4px 8px rgba(54, 165, 255, 0.4))' 
                    : 'drop-shadow(0 2px 4px rgba(54, 165, 255, 0.2))'
                }}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredPoint !== null && (
          <div 
            className="absolute bg-white border border-sky-200 rounded-lg px-3 py-2 shadow-lg z-10 transition-all duration-200"
            style={{
              left: points[hoveredPoint].x - 30,
              top: points[hoveredPoint].y - 50,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {data[hoveredPoint].label}
            </div>
            <div className="text-sm font-semibold text-sky-600 dark:text-sky-400">
              {t('orders_count', '{count} order{plural}', { count: data[hoveredPoint].value, plural: data[hoveredPoint].value > 1 ? 's' : '' })}
            </div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
            </div>
          </div>
        )}
      </div>

      {/* X-axis Labels */}
      <div className="flex justify-between mt-3 px-6">
        {data.map((d, i) => (
          <span 
            key={i} 
            className={`text-xs transition-colors duration-200 ${
              hoveredPoint === i ? 'text-sky-600 dark:text-sky-400 font-medium' : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {d.label}
          </span>
        ))}
      </div>

      {/* Y-axis Labels */}
      <div className="absolute left-1 top-12 h-24 flex flex-col justify-between text-xs text-zinc-400 dark:text-zinc-500">
        <span>{max}</span>
        <span>{Math.round(max * 0.75)}</span>
        <span>{Math.round(max * 0.5)}</span>
        <span>{Math.round(max * 0.25)}</span>
        <span>0</span>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sky-100/50 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
    </div>
  );
}
