import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import {
  getOrCreateThread,
  listenThreadMessages,
  sendChatMessage,
  markThreadRead
} from '@/lib/db';
import { doc, getDoc } from 'firebase/firestore';
import { Paperclip } from 'lucide-react';
import SendButtonUrl from '@/icons/SendButton.svg?url';
import CallIcon from '@/icons/react/CallIcon';
import notificationSound from '@/assets/message-tone.mp3'; // You need to provide this mp3 file
import CreatePrescriptionModal from '@/components/CreatePrescriptionModal';
import PrescriptionList from '@/components/PrescriptionList';
import { createPrescription } from '@/lib/db';
import { Menu } from '@headlessui/react';
import Modal from '@/components/Modal';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
// Use the SVG placed in the `public/` folder so production (Netlify) serves it at root
const ChatBgUrl = '/ChatBg.svg';

/**
 * Props (either/or):
 * - vendorId: string  -> used only when role === 'customer' (start chat with this pharmacy)
 * - threadId: string  -> used for existing threads (vendor flow or customer opening from list)
 * - onBackRoute?: string
 * - onClose?: () => void
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

export default function ChatThread({ vendorId, threadId: threadIdProp, onBackRoute, onClose, overlayOpacity = 0.3 }) {
  const { user, profile } = useAuth();
  const [threadId, setThreadId] = useState(threadIdProp || null);

  // 🔹 What to show in the sticky header
  const [otherName, setOtherName] = useState('');
  const [otherSubline, setOtherSubline] = useState(''); // e.g., address or email

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [pharmacyPhone, setPharmacyPhone] = useState('');
  const bottomRef = useRef(null);
  const navigate = useNavigate();

  const [lastMessageId, setLastMessageId] = useState(null);
  const [isTabActive, setIsTabActive] = useState(true);
  const audioRef = useRef(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [pharmacyProducts, setPharmacyProducts] = useState([]);
  const [showPrescriptionHistory, setShowPrescriptionHistory] = useState(false);

  // Resolve thread:
  // - customer + vendorId => create/get
  // - vendor => must have threadIdProp (do NOT create)
  useEffect(() => {
    if (!user) return;

    (async () => {
      if (profile?.role === 'customer') {
        if (!vendorId) return; // wait for vendorId (coming from "Message vendor" button)
        const id = await getOrCreateThread({ vendorId, customerId: user.uid, role: 'customer' });
        setThreadId(id);
      } else {
        // Vendor path — must be opening an existing thread
        if (!threadIdProp) {
          console.warn('Vendor tried to open chat without threadId. Navigate from Messages list.');
          return;
        }
        setThreadId(threadIdProp);
      }
    })().catch(console.error);
  }, [user?.uid, profile?.role, vendorId, threadIdProp]);

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
    const stop = listenThreadMessages(threadId, setMessages, console.error);
    markThreadRead(threadId, user.uid).catch(console.error);
    return stop;
  }, [threadId, user?.uid]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  // Page visibility for message tone
  useEffect(() => {
    const handleVisibility = () => setIsTabActive(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

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

  // Fetch pharmacy products for prescription modal
  useEffect(() => {
    let vId = null;
    if (profile?.role === 'pharmacy') vId = user?.uid;
    else if (threadId) [vId] = threadId.split('__');
    if (!vId) return;
    // Use modular Firestore API
    const q = query(collection(db, 'products'), where('pharmacyId', '==', vId));
    const unsub = onSnapshot(q, snap => {
      setPharmacyProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [profile?.role, user?.uid, threadId]);

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
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          backgroundSize: 'cover',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Optional semi-transparent overlay for contrast (configurable via prop `overlayOpacity`) */}
      {overlayOpacity > 0 && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: `rgba(255,255,255, ${overlayOpacity})`,
            pointerEvents: 'none',
            zIndex: 5
          }}
        />
      )}

      {/* Main content wrapper sits above the fixed background */}
      <div style={{ position: 'relative', zIndex: 10 }} className="flex-1 flex flex-col min-h-0">
        {/* Scoped CSS to visually hide scrollbar but keep scrolling functional */}
        <style>{`.hide-scrollbar::-webkit-scrollbar{display:none} .hide-scrollbar{-ms-overflow-style:none; scrollbar-width:none;}`}</style>
         {/* Audio for message tone */}
         <audio ref={audioRef} src={notificationSound} preload="auto" />
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
                onClick={() => { onClose?.(); navigate(onBackRoute || '/messages'); }}
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
          <div className="flex-1 overflow-y-auto px-2 sm:px-3 pb-28 min-h-0 hide-scrollbar" style={{ paddingTop: 12 }}>
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
                      <div className="flex justify-center my-6 mb-6">
                        <span className="bg-zinc-200 text-zinc-600 text-[10px] px-3 py-1 rounded-full shadow-sm">
                          {getDateLabel(t)}
                        </span>
                      </div>
                    )}
                    <div className={`flex flex-col items-${isMine ? 'end' : 'start'} w-full mb-2`}>
                      <div
                        className={`${isMine ? 'bg-sky-600 text-white' : 'bg-zinc-100 text-zinc-900'} px-3 py-2 rounded-2xl max-w-[90%] sm:max-w-[75%] whitespace-pre-wrap break-words shadow-sm`}
                        style={{ borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 13 }}
                      >
                        {m.text}
                      </div>
                      <div className={`text-[9px] sm:text-[10px] text-zinc-400 ${isMine ? 'mr-2' : 'ml-2'}`}>
                        {t ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
              <form className="mx-3 sm:mx-5 flex items-center gap-2 py-2" onSubmit={(e) => { e.preventDefault(); onSend(); }}>
                <label className="flex items-center cursor-not-allowed mr-1 opacity-40" title="Attachments coming soon">
                  <Paperclip className="h-5 w-5 text-zinc-400" />
                </label>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder="Type a message"
                  className="flex-1 min-w-0 outline-none px-3 bg-transparent border border-zinc-300 rounded-3xl placeholder:text-[11px] sm:placeholder:text-[12px]"
                  style={{ fontSize: 13, height: 34 }}
                />
                <button type="submit" className="ml-1 flex items-center justify-center disabled:opacity-50" disabled={!text.trim()}>
                  <img src={SendButtonUrl} alt="Send" className="h-5 w-5" />
                </button>
              </form>
              <div style={{ height: 6 }} />
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
