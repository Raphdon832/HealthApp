import React from 'react';

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
  // Dropdowns for year/month only
  let yearOptions = getYearOptions(data);
  let monthOptions = filter.type === 'month' ? getMonthOptions(data, filter.year || yearOptions[0]) : [];

  return (
    <div className="bg-[#F7F7F7] rounded-2xl border border-sky-500 p-5 mt-8 overflow-hidden min-w-0" role="region" aria-label="Revenue">
      <div className="flex items-center justify-between mb-2 min-w-0">
        <h2 className="text-black font-light text-lg tracking-tight truncate max-w-[60%]">Revenue</h2>
        <select
          className="rounded-full border border-sky-200 bg-white px-2 py-1 text-sm text-sky-700 focus:outline-none min-w-0"
          value={filter.type}
          onChange={e => onFilterChange({ ...filter, type: e.target.value })}
        >
          <option value="month">By Month</option>
          <option value="year">By Year</option>
        </select>
      </div>
      <div className="flex gap-2 mb-2 min-w-0">
        {filter.type === 'year' && (
          <select
            className="rounded-full border border-sky-200 px-2 py-1 text-[12px] text-sky-700 bg-white focus:outline-none min-w-0 max-w-[140px] truncate"
            value={filter.year || yearOptions[0] || ''}
            onChange={e => onFilterChange({ ...filter, year: e.target.value })}
          >
            {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
        {filter.type === 'month' && (
          <>
            <select
              className="rounded-full border border-sky-200 px-2 py-1 text-[12px] text-sky-700 bg-white focus:outline-none min-w-0 max-w-[120px] truncate"
              value={filter.year || yearOptions[0] || ''}
              onChange={e => onFilterChange({ ...filter, year: e.target.value })}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select
              className="rounded-full border border-sky-200 px-2 py-1 text-[12px] text-sky-700 bg-white focus:outline-none min-w-0 max-w-[120px] truncate"
              value={filter.month || monthOptions[0] || ''}
              onChange={e => onFilterChange({ ...filter, month: e.target.value })}
            >
              {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </>
        )}
      </div>
      <div className="w-full h-20 flex items-end gap-2 mt-2 min-w-0 overflow-hidden">
        {data.length === 0 ? (
          <div className="text-zinc-400 text-sm truncate">No revenue data.</div>
        ) : (
          data.map((d, i) => (
            <div key={i} className="flex flex-col items-center flex-1 min-w-0">
              <div
                className="w-6 bg-sky-400 rounded-t-full transition-all duration-700"
                style={{ height: `${Math.max(8, (d.value / (Math.max(...data.map(x => x.value)) || 1)) * 80)}px` }}
                title={`₦${d.value.toLocaleString()}`}
              />
              <span className="text-[10px] text-zinc-500 mt-1 truncate max-w-[32px]">{d.label}</span>
            </div>
          ))
        )}
      </div>
      {topPeriod && (
        <div className="mt-3 text-xs text-sky-700 font-medium truncate">
          Top {filter.type === 'month' ? 'Month' : 'Year'}: <span className="font-semibold truncate">{topPeriod.label} (₦{topPeriod.value.toLocaleString()})</span>
        </div>
      )}
    </div>
  );
}
