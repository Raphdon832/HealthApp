// Central notification service for the HealthApp
// Handles browser notifications, sound alerts, and permission management

class NotificationService {
  constructor() {
    this.audio = null;
    this.permissionRequested = false;
    this.notificationQueue = [];
    this.isProcessing = false;
    
    this.initializeAudio();
    this.requestPermissionOnUserInteraction();
  }

  // Initialize audio for notification sounds
  initializeAudio() {
    try {
      this.audio = new Audio('/src/assets/message-tone.mp3');
      this.audio.volume = 0.6;
      this.audio.preload = 'auto';
    } catch (error) {
      console.warn('Notification audio not available:', error);
    }
  }

  // Request notification permission on first user interaction
  requestPermissionOnUserInteraction() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    const requestPermission = () => {
      if (!this.permissionRequested && Notification.permission === 'default') {
        this.permissionRequested = true;
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    };

    // Request permission on user interaction
    document.addEventListener('click', requestPermission, { once: true });
    document.addEventListener('keydown', requestPermission, { once: true });
    document.addEventListener('touchstart', requestPermission, { once: true });
  }

  // Play notification sound
  playSound() {
    if (this.audio) {
      try {
        this.audio.currentTime = 0;
        this.audio.play().catch(error => {
          console.warn('Could not play notification sound:', error);
        });
      } catch (error) {
        console.warn('Audio playback error:', error);
      }
    }
  }

  // Show browser push notification
  showNotification(title, options = {}) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
      ...options
    };

    try {
      const notification = new Notification(title, defaultOptions);
      
      // Auto-close after 8 seconds if not requiring interaction
      if (!defaultOptions.requireInteraction) {
        setTimeout(() => {
          if (notification) notification.close();
        }, 8000);
      }

      // Handle notification click - focus window
      notification.onclick = () => {
        window.focus();
        notification.close();
        if (options.onClick) {
          options.onClick();
        }
      };

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  // Queue notifications to avoid spam
  queueNotification(notification) {
    this.notificationQueue.push(notification);
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.notificationQueue.length > 0) {
      const notificationData = this.notificationQueue.shift();
      await this.processNotification(notificationData);
      
      // Delay between notifications to prevent spam
      if (this.notificationQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.isProcessing = false;
  }

  async processNotification(notificationData) {
    const { type, data, options = {} } = notificationData;

    // Only show notifications if tab is not focused or explicitly requested
    const shouldShow = document.hidden || options.force;

    if (shouldShow) {
      this.playSound();
    }

    switch (type) {
      case 'order_received':
        return this.handleOrderReceived(data, shouldShow);
      case 'order_status_updated':
        return this.handleOrderStatusUpdated(data, shouldShow);
      case 'message_received':
        return this.handleMessageReceived(data, shouldShow);
      case 'prescription_ready':
        return this.handlePrescriptionReady(data, shouldShow);
      default:
        console.warn('Unknown notification type:', type);
    }
  }

  handleOrderReceived(order, shouldShow) {
    const title = '📦 New Order Received!';
    const body = `Order #${order.id?.slice(-8)} - ₦${(order.total || 0).toLocaleString()} from ${order.customerName || 'Customer'}`;
    
    if (shouldShow) {
      return this.showNotification(title, {
        body,
        tag: 'order-received',
        icon: '/favicon.ico',
        onClick: () => {
          // Navigate to orders page
          window.location.hash = '#/orders';
        }
      });
    }
  }

  handleOrderStatusUpdated(order, shouldShow) {
    const statusMessages = {
      confirmed: '✅ Order Confirmed',
      preparing: '👨‍⚕️ Order Being Prepared',
      ready: '📋 Order Ready for Pickup',
      completed: '🎉 Order Completed',
      cancelled: '❌ Order Cancelled'
    };

    const title = statusMessages[order.status] || '📦 Order Updated';
    const body = `Order #${order.id?.slice(-8)} - ${order.pharmacyName || 'Pharmacy'}`;
    
    if (shouldShow) {
      return this.showNotification(title, {
        body,
        tag: 'order-status',
        icon: '/favicon.ico',
        onClick: () => {
          window.location.hash = '#/orders';
        }
      });
    }
  }

  handleMessageReceived(message, shouldShow) {
    const title = `💬 ${message.senderName || 'New Message'}`;
    const body = message.text?.slice(0, 100) + (message.text?.length > 100 ? '...' : '') || 'Sent an attachment';
    
    if (shouldShow) {
      return this.showNotification(title, {
        body,
        tag: 'message',
        icon: '/favicon.ico',
        onClick: () => {
          // Navigate to messages
          window.location.hash = '#/messages';
        }
      });
    }
  }

  handlePrescriptionReady(prescription, shouldShow) {
    const title = '💊 Prescription Ready';
    const body = `Your prescription is ready for pickup at ${prescription.pharmacyName}`;
    
    if (shouldShow) {
      return this.showNotification(title, {
        body,
        tag: 'prescription',
        icon: '/favicon.ico',
        requireInteraction: true,
        onClick: () => {
          window.location.hash = '#/orders';
        }
      });
    }
  }

  // Public methods for triggering notifications
  notifyOrderReceived(order) {
    this.queueNotification({
      type: 'order_received',
      data: order
    });
  }

  notifyOrderStatusUpdated(order) {
    this.queueNotification({
      type: 'order_status_updated',
      data: order
    });
  }

  notifyMessageReceived(message) {
    this.queueNotification({
      type: 'message_received',
      data: message
    });
  }

  notifyPrescriptionReady(prescription) {
    this.queueNotification({
      type: 'prescription_ready',
      data: prescription
    });
  }

  // Check if notifications are supported and permitted
  get isSupported() {
    return 'Notification' in window;
  }

  get isPermitted() {
    return this.isSupported && Notification.permission === 'granted';
  }

  get permissionStatus() {
    if (!this.isSupported) return 'not-supported';
    return Notification.permission;
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export service for use in components
export default notificationService;
