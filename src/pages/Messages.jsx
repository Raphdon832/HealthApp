import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { collection, onSnapshot, query, where, getDoc, doc, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import ChatThread from './ChatThread';

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [vendors, setVendors] = useState({});
  const [lastMessages, setLastMessages] = useState({});
  const [allMessages, setAllMessages] = useState({});
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  const [scrollToIdx, setScrollToIdx] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Only fetch threads if user is loaded
    const q = query(collection(db, 'threads'), where('participants', 'array-contains', user.uid));
    return onSnapshot(q, async (snap) => {
      const threadsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setThreads(threadsData);
      // Fetch vendor info and last message for each thread
      const vendorMap = {};
      const lastMsgMap = {};
      const allMsgMap = {};
      await Promise.all(threadsData.map(async t => {
        const vendorId = t.participants.find(p => p !== user.uid);
        if (vendorId) {
          const vendorSnap = await getDoc(doc(db, 'pharmacies', vendorId));
          vendorMap[t.id] = vendorSnap.exists() ? vendorSnap.data().name : 'Vendor';
        }
        // Get last message
        const msgsQ = query(collection(db, 'threads', t.id, 'messages'), orderBy('createdAt', 'desc'), limit(1));
        const msgsSnap = await getDocs(msgsQ);
        // Get all messages for search
        const allMsgsQ = query(collection(db, 'threads', t.id, 'messages'));
        const allMsgsSnap = await getDocs(allMsgsQ);
        allMsgMap[t.id] = allMsgsSnap.docs.map(d => d.data().text || "");
        if (!msgsSnap.empty) {
          const msgData = msgsSnap.docs[0].data();
          // Count unread messages for this thread
          const unreadQ = query(collection(db, 'threads', t.id, 'messages'), where('to', '==', user.uid), where('read', '==', false));
          const unreadSnap = await getDocs(unreadQ);
          lastMsgMap[t.id] = {
            text: msgData.text || '',
            timestamp: msgData.createdAt ? msgData.createdAt.toDate() : null,
            unread: unreadSnap.size
          };
        } else {
          lastMsgMap[t.id] = {
            text: '',
            timestamp: null,
            unread: 0
          };
        }
      }));
      setVendors(vendorMap);
      setLastMessages(lastMsgMap);
      setAllMessages(allMsgMap);
    });
  }, [user]); // Remove searchParams from dependency

  // New useEffect: Only open thread after all data is loaded
  useEffect(() => {
    if (!user) return;
    const threadId = searchParams.get('thread');
    if (
      threadId &&
      threads.length > 0 &&
      Object.keys(vendors).length > 0 &&
      Object.keys(lastMessages).length > 0 &&
      Object.keys(allMessages).length > 0
    ) {
      const thread = threads.find(t => t.id === threadId);
      if (thread) setSelectedThread(thread);
    }
  }, [user, searchParams, threads, vendors, lastMessages, allMessages]);

  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      return;
    }
    const results = [];
    threads.forEach(t => {
      const vendorName = vendors[t.id] || "Vendor";
      const allMsgs = allMessages[t.id] || [];
      // Vendor name match
      if (vendorName.toLowerCase().includes(search.toLowerCase())) {
        results.push({
          type: "vendor",
          threadId: t.id,
          vendorName,
          message: null
        });
      }
      // Message match
      allMsgs.forEach((msg, idx) => {
        if (msg && msg.toLowerCase().includes(search.toLowerCase())) {
          results.push({
            type: "message",
            threadId: t.id,
            vendorName,
            message: msg,
            messageIndex: idx
          });
        }
      });
    });
    setSearchResults(results);
  }, [search, threads, vendors, allMessages]);

  // Only render the main container (with navbar/header) if no chat is open
  if (selectedThread) {
    // Ensure all required data is loaded before rendering ChatThread
    const threadId = selectedThread.id;
    const vendorName = vendors[threadId] || selectedThread.vendorName || "Vendor";
    const customerName = selectedThread.customerName || "Customer";
    const lastMsg = lastMessages[threadId] || {};
    const allMsgs = allMessages[threadId] || [];
    // If any required data is missing, show loading
    if (!vendorName || !customerName || !lastMsg || !Array.isArray(allMsgs)) {
      return <div className="bg-white min-h-screen flex items-center justify-center text-zinc-500">Loading chats...</div>;
    }
    return (
      <div className="bg-white min-h-screen">
        <ChatThread
          key={selectedThread.id}
          thread={selectedThread}
          vendorId={selectedThread.vendorId || selectedThread.participants.find(p => p !== user?.uid)}
          vendorName={vendorName}
          customerName={customerName}
          lastMessage={lastMsg}
          allMessages={allMsgs}
          scrollTo={scrollToIdx}
          onClose={() => { setSelectedThread(null); setScrollToIdx(null); }}
        />
      </div>
    );
  }

  // Refactored thread listing logic
  // For customers: list threads where customerId == user.uid
  // For vendors: list threads where vendorId == user.uid
  const myThreads = threads.filter(t =>
    user.role === 'customer' ? t.customerId === user.uid : t.vendorId === user.uid
  );

  // Helper to get display name for other participant
  const getOtherName = (thread) => {
    return user.role === 'customer' ? thread.vendorName : thread.customerName;
  };

  return (
    <div className="pt-10 pb-28 px-5 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto w-full min-h-screen flex flex-col">
      {/* Sticky Header (navbar) */}
      <div className="sticky top-0 z-10 bg-white pt-10 pb-2">
        <div
          className="text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins text-left flex items-start justify-start w-full pl-0"
          style={{ lineHeight: '0.88' }}
        >
          <div className="flex items-start justify-start">
            My<br />Conversations
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mt-6 flex items-center gap-3 border-b border-zinc-300 pb-2">
        <Search className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-zinc-400" />
        <input
          placeholder="Search chats"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full outline-none placeholder:text-zinc-400 placeholder:text-[12px] md:placeholder:text-[14px] lg:placeholder:text-[16px] placeholder:font-light bg-transparent"
        />
        <div className="flex gap-1 text-zinc-400">
          <div className="h-1 w-1 bg-current rounded-full" />
          <div className="h-1 w-1 bg-current rounded-full" />
          <div className="h-1 w-1 bg-current rounded-full" />
        </div>
      </div>

      {/* Search Results Preview */}
      {search && searchResults.length > 0 && (
        <div className="absolute left-0 right-0 top-full bg-white shadow-lg rounded-lg mt-2 z-20 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
          {searchResults.map((result, i) => (
            <button
              key={i}
              className="w-full text-left px-4 py-2 hover:bg-zinc-100 flex flex-col"
              onClick={() => {
                let vendorId = '';
                const thread = threads.find(t => t.id === result.threadId);
                if (thread) {
                  if (thread.participants.length === 2) {
                    vendorId = thread.participants.find(p => p !== user?.uid);
                  } else {
                    vendorId = result.threadId?.split('__')[1] || '';
                  }
                  setSelectedThread({ ...thread, _vendorId: vendorId });
                  setScrollToIdx(result.type === 'message' ? result.messageIndex : null);
                }
                setSearch("");
                setSearchResults([]);
              }}
            >
              <span className="font-semibold text-sky-600 text-base md:text-lg lg:text-xl">{result.vendorName}</span>
              {result.message && <span className="text-zinc-600 text-[12px] md:text-[14px] lg:text-[16px]">{result.message}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Threads List */}
      <div className="mt-6 space-y-4 w-full">
        {myThreads.filter(t => {
          const otherName = getOtherName(t);
          const searchLower = search.toLowerCase();
          const allMsgs = allMessages[t.id] || [];
          return otherName.toLowerCase().includes(searchLower) || allMsgs.some(m => m.toLowerCase().includes(searchLower));
        }).map(t => (
          <button
            key={t.id}
            onClick={() => { setSelectedThread(t); setScrollToIdx(null); }}
            className="w-full rounded-[10px] border border-gray-300 px-4 py-3 text-left h-[62px] md:h-[72px] lg:h-[82px] flex items-center gap-3 md:gap-5 lg:gap-7 bg-white hover:bg-zinc-50 transition"
          >
            {/* Avatar */}
            <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-zinc-200 flex items-center justify-center overflow-hidden">
              <span className="text-zinc-500 text-[12px] md:text-[16px] lg:text-[20px] font-semibold">{getOtherName(t)?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] md:text-[16px] lg:text-[18px] font-regular truncate">{getOtherName(t)}</div>
              <div className="text-zinc-500 text-[10px] md:text-[12px] lg:text-[14px] font-light truncate">{lastMessages[t.id]?.text || 'No messages yet.'}</div>
            </div>
            {/* Timestamp and Unread Badge */}
            <div className="flex flex-col items-end justify-between h-full min-w-[48px] md:min-w-[56px] lg:min-w-[64px]">
              {/* Unread badge */}
              {lastMessages[t.id]?.unread > 0 && (
                <span className="bg-sky-500 text-white text-[10px] md:text-[12px] lg:text-[14px] font-semibold rounded-full px-2 py-0.5 mb-1">{lastMessages[t.id].unread}</span>
              )}
              {/* Timestamp */}
              <span className="text-zinc-400 text-[10px] md:text-[12px] lg:text-[14px] font-light">{lastMessages[t.id]?.timestamp ? new Date(lastMessages[t.id].timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
            </div>
          </button>
        ))}
        {myThreads.length === 0 && (
          <div className="text-zinc-500 text-base md:text-lg lg:text-xl">No conversations yet.</div>
        )}
      </div>
    </div>
  );
}