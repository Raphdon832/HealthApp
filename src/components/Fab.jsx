// Fab.jsx
import { createPortal } from 'react-dom';
import { Plus } from 'lucide-react';

export default function Fab({ onClick, disabled }) {
  return createPortal(
    <button
      className="fixed bottom-[17rem] right-6 z-[100] text-white rounded-full shadow-lg
                 w-12 h-12 flex items-center justify-center bg-blue-500 disabled:opacity-0 disabled:cursor-not-allowed"
      aria-label="Add Product"
      onClick={onClick}
      disabled={disabled}
    >
      <Plus className="w-6 h-6" />
    </button>,
    document.body
  );
}
