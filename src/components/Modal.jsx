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

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4 transition-all duration-300 ${
        isVisible ? 'bg-black/30' : 'bg-black/0'
      }`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto border border-[#36A5FF] transition-all duration-300 transform ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
        style={{borderWidth: 1}}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 text-xl font-bold focus:outline-none transition-all duration-200 hover:scale-110 hover:bg-zinc-100 rounded-full w-8 h-8 flex items-center justify-center"
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
