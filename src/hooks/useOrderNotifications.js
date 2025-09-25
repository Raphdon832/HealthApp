import { useEffect, useState, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import notificationService from '../lib/notifications';

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
            // Use the new notification service
            notificationService.notifyOrderReceived(orderData);
            
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
