import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { listenUserThreads, markThreadRead } from '@/lib/db';
import ChatThread from './ChatThread';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Messages() {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

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

  // If URL has ?chat=<vendorId>, auto-open that thread when threads load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const wantVendor = params.get('chat');
    if (!wantVendor || !threads.length || selected) return;

    // Try to find the thread for that vendorId
    const match =
      threads.find(t => t.vendorId === wantVendor)
      || threads.find(t => (t.id || '').split('__')[0] === wantVendor);

    if (match) {
      setSelected(match);
      // optional: mark as read now
      if (user?.uid) markThreadRead(match.id, user.uid).catch(console.error);
    }
  }, [location.search, threads, selected, user?.uid]);

  const openThread = async (t) => {
    setSelected(t);
    try { await markThreadRead(t.id, user.uid); } catch (e) { console.error(e); }

    // Put ?chat=<vendorId> in the URL so App hides BottomNav
    const vendorId =
      t.vendorId
      || (t.id && t.id.includes('__') ? t.id.split('__')[0] : '');
    if (vendorId) {
      navigate(`/messages?chat=${encodeURIComponent(vendorId)}`, { replace: false });
    }
  };

  const closeThread = () => {
    setSelected(null);
    // Remove the ?chat= param so BottomNav shows again
    navigate('/messages', { replace: true });
  };

  if (selected) {
    // Customer: pass vendorId to allow create/get.
    // Vendor: pass threadId so it never tries to create.
    const props =
      profile?.role === 'customer'
        ? { vendorId: selected.vendorId }
        : { threadId: selected.id, vendorId: selected.vendorId }; // vendorId helps populate header
    return (
      <div className="bg-white min-h-screen">
        <ChatThread {...props} onClose={closeThread} onBackRoute="/messages" />
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
    <div className="pt-10 pb-28 px-5 max-w-md mx-auto w-full min-h-screen flex flex-col">
      <div className="sticky top-0 z-10 bg-white pt-10 pb-2">
        <div className="text-[30px] font-light leading-none">My<br/>Conversations</div>
      </div>

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
        {filtered.map(t => (
          <button
            key={t.id}
            onClick={() => openThread(t)}
            className="w-full rounded-[10px] border border-gray-300 px-4 py-3 text-left h-[62px] flex items-center gap-3 bg-white hover:bg-zinc-50 transition"
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
  );
}
