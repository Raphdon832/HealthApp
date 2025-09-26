import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCheck } from 'lucide-react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import {
  getOrCreateThread,
  listenThreadMessages,
  sendChatMessage,
  markThreadRead,
  markMessageDelivered
} from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';
import { Paperclip } from 'lucide-react';
import SendButtonUrl from '@/icons/SendButton.svg?url';
import CallIcon from '@/icons/react/CallIcon';
import notificationSound from '@/assets/message-tone.mp3'; // You need to provide this mp3 file
import CreatePrescriptionModal from '@/components/CreatePrescriptionModal';
import PrescriptionList from '@/components/PrescriptionList';
import MessageWithLinks from '@/components/MessageWithLinks';
import { createPrescription } from '@/lib/db';
import { Menu } from '@headlessui/react';
import Modal from '@/components/Modal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
// Use the SVG placed in the `public/` folder so production (Netlify) serves it at root
const ChatBgUrl = '/ChatBg.svg';

/**
 * ChatThread Page Component
 * 
 * Routes:
 * - /chat/:vendorId - Customer initiating chat with a pharmacy
 * - /thread/:threadId - Opening an existing chat thread
 * 
 * URL Parameters:
 * - vendorId: pharmacy ID (for customers starting new chat)
 * - threadId: existing thread ID (for opening existing conversations)
 */

// Helper to format date separators like WhatsApp
function getDateLabel(date) {
  const now = new Date();
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = (today - d) / (1000 * 60 * 60 * 24);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// Helper to detect if a message is a product preview
function isProductPreviewMessage(m) {
  return m.type === 'product-preview';
}

// Message status indicator component
function MessageStatus({ message, isMine }) {
  if (!isMine) return null; // Only show status for sent messages
  
  const status = message.status || 'sent';
  const isRead = message.read || status === 'read';
  
  if (status === 'sent') {
    return (
      <Check 
        className="w-3.5 h-3.5 text-gray-400 ml-2 opacity-70" 
        strokeWidth={2.5}
        title="Sent"
      />
    );
  }
  
  if (status === 'delivered') {
    return (
      <CheckCheck 
        className="w-3.5 h-3.5 text-gray-400 ml-2 opacity-70" 
        strokeWidth={2.5}
        title="Delivered"
      />
    );
  }
  
  if (status === 'read' || isRead) {
    return (
      <CheckCheck 
        className="w-3.5 h-3.5 text-blue-500 ml-2 opacity-90" 
        strokeWidth={2.5}
        title="Read"
      />
    );
  }
  
  return null;
}

export default function ChatThread() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Get vendorId and threadId from URL parameters
  const vendorIdFromUrl = params.vendorId;
  const threadIdFromUrl = params.threadId;
  
  const [threadId, setThreadId] = useState(threadIdFromUrl || null);

  // 🔹 What to show in the sticky header
  const [otherName, setOtherName] = useState('');
  const [otherSubline, setOtherSubline] = useState(''); // e.g., address or email

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const bottomRef = useRef(null);

  const [lastMessageId, setLastMessageId] = useState(null);
  const [isTabActive, setIsTabActive] = useState(true);
  const audioRef = useRef(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [pharmacyProducts, setPharmacyProducts] = useState([]);
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get('productId');
  const productName = queryParams.get('productName');
  const productImage = queryParams.get('productImage');
  const vendorName = queryParams.get('vendorName');
  const productPrice = queryParams.get('productPrice'); // <-- Add this line
  const prefillMsg = queryParams.get('prefillMsg');

  // Resolve thread:
  // - customer + vendorId from URL => create/get thread
  // - if threadId from URL => use existing thread directly
  useEffect(() => {
    if (!user) return;

    (async () => {
      // If we have a direct threadId from URL, use it
      if (threadIdFromUrl) {
        setThreadId(threadIdFromUrl);
        return;
      }

      // Otherwise, if customer with vendorId, create/get thread
      if (profile?.role === 'customer' && vendorIdFromUrl) {
        const id = await getOrCreateThread({ 
          vendorId: vendorIdFromUrl, 
          customerId: user.uid, 
          role: 'customer' 
        });
        setThreadId(id);
      } else if (profile?.role === 'vendor' && !threadIdFromUrl) {
        console.warn('Vendor tried to open chat without threadId in URL.');
        navigate('/messages');
        return;
      }
    })().catch(console.error);
  }, [user?.uid, profile?.role, vendorIdFromUrl, threadIdFromUrl, navigate]);

  // 🔹 Load the thread doc and derive the "other party" name/subline
  useEffect(() => {
    if (!threadId || !profile?.role) return;

    (async () => {
      const tSnap = await getDoc(doc(db, 'threads', threadId));
      if (!tSnap.exists()) return;
      const t = tSnap.data();
      const [vId, cId] = threadId.split('__');
      if (profile.role === 'customer') {
        // show the PHARMACY name to the customer
        const name = t.vendorName || '';
        const address = t.vendorAddress || '';
        if (name) {
          setOtherName(name);
          setOtherSubline(address);
        } else {
          // fallback: fetch from pharmacies
          const pSnap = await getDoc(doc(db, 'pharmacies', vId));
          const pdata = pSnap.exists() ? pSnap.data() : {};
          setOtherName(pdata.name || 'Pharmacy');
          setOtherSubline(pdata.address || pdata.email || '');
        }
        // Always fetch pharmacy phone for call button
        const pSnap = await getDoc(doc(db, 'pharmacies', vId));
        const pdata = pSnap.exists() ? pSnap.data() : {};
        setPharmacyPhone(pdata.phone || '');
      } else {
        // vendor is chatting with the CUSTOMER
        const name = t.customerName || '';
        const sub = t.customerAddress || t.customerEmail || '';
        if (name) {
          setOtherName(name);
          setOtherSubline(sub);
        } else {
          // fallback: fetch from users
          const uSnap = await getDoc(doc(db, 'users', cId));
          const u = uSnap.exists() ? uSnap.data() : {};
          setOtherName(u.displayName || 'Customer');
          setOtherSubline(u.email || '');
        }
      }
    })().catch(console.error);
  }, [threadId, profile?.role]);

  // Live messages + mark read
  useEffect(() => {
    if (!threadId || !user?.uid) return;
    const stop = listenThreadMessages(threadId, (newMessages) => {
      setMessages(newMessages);
      
      // Mark incoming messages as delivered (simulate recipient receiving them)
      newMessages.forEach(async (msg) => {
        if (msg.senderId !== user.uid && msg.status === 'sent') {
          try {
            await markMessageDelivered(threadId, msg.id);
          } catch (error) {
            console.error('Error marking message as delivered:', error);
          }
        }
      });
    }, console.error);
    
    markThreadRead(threadId, user.uid).catch(console.error);
    return stop;
  }, [threadId, user?.uid]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  // Page visibility for message tone
  useEffect(() => {
    const handleVisibility = () => {
      setIsTabActive(!document.hidden);
      // When tab becomes active, mark thread as read
      if (!document.hidden && threadId && user?.uid) {
        markThreadRead(threadId, user.uid).catch(console.error);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [threadId, user?.uid]);

  // Play tone on new incoming message (not sent by self)
  const prevMsgId = useRef(null);
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (
      lastMsg.id !== prevMsgId.current &&
      lastMsg.senderId !== user?.uid &&
      audioRef.current
    ) {
      audioRef.current.currentTime = 0;
      // Try to play, fallback if blocked
      const playPromise = audioRef.current.play();
      if (playPromise) playPromise.catch(() => {});
    }
    prevMsgId.current = lastMsg.id;
  }, [messages, user?.uid]);

  const otherUid = () => {
    if (!threadId || !user) return null;
    const [vId, cId] = threadId.split('__');
    return user.uid === vId ? cId : vId;
  };

  const onSend = async () => {
    const to = otherUid();
    if (!to || !text.trim() || !threadId) return;
    await sendChatMessage(threadId, { senderId: user.uid, to, text: text.trim() });
    setText('');
  };

  // Defer pharmacy products listener until the prescription modal opens
  useEffect(() => {
    if (!showPrescriptionModal) return;
    let vId = null;
    if (profile?.role === 'pharmacy') vId = user?.uid;
    else if (threadId) [vId] = threadId.split('__');
    if (!vId) return;
    const q = query(collection(db, 'products'), where('pharmacyId', '==', vId));
    const unsub = onSnapshot(q, snap => {
      setPharmacyProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub && unsub();
  }, [showPrescriptionModal, profile?.role, user?.uid, threadId]);

  // Handle prescription creation
  const handleCreatePrescription = async ({ drugs, startDate, duration, notes }) => {
    if (!threadId || !user) return;
    const [vId, cId] = threadId.split('__');
    await createPrescription({
      pharmacyId: vId,
      customerId: cId,
      chatThreadId: threadId,
      drugs,
      startDate,
      duration,
      notes,
    });
    setShowPrescriptionModal(false);
    // Optionally, send a chat message
    await sendChatMessage(threadId, { senderId: user.uid, to: cId, text: 'A new prescription has been created.' });
  };

  // Prefill message input if product info is present (runs when product params change)
  useEffect(() => {
    if (productName && productId) {
      const priceText = productPrice ? productPrice : '';
      setText(`I want to know more about this drug ${productName}${priceText ? ', ' + priceText : ''}.`);
    } else if (prefillMsg) {
      setText(prefillMsg);
    }
    // eslint-disable-next-line
  }, [productName, productPrice, productId, prefillMsg]);

  return (
    // Make the chat UI cover the full viewport and allow inner scrolling to work
    <div className="h-screen w-full flex flex-col items-stretch overflow-visible" style={{ position: 'relative' }}>
      {/* Fixed background layer (non-scrollable) placed above page background but behind UI */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100vw',
          height: '100vh',
          backgroundImage: `url(${ChatBgUrl})`,
          backgroundRepeat: 'repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Main content wrapper sits above the fixed background */}
      <div style={{ position: 'relative', zIndex: 10 }} className="flex-1 flex flex-col min-h-0">
        {/* Scoped CSS to visually hide scrollbar but keep scrolling functional */}
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none} .hide-scrollbar{-ms-overflow-style:none; scrollbar-width:none;}`}</style>
         {/* Audio for message tone (defer load until needed) */}
         <audio ref={audioRef} src={notificationSound} preload="none" />
        {/* Header (full-bleed background, centered content). Negate parent padding with -mx to reach screen edges */}
        <div
          className="sticky top-0 z-20 bg-white/90 pt-1 pb-1"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0)',
            // Force the header background to span the full viewport width even when content is centered with max-width
            width: '100vw',
            marginLeft: 'calc(50% - 50vw)',
            // Respect safe-area on notch devices
            paddingRight: 'env(safe-area-inset-right, 0)'
          }}
        >
          <div className="w-full px-4 sm:px-5 pt-6 pb-3 flex items-center gap-3 justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/messages');
                  }
                }}
                className="rounded-full border px-3 sm:px-4 py-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {/* Customer: show pharmacy name as link */}
              {profile?.role === 'customer' ? (
                <button
                  className="min-w-0 font-light text-[15px] sm:text-[17px] truncate text-left hover:underline focus:outline-none"
                  onClick={() => {
                    if (threadId) {
                      const [vId] = threadId.split('__');
                      navigate(`/vendor/${vId}`);
                    }
                  }}
                  title={otherName}
                >
                  {otherName || '...'}
                </button>
              ) : (
                <div className="min-w-0">
                  <div className="font-light text-[15px] sm:text-[17px] truncate">{otherName || '...'}</div>
                  <div className="text-[9px] text-zinc-500 truncate">{otherSubline}</div>
                </div>
              )}
            </div>
            {/* Call button for customer */}
            {profile?.role === 'customer' && (
              <a
                href={pharmacyPhone ? `tel:${pharmacyPhone}` : undefined}
                className={`flex items-center justify-center rounded-full border border-sky-500 text-sky-600 px-2 py-1 text-[11px] font-poppins font-light ${pharmacyPhone ? 'hover:bg-sky-50' : 'opacity-40 cursor-not-allowed'}`}
                style={{ minWidth: 32 }}
                title={pharmacyPhone ? `Call ${otherName}` : 'No phone number'}
                tabIndex={pharmacyPhone ? 0 : -1}
                aria-disabled={!pharmacyPhone}
              >
                <CallIcon className="h-3 w-3 mr-1" /> Call
              </a>
            )}
            {/* Dropdown for pharmacy actions */}
            {profile?.role === 'pharmacy' && threadId && (
              <Menu as="div" className="relative inline-block text-left ml-2">
                <Menu.Button className="px-3 py-1 rounded-full bg-sky-600 text-white text-xs font-medium">Actions ▾</Menu.Button>
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border border-sky-200 divide-y divide-gray-100 rounded-[5px] shadow-lg focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`w-full text-left px-4 py-2 text-[12px] font-light ${active ? 'bg-sky-50' : ''}`}
                          onClick={() => setShowPrescriptionModal(true)}
                        >
                          Create Prescription
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          className={`w-full text-left px-4 py-2 text-[12px] font-light ${active ? 'bg-sky-50' : ''}`}
                          onClick={() => setShowPrescriptionHistory(true)}
                        >
                          View Prescription History
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Menu>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="w-full flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-32 min-h-0 hide-scrollbar" style={{ paddingTop: 16 }}>
            {(() => {
              let lastDate = null;
              return messages.map((m) => {
                const isMine = m.senderId === user?.uid;
                const t = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000) : null;
                let showDate = false;
                if (t) {
                  const dayStr = t.toDateString();
                  if (lastDate !== dayStr) {
                    showDate = true;
                    lastDate = dayStr;
                  }
                }
                return (
                  <React.Fragment key={m.id}>
                    {showDate && t && (
                      <div className="flex justify-center my-8 mb-6">
                        <span className="bg-gray-200/80 backdrop-blur-sm text-gray-600 text-[11px] font-medium px-3 py-1.5 rounded-full shadow-sm">
                          {getDateLabel(t)}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col items-${isMine ? 'end' : 'start'} w-full mb-3`}>
                      <div
                        className={`${
                          isMine 
                            ? 'bg-blue-500 text-white ml-12' 
                            : 'bg-gray-100 text-black mr-12'
                        } px-4 py-3 max-w-[85%] sm:max-w-[75%] whitespace-pre-wrap break-words shadow-sm transition-all duration-200 hover:shadow-md`}
                        style={{ 
                          borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          fontSize: 16,
                          lineHeight: 1.4,
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <MessageWithLinks text={m.text} isMine={isMine} />
                      </div>
                      <div className={`flex items-center text-[11px] text-gray-500 mt-1 ${isMine ? 'mr-2 justify-end' : 'ml-2 justify-start'}`}>
                        <span>{t ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        <MessageStatus message={m} isMine={isMine} />
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
            <div ref={bottomRef} />
          </div>

          {/* Composer (full-bleed background, centered content). Negate parent padding with -mx to reach screen edges */}
          <div
            className="w-full sticky bottom-0 z-20 bg-white/85 backdrop-blur"
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0)',
              // Make the composer background truly full-bleed across the viewport
              width: '100vw',
              marginLeft: 'calc(50% - 50vw)',
              paddingLeft: 'env(safe-area-inset-left, 0)',
              paddingRight: 'env(safe-area-inset-right, 0)'
            }}
          >
            <div className="w-full">
              <form className="mx-4 sm:mx-5 flex items-center gap-3 py-3" onSubmit={(e) => { e.preventDefault(); onSend(); }}>
                <label className="flex items-center cursor-not-allowed opacity-40" title="Attachments coming soon">
                  <Paperclip className="h-5 w-5 text-gray-400" />
                </label>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="iMessage"
                  className="flex-1 min-w-0 outline-none px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-full placeholder:text-gray-400 placeholder:text-[14px] shadow-sm focus:border-blue-300 focus:shadow-md transition-all duration-200"
                  style={{ fontSize: 16 }}
                />
                <button 
                  type="submit" 
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                    text.trim() 
                      ? 'bg-blue-500 hover:bg-blue-600 shadow-md hover:shadow-lg transform hover:scale-105' 
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                  disabled={!text.trim()}
                >
                  <img src={SendButtonUrl} alt="Send" className="h-4 w-4" />
                </button>
              </form>
              <div style={{ height: 8 }} />
            </div>
          </div>
        </div>

        {/* Create Prescription Modal */}
        <CreatePrescriptionModal
          open={showPrescriptionModal}
          onClose={() => setShowPrescriptionModal(false)}
          products={pharmacyProducts}
          onSubmit={handleCreatePrescription}
        />
        {/* Prescription History Modal */}
        <Modal open={showPrescriptionHistory} onClose={() => setShowPrescriptionHistory(false)}>
          <PrescriptionList chatThreadId={threadId} products={pharmacyProducts} userId={user?.uid} />
        </Modal>

        {/* Prescription Quick Actions (for customer) */}
        {/* Removed PrescriptionList from chat thread view as per requirements */}
      </div>
    </div>
  );
}
