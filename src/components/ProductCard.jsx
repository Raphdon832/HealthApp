import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from './ui/card';

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

  const showImage = product?.image && !imgError;

  return (
    <Card
      className="p-3 cursor-pointer relative flex flex-col justify-between overflow-hidden"
      onClick={onOpen}
      style={{ width: cardWidth, height: cardHeight, borderRadius: borderRadius || '10px' }}
    >
      <div
        className="overflow-hidden flex items-center justify-center bg-white"
        style={{ height: `calc(${cardHeight} * 0.6)`, borderRadius: borderRadius || '3px' }}
      >
        {showImage ? (
          <img
            src={product.image}
            alt={product.name || 'product image'}
            className="object-contain h-full w-full"
            onError={() => setImgError(true)}
            style={{ maxWidth: '100%' }}
          />
        ) : (
          <div
            className="flex items-center justify-center w-full h-full"
            style={{ padding: 8 }}
          >
            {/* Pill-style avatar placeholder using first letter of product name */}
            <div
              role="img"
              aria-label={product.name ? `${product.name} placeholder` : 'product placeholder'}
              className="flex items-center justify-center"
              style={{
                width: 84,
                height: 48
              }}
            >
              <span className="text-[#BDBDBD] font-semibold" style={{ fontSize: 20 }}>
                {(product.name && product.name.charAt(0).toUpperCase()) || '?'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-1 text-xs text-zinc-500 font-poppins font-light truncate flex items-center gap-2" style={{ fontSize: '10px', maxWidth: '100%' }}>
        <span className="truncate">{vendorName}</span>
        {(typeof vendorDistanceKm === 'number' || typeof vendorEtaMins === 'number') && (
          <span className="text-[9px] text-zinc-400 whitespace-nowrap">
            {typeof vendorDistanceKm === 'number' ? `${vendorDistanceKm.toFixed(1)} km` : ''}
            {typeof vendorDistanceKm === 'number' && typeof vendorEtaMins === 'number' ? ' · ' : ''}
            {typeof vendorEtaMins === 'number' ? `${vendorEtaMins} min` : ''}
          </span>
        )}
      </div>

      <div
        className="mt-1 font-poppins"
        style={{ fontSize: nameSize, fontWeight: nameWeight, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={product.name}
      >
        {product.name}
      </div>

      <div
        className="font-poppins"
        style={{ fontSize: priceSize, color: priceColor, fontWeight: priceWeight, overflow: 'hidden' }}
      >
        ₦{Number(product.price).toLocaleString()}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="absolute bottom-3 right-3 h-7 w-7 flex items-center justify-center border border-solid"
        style={{ borderColor: addColor, borderRadius: borderRadius || '3px', background: 'transparent' }}
      >
        <Plus color={addColor} size={18}/>
      </button>
    </Card>
  );
}