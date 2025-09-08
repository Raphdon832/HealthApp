import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { listenUserThreads } from '@/lib/db';
import notificationSound from '@/assets/message-tone.mp3';

/**
 * GlobalMessageNotifier
 * Listens for new incoming messages for the current user and plays a sound if:
 * - The message is not sent by the user
 * - The user is NOT currently viewing the thread (by URL)
 */
export default function GlobalMessageNotifier() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const audioRef = useRef(null);
  const lastMsgIds = useRef({}); // { threadId: lastMsgId }

  useEffect(() => {
    if (!user?.uid || !profile?.role) return;
    // Listen to all threads for this user
    return listenUserThreads(
      { uid: user.uid, role: profile.role },
      (threads) => {
        threads.forEach((thread) => {
          // Listen to the last message in each thread
          if (!thread.id) return;
          const messagesCol = window.firebase.firestore().collection('threads').doc(thread.id).collection('messages');
          messagesCol.orderBy('createdAt', 'desc').limit(1).onSnapshot((snap) => {
            if (snap.empty) return;
            const msg = { id: snap.docs[0].id, ...snap.docs[0].data() };
            // Only play if not sent by self, and not in this thread
            const isMine = msg.senderId === user.uid;
            const isViewingThread = location.pathname.includes('/chat/') || (location.pathname === '/messages' && location.search.includes(thread.vendorId));
            if (!isMine && lastMsgIds.current[thread.id] !== msg.id && !isViewingThread) {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(() => {});
              }
            }
            lastMsgIds.current[thread.id] = msg.id;
          });
        });
      },
      (err) => console.error('GlobalMessageNotifier error:', err)
    );
  }, [user?.uid, profile?.role, location.pathname, location.search]);

  return <audio ref={audioRef} src={notificationSound} preload="auto" style={{ display: 'none' }} />;
}
