import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth';
import notificationService from '@/lib/notifications';

/**
 * CustomerOrderNotifier
 * Listens for order status changes for customers and sends notifications
 */
export default function CustomerOrderNotifier() {
  const { user, profile } = useAuth();
  const lastOrderStatuses = useRef({}); // { orderId: status }
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!user?.uid || !profile || profile.role !== 'customer') {
      return;
    }

    const customerId = profile.uid || user.uid;
    
    // Listen for customer's orders
    const q = query(
      collection(db, 'orders'),
      where('customerId', '==', customerId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isInitialized.current) {
        // Initialize the status tracking on first load
        snapshot.docs.forEach((doc) => {
          const order = { id: doc.id, ...doc.data() };
          lastOrderStatuses.current[order.id] = order.status;
        });
        isInitialized.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const order = { id: change.doc.id, ...change.doc.data() };
          const previousStatus = lastOrderStatuses.current[order.id];
          
          // Check if status actually changed
          if (previousStatus && previousStatus !== order.status) {
            // Notify about status change
            notificationService.notifyOrderStatusUpdated(order);
            
            // Special case for prescription ready
            if (order.status === 'ready' && order.type === 'prescription') {
              notificationService.notifyPrescriptionReady({
                ...order,
                pharmacyName: order.pharmacyName || 'Pharmacy'
              });
            }
          }
          
          // Update our tracking
          lastOrderStatuses.current[order.id] = order.status;
        }
        
        if (change.type === 'added') {
          // Track new orders but don't notify (they created it themselves)
          const order = { id: change.doc.id, ...change.doc.data() };
          lastOrderStatuses.current[order.id] = order.status;
        }
      });
    }, (error) => {
      console.error('Error listening for customer order notifications:', error);
    });

    return () => unsubscribe();
  }, [user, profile]);

  return null; // This is a notification-only component
}
