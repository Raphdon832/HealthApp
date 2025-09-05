import { useEffect, useMemo, useState } from 'react';
import ClockIcon from '@/icons/react/ClockIcon';
import SearchIcon from '@/icons/react/SearchIcon';
import { listenProducts, addToCart } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import ProductCard from '@/components/ProductCard';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => listenProducts(setProducts), []);

  const filtered = useMemo(() => products.filter(p => (p.name + p.category).toLowerCase().includes(q.toLowerCase())), [products, q]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-white px-2 md:px-8 lg:px-16 xl:px-32">
      {/* Header */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto pt-8 pb-4">
        <div className="sticky top-0 z-10 bg-white pt-4 pb-2 w-full">
          <div className="max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 lg:px-12 xl:px-0">
            <div className="flex justify-between items-center w-full h-[54px] md:h-[64px] lg:h-[72px]">
              <div className="flex flex-col justify-center">
                <div className="text-[20px] md:text-[26px] lg:text-[32px] font-thin font-poppins">Hello{user?`, ${user.displayName?.split(' ')[0]||'Friend'}`:''}</div>
                <span className="text-zinc-500 text-[12px] md:text-[14px] lg:text-[16px] font-thin font-poppins">Kuje, FCT, Abuja</span>
              </div>
              <div className="flex flex-col justify-center items-end">
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6"/>
                  <span className="text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-thin text-right leading-tight">35 Mins to Hmedix Pharmacy</span>
                </div>
              </div>
            </div>
            <div className="w-full" style={{borderBottom: '1px solid #EFEFEF'}}></div>
          </div>
        </div>
      </div>

      {/* Home content */}
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex-1 flex flex-col pt-1 pb-28 px-5 md:px-8 lg:px-12 xl:px-0">
        <div className="mt-6 flex items-center gap-3 border-b border-zinc-300 pb-2">
          <SearchIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-zinc-400"/>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search drugs, pharmacies" className="w-full outline-none placeholder:text-[12px] md:placeholder:text-[14px] lg:placeholder:text-[16px] placeholder:text-[#888888] placeholder:font-light"/>
          <div className="flex gap-1 text-zinc-400"><div className="h-1 w-1 bg-current rounded-full"/><div className="h-1 w-1 bg-current rounded-full"/><div className="h-1 w-1 bg-current rounded-full"/></div>
        </div>

        {/* Category horizontal scroll section */}
        <div className="mt-3 mb-2 w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {['All', 'Prescription', 'Over-the-counter', 'Syrup', 'Therapeutic', 'Controlled', 'Target System'].map(cat => (
              <button
                key={cat}
                className="px-4 py-2 md:px-6 md:py-2.5 lg:px-8 lg:py-3 rounded-full bg-zinc-100 text-zinc-700 text-[9px] md:text-[12px] lg:text-[14px] font-poppins font-light whitespace-nowrap border border-zinc-200 hover:bg-sky-50 transition"
                // onClick handler can be added to filter by category
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] md:text-[18px] lg:text-[22px] font-medium font-poppins">New Arrivals</div>
            <button className="text-[13px] md:text-[15px] lg:text-[17px] font-normal font-poppins text-sky-600">view all</button>
          </div>
          <div className="w-full overflow-x-auto scrollbar-hide" style={{overflowX: 'auto'}}>
            <div className="flex gap-4 md:gap-6 lg:gap-8 min-w-max pb-2">
              {filtered.map((p) => (
                <ProductCard
                  key={p.id || p.sku}
                  product={p}
                  onOpen={()=>navigate(`/product/${p.id}`)}
                  onAdd={()=> user ? addToCart(user.uid, p.id, 1) : alert('Please sign in')}
                  cardWidth="132px"
                  cardHeight="154px"
                  nameSize="13px"
                  nameWeight="medium"
                  nameTracking="-0.5px"
                  priceSize="11px"
                  priceColor="#BDBDBD"
                  priceWeight="medium"
                  addColor="#36A5FF"
                  addSize="11px"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10">
          <div className="text-[15px] md:text-[18px] lg:text-[22px] font-medium font-poppins mb-3">Popular Products</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
            {filtered.map((p) => (
              <div className="flex justify-center" key={p.id || p.sku + '-wrapper'}>
                <ProductCard
                  key={p.id || p.sku}
                  product={p}
                  onOpen={()=>navigate(`/product/${p.id}`)}
                  onAdd={()=> user ? addToCart(user.uid, p.id, 1) : alert('Please sign in')}
                  cardWidth="136px"
                  cardHeight="156px"
                  nameSize="13px"
                  nameWeight="medium"
                  nameTracking="-0.5px"
                  nameLineHeight="1.1"
                  priceSize="12px"
                  priceColor="#BDBDBD"
                  priceWeight="medium"
                  priceLineHeight="1.1"
                  addColor="#36A5FF"
                  addSize="11px"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}