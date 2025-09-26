import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { listenUserThreads, markThreadRead } from '@/lib/db';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSkeleton from '@/components/LoadingSkeleton';

// Fixed Header Component
const FixedHeader = ({ title }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="w-full mt-8 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <h1 className="text-[25px] font-light leading-none text-gray-900 dark:text-white">My<br/>Conversations</h1>
      </div>
    </div>,
    document.body
  );
};

export default function Messages() {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState('');

  const location = useLocation();
  const navigate = useNavigate();

  // Subscribe to my threads
  useEffect(() => {
    if (!user || !profile?.role) return;
    return listenUserThreads(
      { uid: user.uid, role: profile.role },
      setThreads,
      (err) => console.error('listenUserThreads error:', err)
      // add { noSort: true } as 4th arg if your index is still building
    );
  }, [user?.uid, profile?.role]);

  const openThread = async (t) => {
    try { 
      await markThreadRead(t.id, user.uid); 
    } catch (e) { 
      console.error(e); 
    }

    // Navigate to the thread page based on user role
    if (profile?.role === 'customer') {
      // For customers, we can either go to the existing thread or start a new chat
      const vendorId = t.vendorId || (t.id && t.id.includes('__') ? t.id.split('__')[0] : '');
      if (vendorId) {
        navigate(`/chat/${vendorId}`);
      } else {
        navigate(`/thread/${t.id}`);
      }
    } else {
      // For vendors, always go to the specific thread
      navigate(`/thread/${t.id}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">Please sign in to continue</div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate('/auth/landing')}
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  const me = user?.uid;
  const myUnread = (t) => t?.unread?.[me] || 0;
  const displayName = (t) => (profile?.role === 'customer' ? t.vendorName : t.customerName) || '';
  const lastTime = (t) => (t.lastAt?.seconds ? new Date(t.lastAt.seconds * 1000) : null);

  const filtered = threads.filter(t => {
    const name = displayName(t).toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || (t.lastMessage || '').toLowerCase().includes(q);
  });

  return (
    <>
      <FixedHeader title="My Conversations" />
      <div className="min-h-screen pt-24 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 pb-28">
        <div className="mt-8 flex items-center gap-3 border-b border-zinc-300 pb-2">
          <Search className="h-4 w-4 text-zinc-400"/>
          <input
            placeholder="Search chats"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full outline-none placeholder:text-zinc-400 bg-transparent placeholder:text-sm"
          />
        </div>

      <div className="mt-6 space-y-4 w-full">
        {filtered.map((t, index) => (
          <button
            key={t.id}
            onClick={() => openThread(t)}
            className="w-full rounded-[10px] border border-gray-300 px-4 py-3 text-left h-[62px] flex items-center gap-3 bg-white hover:bg-zinc-50 transition-all duration-200 card-interactive animate-fadeInUp"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center">
              <span className="text-zinc-500 text-xs font-semibold">{(displayName(t) || 'U')[0]}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{displayName(t)}</div>
              <div className="text-zinc-500 text-[10px] truncate">{t.lastMessage || 'No messages yet.'}</div>
            </div>
            <div className="flex flex-col items-end justify-between h-full min-w-[48px]">
              {myUnread(t) > 0 && (
                <span className="bg-sky-500 text-white text-[10px] font-semibold rounded-full px-2 py-0.5 mb-1">
                  {myUnread(t)}
                </span>
              )}
              <span className="text-zinc-400 text-[10px]">
                {lastTime(t)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
              </span>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <div className="text-zinc-500">No conversations yet.</div>}
      </div>
      </div>
    </>
  );
}
