import React from 'react';

export default function MessagesPreview({ threads }) {
  return (
    <div className="relative bg-[#F7F7F7] rounded-2xl border border-sky-500 p-5 mt-8">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-black font-light text-lg tracking-tight">Recent Messages</h2>
      </div>
      <div>
        {threads.length === 0 ? (
          <div className="text-zinc-400 text-sm">No recent messages.</div>
        ) : (
          <ul className="divide-y divide-sky-100">
            {threads.map(t => (
              <li
                key={t.id}
                className="py-2 rounded-lg px-2 flex items-center select-text"
              >
                <span className="font-light text-[13px] text-black flex-1 truncate">{t.customerName || t.customerId}</span>
                {t.unread > 0 && (
                  <span className="ml-2 bg-sky-400 text-white text-xs rounded-full px-2 py-0.5 font-bold">{t.unread}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
