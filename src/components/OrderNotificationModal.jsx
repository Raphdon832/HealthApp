import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/auth';

export default function OrderNotificationModal({ order, isOpen, onClose, onViewOrder }) {
  const [isVisible, setIsVisible] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Auto-close after 10 seconds if not manually closed
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300); // Wait for animation to complete
  };

  const handleViewOrder = () => {
    onViewOrder(order);
    handleClose();
  };

  if (!isOpen || !order) return null;

  return (
    <>
      {/* Modal */}
      <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      }`}>
        <div className="bg-white rounded-2xl shadow-2xl border border-blue-200 dark:border-gray-600 mx-4 overflow-hidden card-interactive hover:shadow-3xl transition-all duration-300" style={{ width: '393px' }}>
          {/* Header with animation */}
          <div className="bg-gradient-to-r from-sky-300 to-sky-600 px-6 py-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
            <div className="relative z-10 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-white text-lg">📦</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg animate-text-reveal">New Order Received!</h3>
                <p className="text-green-100 text-sm animate-fade-in" style={{ animationDelay: '0.1s' }}>You have a new customer order</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-3 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                  <p className="text-gray-600 text-xs">Order ID</p>
                  <p className="font-medium text-gray-900 text-sm truncate">#{order.id?.slice(-8) || 'N/A'}</p>
                </div>
                <div className="flex-1 min-w-0 animate-slide-up" style={{ animationDelay: '0.4s' }}>
                  <p className="text-gray-600 text-xs">Customer</p>
                  <p className="font-medium text-gray-900 text-sm truncate">{order.customerName || 'Unknown Customer'}</p>
                </div>
                <div className="text-right flex-shrink-0 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                  <p className="text-gray-600 text-xs">Total</p>
                  <p className="font-bold text-green-600 text-sm animate-pulse-slow">₦{(order.total || 0).toLocaleString()}</p>
                </div>
              </div>

              {/* Items section - handle multiple possible data structures */}
              {((order.items && order.items.length > 0) || (order.orderItems && order.orderItems.length > 0) || (order.products && order.products.length > 0)) ? (
                <div className="border-t pt-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <p className="text-gray-600 text-xs mb-2">
                    Items ({order.items?.length || order.orderItems?.length || order.products?.length || 0})
                  </p>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {(order.items || order.orderItems || order.products || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs gap-2 py-0.5 animate-fadeInUp" style={{ animationDelay: `${0.7 + (idx * 0.1)}s` }}>
                        <span className="text-gray-700 flex-1 leading-tight font-medium truncate">
                          {item.name || item.productName || item.title || item.itemName || `Item ${idx + 1}`}
                        </span>
                        <span className="text-gray-600 text-right whitespace-nowrap font-semibold bg-gray-100 px-1.5 py-0.5 rounded text-xs flex-shrink-0 hover:bg-gray-200 transition-colors duration-200">
                          x{item.quantity || item.qty || item.amount || 1}
                        </span>
                      </div>
                    ))}
                    {(order.items?.length || order.orderItems?.length || order.products?.length || 0) > 3 && (
                      <p className="text-xs text-gray-500 italic mt-1 text-center bg-gray-50 py-0.5 rounded animate-fade-in">
                        +{(order.items?.length || order.orderItems?.length || order.products?.length || 0) - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border-t pt-3 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                  <p className="text-gray-600 text-xs mb-2">Items</p>
                  <p className="text-gray-500 text-xs italic">No items found</p>
                </div>
              )}

              <div className="border-t pt-2 flex justify-between items-center animate-fade-in" style={{ animationDelay: '0.8s' }}>
                <div>
                  <p className="text-gray-600 text-xs">Status</p>
                  <span className="inline-block px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium mt-0.5 animate-bounce-gentle">
                    {order.status || 'Pending'}
                  </span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4 pt-3 border-t animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
              <button
                onClick={handleViewOrder}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium text-xs transition-all duration-200 shadow-lg hover:shadow-xl btn-interactive hover:scale-105 active:scale-95"
              >
                View Details
              </button>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-xs transition-all duration-200 btn-interactive hover:scale-105 active:scale-95"
              >
                Dismiss
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-110 active:scale-95"
          >
            <span className="text-lg">×</span>
          </button>

          {/* Progress bar for auto-close */}
          <div className="absolute bottom-0 left-0 h-1 bg-gray-200 w-full">
            <div 
              className="h-full bg-green-500 transition-all duration-[10000ms] ease-linear animate-progress-bar"
              style={{ width: isVisible ? '0%' : '100%' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
