import React, { useEffect, useState } from 'react';

export default function Modal({ open, onClose, children }) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Small delay to allow the modal to render before animating in
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Wait for animation to complete before removing from DOM
      setTimeout(() => setShouldRender(false), 300);
    }
  }, [open]);

  // Close on Escape key if onClose is provided
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (typeof onClose === 'function') onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 transition-all duration-300 ${
        isVisible ? 'bg-black/30 dark:bg-white/10' : 'bg-black/0'
      }`}
      onClick={() => { if (typeof onClose === 'function') onClose(); }}
    >
      <div 
        className={`bg-white dark:bg-gray-800 text-black dark:text-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto border transition-all duration-300 transform ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        style={{borderWidth: 1, borderColor: '#36A5FF'}}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => { if (typeof onClose === 'function') onClose(); }}
          className="absolute top-3 right-3 text-zinc-400 dark:text-white hover:text-zinc-700 dark:hover:text-white text-xl font-bold focus:outline-none transition-all duration-200 hover:scale-110 hover:bg-zinc-100 dark:hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center"
          aria-label="Close"
        >
          ×
        </button>
        <div className="animate-fadeInUp">
          {children}
        </div>
      </div>
    </div>
  );
}
