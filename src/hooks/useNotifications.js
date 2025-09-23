import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import notificationService from '@/lib/notifications';

/**
 * Custom hook for handling push notifications in React components
 * Automatically manages notification permissions and user context
 */
export function useNotifications() {
  const { user, profile } = useAuth();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!user || !profile || isInitialized.current) return;
    
    // Initialize notification service for this user
    isInitialized.current = true;
    
    // Request permissions if needed
    if (notificationService.permissionStatus === 'default') {
      // Will be requested on user interaction
      console.log('Notification permissions will be requested on user interaction');
    }
  }, [user, profile]);

  const notify = {
    orderReceived: (order) => {
      if (profile?.role === 'pharmacy') {
        notificationService.notifyOrderReceived(order);
      }
    },
    
    orderStatusUpdated: (order) => {
      if (profile?.role === 'customer') {
        notificationService.notifyOrderStatusUpdated(order);
      }
    },
    
    messageReceived: (message) => {
      // Anyone can receive message notifications
      notificationService.notifyMessageReceived(message);
    },
    
    prescriptionReady: (prescription) => {
      if (profile?.role === 'customer') {
        notificationService.notifyPrescriptionReady(prescription);
      }
    }
  };

  return {
    notify,
    isSupported: notificationService.isSupported,
    isPermitted: notificationService.isPermitted,
    permissionStatus: notificationService.permissionStatus,
    requestPermission: () => {
      if (notificationService.isSupported && notificationService.permissionStatus === 'default') {
        Notification.requestPermission();
      }
    }
  };
}

/**
 * Hook specifically for order notifications (for pharmacies)
 */
export function useOrderNotifications() {
  const { notify } = useNotifications();
  const { profile } = useAuth();
  
  const notifyNewOrder = (order) => {
    if (profile?.role === 'pharmacy') {
      notify.orderReceived(order);
    }
  };

  return { notifyNewOrder };
}

/**
 * Hook specifically for message notifications
 */
export function useMessageNotifications() {
  const { notify } = useNotifications();
  
  const notifyNewMessage = (message) => {
    notify.messageReceived(message);
  };

  return { notifyNewMessage };
}

/**
 * Hook for customer order status notifications
 */
export function useCustomerOrderNotifications() {
  const { notify } = useNotifications();
  const { profile } = useAuth();
  
  const notifyOrderUpdate = (order) => {
    if (profile?.role === 'customer') {
      notify.orderStatusUpdated(order);
    }
  };

  const notifyPrescriptionReady = (prescription) => {
    if (profile?.role === 'customer') {
      notify.prescriptionReady(prescription);
    }
  };

  return { 
    notifyOrderUpdate, 
    notifyPrescriptionReady 
  };
}
