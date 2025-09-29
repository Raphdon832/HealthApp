import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/lib/language';

export default function MessagesPreview({ threads, unreadCount, onThreadClick }) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleHeaderClick = () => {
    navigate('/messages');
  };

  return (
    <div className="relative bg-[#F7F7F7] dark:bg-gray-800 rounded-2xl border border-sky-500 dark:border-gray-600 p-5 mt-8">
      <div 
        className="flex items-center justify-between mb-2 cursor-pointer hover:bg-sky-50 dark:hover:bg-gray-700/50 -mx-2 px-2 py-1 rounded-lg transition-colors"
        onClick={handleHeaderClick}
      >
        <h2 className="text-black dark:text-white font-light text-lg tracking-tight">{t('recent_messages', 'Recent Messages')}</h2>
        {unreadCount > 0 && (
          <span className="bg-sky-400 text-white text-xs rounded-full px-2 py-0.5 font-bold">
            {unreadCount}
          </span>
        )}
      </div>
      <div>
        {threads.length === 0 ? (
          <div className="text-zinc-400 dark:text-zinc-500 text-sm">{t('no_recent_messages', 'No recent messages.')}</div>
        ) : (
          <ul className="divide-y divide-sky-100 dark:divide-gray-600">
            {threads.map(t => (
              <li
                key={t.id}
                className="py-2 rounded-lg px-2 flex items-center cursor-pointer hover:bg-sky-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => onThreadClick && onThreadClick(t)}
              >
                <span className="font-light text-[13px] text-black dark:text-white flex-1 truncate">{t.customerName || t.customerId}</span>
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
