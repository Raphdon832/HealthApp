import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Phone } from 'lucide-react';
import SendIcon from '@/icons/react/SendIcon';
import AttachmentIcon from '@/icons/react/AttachmentIcon';
import { ensureThread, listenThread, sendMessage } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '@/lib/firebase';

export default function ChatThread({ scrollTo, onClose, vendorId: vendorIdProp, onBackRoute }) {
  const { user } = useAuth();
  const params = useParams();
  const vendorId = vendorIdProp || params.vendorId;
  const [vendor, setVendor] = useState(null);
  const [threadId, setThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const bottomRef = useRef(null);
  const messageRefs = useRef([]);
  const navigate = useNavigate();

  // Refactored: Only customers can initiate a chat thread
  // Thread creation now stores vendorId, customerId, vendorName, customerName
  async function ensureCustomerThread(vendorId, customerId) {
    const threadId = `${vendorId}__${customerId}`;
    const ref = doc(db, 'threads', threadId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      // Fetch names for both participants
      const vendorSnap = await getDoc(doc(db, 'pharmacies', vendorId));
      const vendorName = vendorSnap.exists() ? vendorSnap.data().name : 'Vendor';
      const customerSnap = await getDoc(doc(db, 'users', customerId));
      const customerName = customerSnap.exists() ? customerSnap.data().displayName : 'Customer';
      await setDoc(ref, {
        id: threadId,
        participants: [vendorId, customerId],
        vendorId,
        customerId,
        vendorName,
        customerName,
        createdAt: new Date(),
      });
    }
    return threadId;
  }

  useEffect(() => {
    console.log('ChatThread debug:', { user, vendorId });
    if (!user) return;
    // Only customers can initiate thread
    if (user.role === 'customer') {
      if (vendorId) {
        ensureCustomerThread(vendorId, user.uid).then(setThreadId);
        getDoc(doc(db, 'pharmacies', vendorId)).then(snap => {
          const data = snap.data();
          if (!data) {
            setVendor({ name: 'Unknown Pharmacy (ID: ' + vendorId + ')', address: '', phone: '' });
          } else {
            setVendor(data);
          }
        });
      }
    } else if (threadId) {
      // Vendors only join existing threads
      const parts = threadId.split('__');
      const resolvedVendorId = parts[0];
      getDoc(doc(db, 'pharmacies', resolvedVendorId)).then(snap => {
        const data = snap.data();
        if (!data) {
          setVendor({ name: 'Unknown Pharmacy (ID: ' + resolvedVendorId + ')', address: '', phone: '' });
        } else {
          setVendor(data);
        }
      });
    }
  }, [user, vendorId, threadId]);

  useEffect(() => {
    if (threadId) {
      return listenThread(threadId, (msgs) => {
        const sorted = [...msgs].sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return aTime - bTime;
        });
        setMessages(sorted);
      });
    }
  }, [threadId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  useEffect(() => {
    if (typeof scrollTo === 'number' && messageRefs.current[scrollTo]) {
      messageRefs.current[scrollTo].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [scrollTo, messages.length]);

  // Helper to get the other participant's UID and name
  function getOtherParticipant() {
    if (!user || !vendorId || !threadId) return null;
    // Thread is always vendorId__customerId
    const parts = threadId.split('__');
    if (user.uid === vendorId) return parts[1]; // vendor signed in, other is customer
    return vendorId; // customer signed in, other is vendor
  }

  function getOtherParticipantName() {
    if (!user || !vendorId || !threadId) return '';
    const parts = threadId.split('__');
    if (user.uid === vendorId) {
      // vendor signed in, show customer name
      // Try to get from first message senderId if available
      const firstMsg = messages.find(m => m.senderId === parts[1]);
      if (firstMsg && firstMsg.senderName) return firstMsg.senderName;
      // Fallback: show UID
      return parts[1];
    }
    // customer signed in, show vendor name
    return vendor?.name || vendorId;
  }

  const send = async () => {
    if (!text.trim() && !file || !threadId) return;
    setText('');
    const toUid = getOtherParticipant();
    if (file) {
      // Upload file logic here (pseudo-code)
      // const url = await uploadFile(file);
      // await sendMessage(threadId, { senderId: user.uid, to: toUid, fileUrl: url, fileName: file.name });
      setFile(null);
    }
    if (text.trim()) {
      await sendMessage(threadId, { senderId: user.uid, to: toUid, text });
    }
  };

  // Helper to format date stamps
  function getDateStamp(date) {
    const now = new Date();
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = (today - msgDate) / (1000 * 60 * 60 * 24);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return msgDate.toLocaleDateString('en-GB'); // dd/mm/yyyy
  }

  function isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  if (!vendor) return <div className="p-8 text-center">Loading chat...</div>;
  if (vendor.name?.startsWith('Error:')) {
    return <div className="p-8 text-center text-red-500">{vendor.name}</div>;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-white px-2 md:px-8 lg:px-16 xl:px-32">
      {/* Header */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto pt-8 pb-4">
        <div className="max-w-md mx-auto w-full fixed top-0 left-0 right-0 z-30" style={{background: 'rgba(255,255,255,0.20)', backdropFilter: 'blur(50px)', boxShadow: '0 2px 12px rgba(0,0,0,0.04)'}}>
          <div className="px-5 pt-6 pb-3 border-b flex items-center justify-between gap-3">
            {/* left: back + vendor info */}
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => {
                if (onClose) onClose();
                if (onBackRoute) navigate(onBackRoute);
                else navigate('/messages');
              }} className="rounded-full border px-4 py-1 shrink-0" style={{borderColor: '#000', borderWidth: 1}}>
                <ArrowLeft className="h-3 w-6" />
              </button>
              <div className="min-w-0 cursor-pointer" onClick={() => navigate(`/vendor/${vendorId}`)}>
                <div className="font-extralight text-[17px] truncate" style={{fontFamily: 'Poppins'}}>{getOtherParticipantName()}</div>
                <div className="text-[9px] text-zinc-500 truncate font-extralight">{user.uid === vendorId ? '' : vendor.address}</div>
              </div>
            </div>
            {/* right: call action only */}
            <div className="flex gap-2 shrink-0">
              <a href={`tel:${vendor.phone}`} className="rounded-full border px-3 py-1 flex items-center justify-center gap-1" style={{width: 90, height: 25, fontSize: 7, borderColor: '#36A5FF', color: '#000000', borderWidth: 1}}>
                <Phone className="h-2.5 w-2.5" /> Call
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Chat content */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex-1 flex flex-col">
        {/* Scrollable messages area */}
        <div className="flex-1 w-full max-w-md mx-auto relative">
          {/* Top blur overlay for scroll effect */}
          <div className="pointer-events-none fixed top-[-80px] left-0 right-0 max-w-md mx-auto h-6 z-20" style={{background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0) 100%)', backdropFilter: 'blur(8px)'}} />
          <div className="overflow-y-auto overflow-x-hidden px-2 py-4 space-y-3" style={{height: '100%', margin: 0, paddingTop: '85px', paddingBottom: '0px'}}>
            {(() => {
              let lastDate = null;
              return messages.map((m, idx) => {
                const msgDate = m.createdAt ? new Date(m.createdAt.seconds * 1000) : null;
                let showDate = false;
                if (msgDate) {
                  const dateStr = msgDate.toDateString();
                  if (lastDate !== dateStr) {
                    showDate = true;
                    lastDate = dateStr;
                  }
                }
                const messageKey = m.id || `${msgDate?.getTime() || 'unknown'}-${idx}`;
                return (
                  <React.Fragment key={messageKey}>
                    {showDate && msgDate && (
                      <div className="w-full flex justify-center my-2" key={`date-${msgDate.getTime()}`}>
                        <span className="bg-zinc-200 text-zinc-600 text-[7px] px-3 py-1 rounded-full shadow-sm">{getDateStamp(msgDate)}</span>
                      </div>
                    )}
                    <div ref={el => (messageRefs.current[idx] = el)} className={`flex flex-col items-${m.senderId === user?.uid ? 'end' : 'start'} w-full`}>
                      <div className={`whatsapp-bubble ${m.senderId === user?.uid ? 'bg-sky-600 text-white ml-auto' : 'bg-zinc-100 text-zinc-900'} px-2 py-1 rounded-2xl mb-1 max-w-[70%] whitespace-pre-wrap break-words overflow-hidden shadow-sm`} style={{borderRadius: m.senderId === user?.uid ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: '11px', padding: '7px 12px', minHeight: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)'}}>
                        {m.text}
                        {m.fileUrl && isValidUrl(m.fileUrl) && (
                          <div className="mt-2">
                            {m.fileUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <img src={m.fileUrl} alt={m.fileName || 'Attachment'} className="max-w-[120px] max-h-[120px] rounded-lg border border-zinc-200" />
                            ) : (
                              <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 underline text-xs">{m.fileName || 'Download attachment'}</a>
                            )}
                          </div>
                        )}
                        {m.fileUrl && !isValidUrl(m.fileUrl) && (
                          <div className="mt-2 text-xs text-red-400">Invalid attachment link</div>
                        )}
                      </div>
                      <div className={`text-xs text-zinc-400 ${m.senderId === user?.uid ? 'mr-2' : 'ml-2'}`} style={{fontSize: '11px'}}>
                        {m.createdAt ? new Date(m.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
            <div ref={bottomRef} />
          </div>
        </div>
        {/* Sticky composer at bottom */}
        <div className="max-w-md mx-auto w-full fixed bottom-0 left-0 right-0 z-30" style={{background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', boxShadow: '0 -2px 12px rgba(0,0,0,0.04)'}}>
          <form className="mx-5 flex items-center gap-2 py-2" onSubmit={async (e) => { e.preventDefault(); await send(); }}>
            <label className="flex items-center cursor-pointer mr-2">
              <input type="file" className="hidden" onChange={e => setFile(e.target.files[0])} />
              <AttachmentIcon className="h-5 w-5 text-zinc-400 hover:text-sky-600" />
            </label>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message" className="flex-1 min-w-0 outline-none px-3 bg-transparent border border-zinc-300 rounded-3xl placeholder:text-[12px]" style={{fontSize: '13px', height: '27px'}} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if ((text.trim() || file) && threadId) { send(); } } }} />
            <button type="submit" className="ml-2 flex items-center justify-center" style={{background: 'none', border: 'none', padding: 0, cursor: (text.trim() || file) ? 'pointer' : 'default'}} disabled={!(text.trim() || file)}>
              <SendIcon className="h-5 w-5" style={{color: (text.trim() || file) ? '#36A5FF' : '#bdbdbd'}} />
            </button>
          </form>
          <div style={{height: '6px'}} />
        </div>
      </div>
    </div>
  );
}

// Thread listing logic for messages page (to be used in Messages.jsx)
// For customers: list threads where customerId == user.uid
// For vendors: list threads where vendorId == user.uid
// Display the other participant's name from thread data
// Example usage:
// const threads = ... // fetched from Firestore
// const myThreads = threads.filter(t =>
//   user.role === 'customer' ? t.customerId === user.uid : t.vendorId === user.uid
// );
// function getOtherName(thread) {
//   return user.role === 'customer' ? thread.vendorName : thread.customerName;
// }