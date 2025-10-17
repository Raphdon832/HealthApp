import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useTranslation } from '@/lib/language';
import { listenUserThreads, markThreadRead } from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useLocation, useNavigate } from 'react-router-dom';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import VerifiedName from '@/components/VerifiedName';

// Fixed Header Component
const FixedHeader = ({ title, t }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="w-full mt-8 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <h1 className="text-[25px] font-light leading-none text-gray-900 dark:text-white whitespace-pre-line">
          {t('my_conversations', 'My\nConversations')}
        </h1>
      </div>
    </div>,
    document.body
  );
};

function useIsDesktop(minWidth = 1024) {
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handleChange = (event) => setIsDesktop(event.matches);

    if (mq.addEventListener) {
      mq.addEventListener('change', handleChange);
    } else {
      mq.addListener(handleChange);
    }

    setIsDesktop(mq.matches);

    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handleChange);
      } else {
        mq.removeListener(handleChange);
      }
    };
  }, [minWidth]);

  return isDesktop;
}

export default function Messages({
  variant = 'page',
  selectedThreadId = null,
  onThreadSelect,
} = {}) {
  const { user, profile } = useAuth();
  const { t } = useTranslation();
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState('');
  const [vendorMeta, setVendorMeta] = useState({});

  const location = useLocation();
  const navigate = useNavigate();
  const isSidebar = variant === 'sidebar';
  const hasDesktopRedirected = useRef(false);
  const isDesktop = useIsDesktop();

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

  const openThread = (thread) => {
    const vendorId = resolveVendorId(thread);
    const state = { thread };

    if (typeof onThreadSelect === 'function') {
      onThreadSelect(thread);
    }

    if (profile?.role === 'customer' && vendorId) {
      navigate(`/chat/${vendorId}`, { state, replace: isSidebar });
    } else {
      navigate(`/thread/${thread.id}`, { state, replace: isSidebar });
    }

    markThreadRead(thread.id, user.uid).catch((error) =>
      console.error('markThreadRead error:', error)
    );
  };

  if (!user) {
    if (isSidebar) {
      return null;
    }
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">
          {t('please_sign_in_continue', 'Please sign in to continue')}
        </div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate('/auth/landing')}
        >
          {t('sign_in_sign_up', 'Sign In / Sign Up')}
        </button>
      </div>
    );
  }

  const me = user?.uid;
  const myUnread = (t) => t?.unread?.[me] || 0;
  const displayName = (t) => (profile?.role === 'customer' ? t.vendorName : t.customerName) || '';
  const resolveVendorId = (thread) =>
    thread.vendorId ||
    (thread.id && thread.id.includes('__') ? thread.id.split('__')[0] : null);

  const isPartnerVerified = (thread) => {
    if (profile?.role !== 'customer') return false;
    if (typeof thread.vendorIsVerified === 'boolean') return thread.vendorIsVerified;
    if (typeof thread.vendorVerificationStatus === 'string') {
      return thread.vendorVerificationStatus === 'approved';
    }
    const vendorId = resolveVendorId(thread);
    return vendorId ? !!vendorMeta[vendorId] : false;
  };
  const lastTime = (t) => (t.lastAt?.seconds ? new Date(t.lastAt.seconds * 1000) : null);

  const filtered = threads.filter(t => {
    const name = displayName(t).toLowerCase();
    const q = search.toLowerCase();
    return !q || name.includes(q) || (t.lastMessage || '').toLowerCase().includes(q);
  });

  useEffect(() => {
    if (
      isSidebar ||
      !isDesktop ||
      !threads.length ||
      hasDesktopRedirected.current ||
      location.pathname !== '/messages'
    ) {
      return;
    }

    const nextThread = threads[0];
    if (!nextThread) return;

    const state = { thread: nextThread };
    hasDesktopRedirected.current = true;

    if (profile?.role === 'customer') {
      const vendorId = resolveVendorId(nextThread);
      if (vendorId) {
        navigate(`/chat/${vendorId}`, { state, replace: true });
        return;
      }
    }

    navigate(`/thread/${nextThread.id}`, { state, replace: true });
  }, [isSidebar, isDesktop, threads, location.pathname, navigate, profile?.role]);

  useEffect(() => {
    if (profile?.role !== 'customer' || !threads.length) return;

    const baseUpdates = {};
    const vendorIds = new Set();

    threads.forEach((thread) => {
      const vendorId = resolveVendorId(thread);
      if (!vendorId) return;
      vendorIds.add(vendorId);
      if (typeof thread.vendorIsVerified === 'boolean') {
        baseUpdates[vendorId] = thread.vendorIsVerified;
      } else if (typeof thread.vendorVerificationStatus === 'string') {
        baseUpdates[vendorId] = thread.vendorVerificationStatus === 'approved';
      }
    });

    const hasImmediateUpdates = Object.entries(baseUpdates).some(
      ([id, value]) => vendorMeta[id] !== value
    );

    if (hasImmediateUpdates) {
      setVendorMeta((prev) => ({ ...prev, ...baseUpdates }));
    }

    const missing = Array.from(vendorIds).filter(
      (id) =>
        baseUpdates[id] === undefined && vendorMeta[id] === undefined
    );
    if (!missing.length) return;

    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        missing.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, 'pharmacies', id));
            return [id, snap.exists() ? !!snap.data()?.isVerified : false];
          } catch (error) {
            console.error('[Messages] Failed to fetch pharmacy verification status', error);
            return [id, false];
          }
        })
      );
      if (!cancelled) {
        setVendorMeta((prev) => {
          const next = { ...prev };
          results.forEach(([id, verified]) => {
            if (next[id] === undefined) {
              next[id] = verified;
            }
          });
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [threads, profile?.role, vendorMeta]);

  if (isSidebar) {
    return (
      <div className="flex h-full w-full flex-col bg-white dark:bg-gray-950">
        <div className="border-b border-gray-200 px-4 pb-4 pt-6 dark:border-gray-800">
          <h2 className="text-lg font-light text-gray-900 dark:text-white">
            {t('my_conversations', 'My Conversations')}
          </h2>
          <div className="mt-3 flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 focus-within:ring-1 focus-within:ring-sky-400 dark:bg-gray-800">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              placeholder={t('search_chats', 'Search chats')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-2 py-4">
          {filtered.map((thread) => {
            const isActive = selectedThreadId === thread.id;
            return (
              <button
                key={thread.id}
                onClick={() => openThread(thread)}
                className={`flex h-[62px] w-full items-center gap-3 rounded-[12px] px-3 text-left transition-colors duration-150 ${
                  isActive
                    ? 'bg-sky-50 border border-sky-200 text-gray-900 dark:border-sky-700 dark:bg-sky-900/30 dark:text-white'
                    : 'border border-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800/80'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-200">
                  <span className="text-xs font-semibold text-zinc-500">
                    {(displayName(thread) || 'U')[0]}
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <VerifiedName
                    name={displayName(thread) || t('conversation_partner', 'Conversation')}
                    isVerified={isPartnerVerified(thread)}
                    className="text-sm truncate inline-flex items-center gap-1"
                    nameClassName="truncate"
                    iconClassName="h-3.5 w-3.5 text-sky-500"
                  />
                  <div className="truncate text-[10px] text-zinc-500 dark:text-zinc-400">
                    {thread.lastMessage || t('no_messages_yet', 'No messages yet.')}
                  </div>
                </div>
                <div className="flex h-full min-w-[48px] flex-col items-end justify-between">
                  {myUnread(thread) > 0 && (
                    <span className="rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {myUnread(thread)}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400">
                    {lastTime(thread)?.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) || ''}
                  </span>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
              {t('no_conversations_yet', 'No conversations yet.')}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <FixedHeader title="My Conversations" t={t} />
      <div className="min-h-screen w-full px-4 pb-28 pt-24 sm:px-5 md:px-8 lg:px-12 xl:px-16">
        <div className="mt-14 flex items-center gap-3 border-b border-zinc-300 pb-2 dark:border-gray-600">
          <Search className="h-4 w-4 text-zinc-400" />
          <input
            placeholder={t('search_chats', 'Search chats')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none placeholder:text-sm placeholder:text-zinc-400"
          />
        </div>

        <div className="mt-8 w-full space-y-4">
          {filtered.map((thread, index) => (
            <div key={thread.id} className="-mx-4 sm:mx-0">
              <button
                onClick={() => openThread(thread)}
                className="card-interactive flex h-[62px] w-full items-center gap-3 rounded-[10px] border border-gray-300 bg-white px-4 py-3 text-left transition-all duration-200 hover:bg-zinc-50 dark:border-gray-600"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200">
                  <span className="text-xs font-semibold text-zinc-500">
                    {(displayName(thread) || 'U')[0]}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <VerifiedName
                    name={displayName(thread) || t('conversation_partner', 'Conversation')}
                    isVerified={isPartnerVerified(thread)}
                    className="text-sm truncate inline-flex items-center gap-1"
                    nameClassName="truncate"
                    iconClassName="h-3.5 w-3.5 text-sky-500"
                  />
                  <div className="truncate text-[10px] text-zinc-500">
                    {thread.lastMessage || t('no_messages_yet', 'No messages yet.')}
                  </div>
                </div>
                <div className="flex h-full min-w-[48px] flex-col items-end justify-between">
                  {myUnread(thread) > 0 && (
                    <span className="mb-1 rounded-full bg-sky-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                      {myUnread(thread)}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400">
                    {lastTime(thread)?.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    }) || ''}
                  </span>
                </div>
              </button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-zinc-500">
              {t('no_conversations_yet', 'No conversations yet.')}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
