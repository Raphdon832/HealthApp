import React, { useState, useEffect } from 'react';

const getYearOptions = (data) => {
  const years = Array.from(new Set(data.map(d => {
    if (d.label.includes('/')) {
      // month/year
      return d.label.split('/').pop();
    }
    return d.label;
  })));
  return years.sort();
};

const getMonthOptions = (data, year) => {
  const months = Array.from(new Set(data.filter(d => d.label.endsWith('/' + year)).map(d => d.label.split('/')[0])));
  return months.sort((a, b) => Number(a) - Number(b));
};

export default function RevenueGraph({ data, filter, onFilterChange, topPeriod }) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const [animatedHeights, setAnimatedHeights] = useState([]);

  // Animate bars on data change
  useEffect(() => {
    if (data.length > 0) {
      const maxValue = Math.max(...data.map(x => x.value)) || 1;
      setAnimatedHeights(data.map(d => (d.value / maxValue) * 100));
    }
  }, [data]);

  let yearOptions = getYearOptions(data);
  let monthOptions = filter.type === 'month' ? getMonthOptions(data, filter.year || yearOptions[0]) : [];

  const maxValue = Math.max(...data.map(x => x.value)) || 1;
  const totalRevenue = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-gradient-to-br from-[#F7F7F7] to-[#F0F8FF] rounded-2xl border border-sky-500 dark:border-gray-600 p-6 mt-8 overflow-hidden min-w-0 relative" role="region" aria-label="Revenue">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-sky-100/30 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/20 to-transparent rounded-full translate-y-12 -translate-x-12"></div>

      {/* Header Section */}
      <div className="flex items-center justify-between mb-4 min-w-0 relative z-0">
        <div>
          <h2 className="text-black font-light text-xl tracking-tight mb-1">Revenue Analytics</h2>
          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold text-sky-700">₦{totalRevenue.toLocaleString()}</div>
            <div className="px-2 py-1 bg-sky-100 rounded-full text-xs text-sky-700 font-medium">
              Total
            </div>
          </div>
        </div>
        
        {/* Enhanced Filter Controls */}
        <div className="flex flex-col gap-2">
          <select
            className="rounded-xl border-2 border-sky-200 bg-white px-3 py-2 text-sm text-sky-700 focus:outline-none focus:border-sky-400 transition-colors shadow-sm hover:shadow-md"
            value={filter.type}
            onChange={e => onFilterChange({ ...filter, type: e.target.value })}
          >
            <option value="month">📊 By Month</option>
            <option value="year">📈 By Year</option>
          </select>
        </div>
      </div>

      {/* Sub-filters */}
      <div className="flex gap-2 mb-6 min-w-0 relative z-0">
        {filter.type === 'year' && (
          <select
            className="rounded-lg border border-sky-200 px-3 py-2 text-sm text-sky-700 bg-white focus:outline-none focus:border-sky-400 transition-colors shadow-sm hover:shadow-md min-w-0 max-w-[140px]"
            value={filter.year || yearOptions[0] || ''}
            onChange={e => onFilterChange({ ...filter, year: e.target.value })}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {filter.type === 'month' && (
          <>
            <select
              className="rounded-lg border border-sky-200 px-3 py-2 text-sm text-sky-700 bg-white focus:outline-none focus:border-sky-400 transition-colors shadow-sm hover:shadow-md min-w-0 max-w-[120px]"
              value={filter.year || yearOptions[0] || ''}
              onChange={e => onFilterChange({ ...filter, year: e.target.value })}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              className="rounded-lg border border-sky-200 px-3 py-2 text-sm text-sky-700 bg-white focus:outline-none focus:border-sky-400 transition-colors shadow-sm hover:shadow-md min-w-0 max-w-[120px]"
              value={filter.month || monthOptions[0] || ''}
              onChange={e => onFilterChange({ ...filter, month: e.target.value })}
            >
              {monthOptions.map(m => <option key={m} value={m}>Month {m}</option>)}
            </select>
          </>
        )}
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-20">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-t border-sky-300 border-dashed"></div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full h-32 flex items-end gap-3 mt-2 min-w-0 overflow-hidden relative z-0">
          {data.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-zinc-400 text-sm">No revenue data available</div>
                <div className="text-xs text-zinc-400 mt-1">Start making sales to see your revenue analytics</div>
              </div>
            </div>
          ) : (
            data.map((d, i) => (
              <div 
                key={i} 
                className="flex flex-col items-center flex-1 min-w-0 relative group"
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              >
                {/* Tooltip */}
                {hoveredBar === i && (
                  <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-white border border-sky-200 rounded-lg px-3 py-2 shadow-lg z-20 whitespace-nowrap">
                    <div className="text-xs font-medium text-gray-700">{d.label}</div>
                    <div className="text-sm font-semibold text-sky-600">₦{d.value.toLocaleString()}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                )}

                {/* Bar Container */}
                <div className="relative w-8 flex flex-col items-center">
                  {/* Bar Background */}
                  <div className="w-full h-32 bg-sky-100/50 rounded-t-lg relative overflow-hidden">
                    {/* Animated Bar */}
                    <div
                      className={`absolute bottom-0 w-full rounded-t-lg transition-all duration-1000 ease-out cursor-pointer transform ${
                        hoveredBar === i ? 'scale-105' : 'scale-100'
                      }`}
                      style={{ 
                        height: `${animatedHeights[i] || 0}%`,
                        background: hoveredBar === i 
                          ? 'linear-gradient(135deg, #36A5FF 0%, #2563EB 50%, #1D4ED8 100%)'
                          : 'linear-gradient(135deg, #36A5FF 0%, #3B82F6 100%)',
                        boxShadow: hoveredBar === i 
                          ? '0 8px 25px rgba(54, 165, 255, 0.4), 0 4px 10px rgba(54, 165, 255, 0.3)'
                          : '0 4px 15px rgba(54, 165, 255, 0.2)'
                      }}
                    >
                      {/* Shine effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 animate-pulse"></div>
                    </div>

                    {/* Bar top highlight */}
                    <div
                      className="absolute w-full h-1 bg-white/40 rounded-full transition-all duration-1000"
                      style={{ bottom: `${animatedHeights[i] || 0}%` }}
                    ></div>
                  </div>

                  {/* Value on hover */}
                  {hoveredBar === i && (
                    <div className="absolute -top-6 bg-sky-600 text-white text-xs px-2 py-1 rounded font-medium">
                      ₦{d.value.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Label */}
                <span 
                  className={`text-[11px] mt-2 truncate max-w-[40px] transition-colors duration-200 ${
                    hoveredBar === i ? 'text-sky-600 font-medium' : 'text-zinc-500'
                  }`}
                >
                  {d.label}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Y-axis labels */}
        {data.length > 0 && (
          <div className="absolute left-0 top-0 h-32 flex flex-col justify-between text-xs text-zinc-400 -ml-12">
            <span>₦{maxValue.toLocaleString()}</span>
            <span>₦{Math.round(maxValue * 0.75).toLocaleString()}</span>
            <span>₦{Math.round(maxValue * 0.5).toLocaleString()}</span>
            <span>₦{Math.round(maxValue * 0.25).toLocaleString()}</span>
            <span>₦0</span>
          </div>
        )}
      </div>

      {/* Enhanced Top Period Display */}
      {topPeriod && (
        <div className="mt-6 p-4 bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl border border-sky-200 relative z-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              🏆
            </div>
            <div>
              <div className="text-sm font-medium text-sky-700">
                Best Performing {filter.type === 'month' ? 'Month' : 'Year'}
              </div>
              <div className="text-lg font-semibold text-sky-800">
                {topPeriod.label} • ₦{topPeriod.value.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
