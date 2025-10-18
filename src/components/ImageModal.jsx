import React from 'react';
import { X } from 'lucide-react';

const ImageModal = ({ imageUrl, isOpen, onClose }) => {
  if (!isOpen || !imageUrl) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative max-w-4xl max-h-screen p-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close image"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Image container */}
        <div className="relative">
          <img
            src={imageUrl}
            alt="Full size"
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageModal;