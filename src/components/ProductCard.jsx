import { Plus } from 'lucide-react';
import { Card } from './ui/card';

export default function ProductCard({
  product,
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
}) {
  return (
    <Card
      className="p-3 cursor-pointer relative flex flex-col justify-between"
      onClick={onOpen}
      style={{ width: cardWidth, height: cardHeight }}
    >
      <div className="rounded-2xl overflow-hidden flex items-center justify-center bg-white" style={{ height: `calc(${cardHeight} * 0.6)` }}>
        <img src={product.image} alt={product.name} className="object-contain h-full" />
      </div>
      <div
        className="mt-2 font-poppins"
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
        style={{ borderColor: addColor, borderRadius: '5px', background: 'transparent' }}
      >
        <Plus color={addColor} size={18}/>
      </button>
    </Card>
  );
}