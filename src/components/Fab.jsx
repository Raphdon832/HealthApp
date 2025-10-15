// Fab.jsx
import { createPortal } from 'react-dom';

// Add Icon Component
const AddIcon = ({ className = "w-6 h-6" }) => (
  <img 
    src="/Add.svg" 
    alt="Add" 
    className={className}
  />
);

export default function Fab({ onClick, disabled }) {
  return createPortal(
    <button
      className="fixed bottom-[17rem] right-6 z-[100] text-white rounded-full shadow-lg
                 w-12 h-12 flex items-center justify-center disabled:opacity-0 disabled:cursor-not-allowed"
      aria-label="Add Product"
      onClick={onClick}
      disabled={disabled}
    >
      <AddIcon className="w-6 h-6" />
    </button>,
    document.body
  );
}