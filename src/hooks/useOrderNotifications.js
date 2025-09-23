import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';

export function useOrderNotifications() {
  const [newOrder, setNewOrder] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const { profile, user } = useAuth();
  const lastOrderTimeRef = useRef(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (!profile || profile.role !== 'pharmacy') {
      return;
    }

    // Request notification permission on mount for pharmacies
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const pharmacyId = profile.uid || user?.uid;
    if (!pharmacyId) return;

    // Set initial timestamp to prevent showing notifications for old orders
    if (isInitialLoadRef.current) {
      lastOrderTimeRef.current = new Date();
      isInitialLoadRef.current = false;
    }

    // Listen for new orders
    const q = query(
      collection(db, 'orders'),
      where('pharmacyId', '==', pharmacyId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const orderData = { id: change.doc.id, ...change.doc.data() };
          const orderTime = orderData.createdAt?.toDate() || new Date();

          // Only show notification for orders created after the hook initialized
          if (lastOrderTimeRef.current && orderTime > lastOrderTimeRef.current) {
            // Play notification sound if available
            playNotificationSound();
            
            // Show browser notification if tab is not focused
            showBrowserNotification(orderData);
            
            setNewOrder(orderData);
            setShowNotification(true);
          }
        }
      });
    }, (error) => {
      console.error('Error listening for order notifications:', error);
    });

    return () => unsubscribe();
  }, [profile, user]);

  const playNotificationSound = () => {
    try {
      // Use the existing message tone or create a custom notification sound
      const audio = new Audio('/src/assets/message-tone.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Silently fail if audio can't be played (e.g., no user interaction yet)
      });
    } catch (error) {
      // Silently fail if audio file is not available
    }
  };

  const showBrowserNotification = (order) => {
    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Show browser notification if permission is granted and tab is not focused
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      const notification = new Notification('New Order Received! 📦', {
        body: `Order #${order.id?.slice(-8)} - ₦${(order.total || 0).toLocaleString()} from ${order.customerName || 'Customer'}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'new-order',
        requireInteraction: false,
        silent: false
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Handle notification click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  const clearNotification = () => {
    setShowNotification(false);
    setNewOrder(null);
  };

  const viewOrder = (order) => {
    // This will be handled by the parent component
    return order;
  };

  return {
    newOrder,
    showNotification,
    clearNotification,
    viewOrder
  };
}
