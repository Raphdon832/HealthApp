import { Plus } from 'lucide-react';
import { Card } from './ui/card';

export default function ProductCard({
  product,
  vendorName,
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
  return (
    <Card
      className="p-3 cursor-pointer relative flex flex-col justify-between"
      onClick={onOpen}
      style={{ width: cardWidth, height: cardHeight, borderRadius: borderRadius || '10px' }}
    >
      <div className="overflow-hidden flex items-center justify-center bg-white" style={{ height: `calc(${cardHeight} * 0.6)`, borderRadius: borderRadius || '3px' }}>
        <img src={product.image} alt={product.name} className="object-contain h-full" />
      </div>
      <div className="mt-1 text-xs text-zinc-500 font-poppins font-light" style={{ fontSize: '10px' }}>
        {vendorName}
      </div>
      <div
        className="mt-1 font-poppins"
        style={{ fontSize: nameSize, fontWeight: nameWeight }}
      >
        {product.name}
      </div>
      <div
        className="font-poppins"
        style={{ fontSize: priceSize, color: priceColor, fontWeight: priceWeight }}
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