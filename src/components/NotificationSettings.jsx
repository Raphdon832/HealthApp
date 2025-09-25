import React, { useState, useEffect } from 'react';
import { Bell, BellOff, CheckCircle, AlertCircle, Info } from 'lucide-react';
import notificationService from '@/lib/notifications';

/**
 * NotificationSettings
 * Component for managing notification preferences and permissions
 */
export default function NotificationSettings() {
  const [permissionStatus, setPermissionStatus] = useState(notificationService.permissionStatus);
  const [testNotificationSent, setTestNotificationSent] = useState(false);

  useEffect(() => {
    // Update permission status when component mounts
    setPermissionStatus(notificationService.permissionStatus);
    
    // Listen for permission changes
    const checkPermission = () => {
      setPermissionStatus(notificationService.permissionStatus);
    };

    // Check periodically for permission changes
    const interval = setInterval(checkPermission, 1000);
    return () => clearInterval(interval);
  }, []);

  const requestPermission = async () => {
    if (!notificationService.isSupported) {
      alert('Notifications are not supported in this browser');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const sendTestNotification = () => {
    if (!notificationService.isPermitted) {
      alert('Please enable notifications first');
      return;
    }

    // Send a test notification
    notificationService.showNotification('🔔 Test Notification', {
      body: 'This is a test notification from PharmaSeaHealth',
      tag: 'test',
      requireInteraction: false
    });

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const getStatusIcon = () => {
    switch (permissionStatus) {
      case 'granted':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'denied':
        return <BellOff className="h-5 w-5 text-red-500" />;
      case 'default':
        return <Bell className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'Notifications enabled';
      case 'denied':
        return 'Notifications blocked';
      case 'default':
        return 'Permission not requested';
      case 'not-supported':
        return 'Not supported in this browser';
      default:
        return 'Unknown status';
    }
  };

  const getStatusDescription = () => {
    switch (permissionStatus) {
      case 'granted':
        return 'You will receive notifications for new orders, messages, and order updates.';
      case 'denied':
        return 'Notifications are blocked. You can enable them in your browser settings.';
      case 'default':
        return 'Click the button below to enable notifications for orders and messages.';
      case 'not-supported':
        return 'Your browser does not support push notifications.';
      default:
        return 'Unable to determine notification status.';
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center gap-3 mb-4">
        <Bell className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Notification Settings</h3>
      </div>

      {/* Current Status */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-3 mb-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">{getStatusText()}</span>
        </div>
        <p className="text-sm text-gray-600">{getStatusDescription()}</p>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {permissionStatus === 'default' && (
          <button
            onClick={requestPermission}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Enable Notifications
          </button>
        )}

        {permissionStatus === 'granted' && (
          <button
            onClick={sendTestNotification}
            disabled={testNotificationSent}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
              testNotificationSent
                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {testNotificationSent ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Test Sent!
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                Send Test Notification
              </>
            )}
          </button>
        )}

        {permissionStatus === 'denied' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-red-800 mb-1">How to enable notifications:</p>
                <ol className="text-red-700 space-y-1 list-decimal list-inside">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Select "Allow" for notifications</li>
                  <li>Refresh the page</li>
                </ol>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="text-sm font-medium text-gray-900 mb-3">You'll be notified about:</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>New orders received (Pharmacies)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Order status updates (Customers)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>New messages in chats</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Prescription ready for pickup</span>
          </div>
        </div>
      </div>
    </div>
  );
}
