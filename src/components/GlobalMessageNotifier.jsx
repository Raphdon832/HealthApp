import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { listenUserThreads } from '@/lib/db';
import notificationService from '@/lib/notifications';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

/**
 * GlobalMessageNotifier
 * Listens for new incoming messages for the current user and plays a sound if:
 * - The message is not sent by the user
 * - The user is NOT currently viewing the thread (by URL)
 */
export default function GlobalMessageNotifier() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const lastMsgIds = useRef({}); // { threadId: lastMsgId }

  useEffect(() => {
    if (!user?.uid || !profile?.role) return;
    return listenUserThreads(
      { uid: user.uid, role: profile.role },
      (threads) => {
        threads.forEach((thread) => {
          if (!thread.id) return;
          const messagesQ = query(
            collection(db, 'threads', thread.id, 'messages'),
            orderBy('createdAt', 'desc'),
            limit(1)
          );
          onSnapshot(messagesQ, (snap) => {
            if (snap.empty) return;
            const msg = { id: snap.docs[0].id, ...snap.docs[0].data() };
            const isMine = msg.senderId === user.uid;
            let isViewingThread = false;
            // 1. /chat/:vendorId (full page chat route)
            if (location.pathname.startsWith('/chat/')) {
              const vendorId = location.pathname.split('/chat/')[1]?.split('/')[0];
              if (profile.role === 'customer') {
                if (thread.id === `${vendorId}__${user.uid}`) isViewingThread = true;
              } else {
                // For pharmacy, vendorId is their own uid, so find thread with their uid and any customer
                if (thread.id.startsWith(`${user.uid}__`)) {
                  // If pharmacy is in a full-page chat, we can't know which customer unless you encode it in the route
                  isViewingThread = true;
                }
              }
            }
            // 2. /messages?chat=... (modal chat route)
            if (location.pathname === '/messages') {
              const params = new URLSearchParams(location.search);
              const chatId = params.get('chat');
              if (chatId) {
                if (profile.role === 'customer') {
                  // thread.id = <vendorId>__<customerId>
                  if (thread.id === `${chatId}__${user.uid}`) isViewingThread = true;
                } else {
                  // thread.id = <pharmacyId>__<customerId>
                  if (thread.id === `${user.uid}__${chatId}`) isViewingThread = true;
                }
              }
            }
            
            // Check if this is a new message we should notify about
            if (!isMine && lastMsgIds.current[thread.id] !== msg.id && !isViewingThread) {
              // Get sender information for the notification
              const senderName = profile.role === 'customer' 
                ? thread.pharmacyName || 'Pharmacy'
                : thread.customerName || 'Customer';
              
              // Create message data for notification
              const messageData = {
                ...msg,
                senderName,
                threadId: thread.id
              };
              
              // Use notification service to show notification
              notificationService.notifyMessageReceived(messageData);
            }
            lastMsgIds.current[thread.id] = msg.id;
          });
        });
      },
      (err) => console.error('GlobalMessageNotifier error:', err)
    );
  }, [user?.uid, profile?.role, location.pathname, location.search]);

  return null; // No audio element needed - handled by notification service
}
