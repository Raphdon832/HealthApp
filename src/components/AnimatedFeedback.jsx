import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const colors = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200', 
    text: 'text-red-800',
    icon: 'text-red-600'
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: 'text-yellow-600'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600'
  }
};

export default function AnimatedFeedback({ 
  type = 'info', 
  message, 
  visible = false, 
  onClose,
  autoClose = true,
  duration = 3000,
  className = ''
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const Icon = icons[type];
  const colorScheme = colors[type];

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 10);
      
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [visible, autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShouldRender(false);
      onClose?.();
    }, 300);
  };

  if (!shouldRender) return null;

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
      isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
    } ${className}`}>
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md
        ${colorScheme.bg} ${colorScheme.border}
        animate-fadeInScale
      `}>
        <Icon className={`h-5 w-5 flex-shrink-0 ${colorScheme.icon} ${type === 'success' ? 'animate-bounceIn' : ''}`} />
        <div className={`flex-1 text-sm font-medium ${colorScheme.text}`}>
          {message}
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className={`text-lg font-bold hover:opacity-70 transition-opacity ${colorScheme.text}`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Toast notification hook for easy usage
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message, options = {}) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type,
      message,
      ...options
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, options.duration || 3000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return {
    toasts,
    showToast,
    removeToast,
    success: (message, options) => showToast('success', message, options),
    error: (message, options) => showToast('error', message, options),
    warning: (message, options) => showToast('warning', message, options),
    info: (message, options) => showToast('info', message, options)
  };
}

// Toast container component
export function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast, index) => (
        <AnimatedFeedback
          key={toast.id}
          type={toast.type}
          message={toast.message}
          visible={true}
          onClose={() => onRemove(toast.id)}
          autoClose={toast.autoClose !== false}
          duration={toast.duration || 3000}
          className={`transform translate-x-0 animate-slideInRight`}
          style={{ animationDelay: `${index * 0.1}s` }}
        />
      ))}
    </div>
  );
}
