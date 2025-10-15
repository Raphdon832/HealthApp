// Fab.jsx
import { createPortal } from 'react-dom';

// PharmAI Icon Component
const PharmAIIcon = ({ className = "w-6 h-6" }) => (
  <img 
    src="/PharmAI.svg" 
    alt="PharmAI" 
    className={className}
  />
);

export default function Fab({ onClick, disabled }) {
  return createPortal(
    <button
      className="fixed bottom-[10rem] right-6 z-[100] bg-sky-500 text-white rounded-full shadow-lg
                 w-12 h-12 flex items-center justify-center disabled:opacity-0 disabled:cursor-not-allowed"
      aria-label="Add Product"
      onClick={onClick}
      disabled={disabled}
    >
      <PharmAIIcon className="w-6 h-6" />
    </button>,
    document.body
  );
}