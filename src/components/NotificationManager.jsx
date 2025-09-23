import React from 'react';
import GlobalMessageNotifier from './GlobalMessageNotifier';
import CustomerOrderNotifier from './CustomerOrderNotifier';
import { useAuth } from '@/lib/auth';

/**
 * NotificationManager
 * Central component that manages all notification systems
 * Should be included once in the main App component
 */
export default function NotificationManager() {
  const { profile } = useAuth();

  return (
    <>
      {/* Message notifications for all users */}
      <GlobalMessageNotifier />
      
      {/* Order status notifications for customers */}
      {profile?.role === 'customer' && <CustomerOrderNotifier />}
      
      {/* Order received notifications for pharmacies are handled by useOrderNotifications hook */}
    </>
  );
}
