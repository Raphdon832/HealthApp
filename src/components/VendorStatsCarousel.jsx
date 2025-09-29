import React from 'react';

export default function VendorStatsCarousel({ cards }) {
  return (
    <div className="w-full overflow-x-auto py-2" style={{ overflowY: 'hidden' }}>
      <div
        className="flex gap-3"
        style={{ minWidth: 180, scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="min-w-[120px] max-w-[150px] h-[80px] bg-[#F7F7F7] dark:bg-gray-800 rounded-xl border border-sky-500 dark:border-gray-600 p-3 flex flex-col items-start justify-center shadow-sm"
          >
            {card}
          </div>
        ))}
      </div>
      <style>{`
        .w-full.overflow-x-auto::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
