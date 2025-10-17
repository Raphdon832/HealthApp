import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Card } from './ui/card';
import ProductAvatar from './ProductAvatar';

export default function ProductCard({
  product,
  vendorName,
  vendorDistanceKm,
  vendorEtaMins,
  onOpen,
  onAdd,
  cardWidth = '172px',
  cardHeight = '199px',
  nameSize = '15.54px',
  nameWeight = 'medium',
  priceSize = '14.43px',
  priceColor = '#BDBDBD',
  priceWeight = 'medium',
  addColor = '#36A5FF',
  borderRadius,
}) {
  const [imgError, setImgError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [cartPressed, setCartPressed] = useState(false);

  const showImage = product?.image && !imgError;

  return (
    <Card
      className={`p-3 cursor-pointer relative flex flex-col justify-between overflow-hidden card-interactive group transition-all duration-200 ${
        isPressed ? 'scale-95' : 'hover:scale-105'
      }`}
      onClick={onOpen}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{ width: cardWidth, height: cardHeight, borderRadius: borderRadius || '10px' }}
    >
      <div
        className="overflow-hidden flex items-center justify-center bg-white dark:bg-gray-800 transition-all duration-200 group-hover:bg-gradient-to-br group-hover:from-blue-50 group-hover:to-sky-50 dark:group-hover:from-blue-900/20 dark:group-hover:to-sky-900/20"
        style={{ height: `calc(${cardHeight} * 0.6)`, borderRadius: borderRadius || '3px' }}
      >
        {showImage ? (
          <img
            src={product.image}
            alt={product.name || 'product image'}
            className="object-contain h-full w-full transition-transform duration-200 group-hover:scale-110"
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%' }}
          />
        ) : (
          <div
            className="flex items-center justify-center w-full h-full transition-transform duration-200 group-hover:scale-110"
            style={{ padding: 8 }}
          >
            <ProductAvatar name={product.name} image={product.image} category={product.category} size={Math.min(30, Math.max(48, parseInt(cardHeight, 10) / 2))} />
          </div>
        )}
      </div>

      <div className="mt-1 text-xs text-zinc-500 font-poppins font-light truncate flex items-center gap-2 transition-colors duration-200 group-hover:text-zinc-600" style={{ fontSize: '10px', maxWidth: '100%' }}>
        <span className="truncate">{vendorName}</span>
        {(typeof vendorDistanceKm === 'number' || typeof vendorEtaMins === 'number') && (
          <span className="text-[9px] text-zinc-400 whitespace-nowrap transition-colors duration-200 group-hover:text-sky-500">
            {typeof vendorDistanceKm === 'number' ? `${vendorDistanceKm.toFixed(1)} km` : ''}
            {typeof vendorDistanceKm === 'number' && typeof vendorEtaMins === 'number' ? ' · ' : ''}
            {typeof vendorEtaMins === 'number' ? `${vendorEtaMins} min` : ''}
          </span>
        )}
      </div>

      <div
        className="mt-1 font-poppins transition-colors duration-200 group-hover:text-zinc-800 dark:group-hover:text-white"
        style={{ fontSize: nameSize, fontWeight: nameWeight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={product.name}
      >
        {product.name}
      </div>

      <div
        className="font-poppins transition-colors duration-200 group-hover:text-sky-600"
        style={{ fontSize: priceSize, color: priceColor, fontWeight: priceWeight, overflow: 'hidden' }}
      >
        ₦{Number(product.price).toLocaleString()}
      </div>

      <button
        onClick={(e) => { 
          e.stopPropagation(); 
          setCartPressed(true);
          setTimeout(() => setCartPressed(false), 150);
          onAdd(); 
        }}
        className={`absolute bottom-3 right-3 h-8 w-8 flex items-center justify-center border border-solid btn-interactive transition-all duration-200 hover:scale-110 hover:shadow-lg ${
          cartPressed ? 'scale-90 shadow-inner' : 'active:scale-95'
        }`}
        style={{ 
          borderColor: addColor, 
          borderRadius: borderRadius || '6px', 
          background: cartPressed ? addColor : 'transparent',
          boxShadow: cartPressed ? `inset 0 2px 4px rgba(0,0,0,0.2), 0 0 0 2px ${addColor}40` : undefined
        }}
        onMouseEnter={(e) => {
          if (!cartPressed) {
            e.target.style.backgroundColor = addColor;
            const svg = e.target.querySelector('svg');
            if (svg) svg.style.color = 'white';
          }
        }}
        onMouseLeave={(e) => {
          if (!cartPressed) {
            e.target.style.backgroundColor = 'transparent';
            const svg = e.target.querySelector('svg');
            if (svg) svg.style.color = addColor;
          }
        }}
      >
        <ShoppingCart 
          color={cartPressed ? 'white' : addColor} 
          size={16} 
          className={`transition-all duration-200 ${cartPressed ? 'animate-pulse' : ''}`}
        />
      </button>

      {/* Subtle shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" 
           style={{ borderRadius: borderRadius || '10px' }} />
    </Card>
  );
}