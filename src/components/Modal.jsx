import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-2 sm:px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-fadeInUp max-h-[90vh] overflow-y-auto border border-[#36A5FF]" style={{borderWidth: 1}}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700 text-xl font-bold focus:outline-none"
          aria-label="Close"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
