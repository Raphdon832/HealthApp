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
import { Paperclip, Send } from 'lucide-react';

/**
 * Props (either/or):
 * - vendorId: string  -> used only when role === 'customer' (start chat with this pharmacy)
 * - threadId: string  -> used for existing threads (vendor flow or customer opening from list)
 * - onBackRoute?: string
 * - onClose?: () => void
 */
export default function ChatThread({ vendorId, threadId: threadIdProp, onBackRoute, onClose }) {
  const { user, profile } = useAuth();
  const [threadId, setThreadId] = useState(threadIdProp || null);

  // 🔹 What to show in the sticky header
  const [otherName, setOtherName] = useState('');
  const [otherSubline, setOtherSubline] = useState(''); // e.g., address or email

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const navigate = useNavigate();

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

      // threadId = `${vendorId}__${customerId}`
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

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-white">
      {/* Header */}
      <div className="w-full max-w-md mx-auto pt-8 pb-4 sticky top-0 z-20 bg-white/80 backdrop-blur">
        <div className="px-5 pt-6 pb-3 border-b flex items-center gap-3">
          <button
            onClick={() => { onClose?.(); navigate(onBackRoute || '/messages'); }}
            className="rounded-full border px-4 py-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="min-w-0">
            <div className="font-light text-[17px] truncate">{otherName || '...'}</div>
            <div className="text-[9px] text-zinc-500 truncate">{otherSubline}</div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
        <div className="flex-1 w-full max-w-md mx-auto relative">
          <div className="overflow-y-auto px-3 pb-2" style={{ paddingTop: 12 }}>
            {messages.map((m) => {
              const isMine = m.senderId === user?.uid;
              const t = m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000) : null;
              return (
                <div key={m.id} className={`flex flex-col items-${isMine ? 'end' : 'start'} w-full mb-2`}>
                  <div
                    className={`${isMine ? 'bg-sky-600 text-white' : 'bg-zinc-100 text-zinc-900'} px-3 py-2 rounded-2xl max-w-[75%] whitespace-pre-wrap break-words shadow-sm`}
                    style={{ borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 12 }}
                  >
                    {m.text}
                  </div>
                  <div className={`text-[10px] text-zinc-400 ${isMine ? 'mr-2' : 'ml-2'}`}>
                    {t ? t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Composer */}
        <div className="max-w-md mx-auto w-full sticky bottom-0 left-0 right-0 z-20 bg-white/85 backdrop-blur">
          <form className="mx-5 flex items-center gap-2 py-2" onSubmit={(e) => { e.preventDefault(); onSend(); }}>
            <label className="flex items-center cursor-not-allowed mr-1 opacity-40" title="Attachments coming soon">
              <Paperclip className="h-5 w-5 text-zinc-400" />
            </label>
            <input
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message"
              className="flex-1 min-w-0 outline-none px-3 bg-transparent border border-zinc-300 rounded-3xl placeholder:text-[12px]"
              style={{ fontSize: 13, height: 34 }}
            />
            <button type="submit" className="ml-1 flex items-center justify-center disabled:opacity-50" disabled={!text.trim()}>
              <Send className="h-5 w-5" />
            </button>
          </form>
          <div style={{ height: 6 }} />
        </div>
      </div>
    </div>
  );
}
