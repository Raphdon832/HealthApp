import { useEffect, useMemo, useState, useRef } from 'react';
import ClockIcon from '@/icons/react/ClockIcon';
import SearchIcon from '@/icons/react/SearchIcon';
import { listenProducts, addToCart, getAllPharmacies } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import ProductCard from '@/components/ProductCard';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [location, setLocation] = useState('Fetching location...');
  const [userCoords, setUserCoords] = useState(null);
  const [closestPharmacy, setClosestPharmacy] = useState(null);
  const [eta, setEta] = useState(null);
  const newArrivalsRef = useRef(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [showNewArrivalsModal, setShowNewArrivalsModal] = useState(false);

  const filtered = useMemo(() => products.filter(p => (p.name + p.category).toLowerCase().includes(q.toLowerCase())), [products, q]);

  useEffect(() => listenProducts(setProducts), []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation('Location not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      setUserCoords({ latitude, longitude });
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await res.json();
        setLocation(data.display_name || 'Location unavailable');
      } catch {
        setLocation('Unable to fetch address');
      }
    }, () => setLocation('Location permission denied'));
  }, []);

  useEffect(() => {
    async function fetchAndCalcETA() {
      if (!userCoords) return;
      const pharmacies = await getAllPharmacies();
      if (!pharmacies || pharmacies.length === 0) return;
      function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      }
      let minDist = Infinity, minPharm = null;
      pharmacies.forEach(pharm => {
        if (pharm.coordinates) {
          const dist = getDistance(userCoords.latitude, userCoords.longitude, pharm.coordinates.latitude, pharm.coordinates.longitude);
          if (dist < minDist) {
            minDist = dist;
            minPharm = pharm;
          }
        }
      });
      setClosestPharmacy(minPharm);
      const etaMins = minDist ? Math.round((minDist / 25) * 60) : null;
      setEta(etaMins);
    }
    fetchAndCalcETA();
  }, [userCoords]);

  useEffect(() => {
    if (!newArrivalsRef.current) return;
    let interval;
    let userScrollTimeout;
    const handleUserScroll = () => {
      setIsUserScrolling(true);
      clearTimeout(userScrollTimeout);
      userScrollTimeout = setTimeout(() => setIsUserScrolling(false), 2000);
    };
    const el = newArrivalsRef.current;
    el.addEventListener('scroll', handleUserScroll);
    interval = setInterval(() => {
      if (!isUserScrolling && el) {
        el.scrollBy({ left: 120, behavior: 'smooth' });
        if (el.scrollLeft + el.offsetWidth >= el.scrollWidth - 5) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        }
      }
    }, 2500);
    return () => {
      clearInterval(interval);
      el.removeEventListener('scroll', handleUserScroll);
      if (userScrollTimeout) clearTimeout(userScrollTimeout);
    };
  }, [isUserScrolling, filtered.length]);

  const popularProducts = useMemo(() => {
    return [...filtered].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
  }, [filtered]);

  const newArrivals = useMemo(() => {
    return [...products]
      .filter(p => p.createdAt)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 12);
  }, [products]);
  const allNewArrivals = useMemo(() => {
    return [...products]
      .filter(p => p.createdAt)
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [products]);

  const handleProductOpen = async (productId) => {
    navigate(`/product/${productId}`);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, viewCount: (p.viewCount || 0) + 1 } : p));
    try {
      const { doc, updateDoc, increment } = await import('firebase/firestore');
      await updateDoc(doc(db, 'products', productId), { viewCount: increment(1) });
    } catch (e) {
    }
  };

  return (
    <div className="min-h-screen w-full px-0 pb-28">
      <div className="sticky top-0 z-30 w-full bg-white border-b flex-shrink-0 px-2">
        <div className="w-full mx-auto pt-8 pb-4">
          <div className="pt-4 pb-2 w-full">
            <div className="w-full mx-auto px-0">
              <div className="flex justify-between items-center w-full h-[14px] md:h-[14px] lg:h-[20px]">
                <div className="flex flex-col justify-center">
                  <div className="text-[17px] md:text-[26px] lg:text-[20px] font-regular font-poppins">Hello{user?`, ${user.displayName?.split(' ')[0]||'Friend'}`:''}</div>
                  <span className="text-zinc-500 text-[12px] md:text-[14px] lg:text-[16px] font-thin font-poppins truncate max-w-xs md:max-w-md lg:max-w-lg" title={location}>{location}</span>
                </div>
                <div className="flex flex-col justify-center items-end">
                  <ClockIcon className="h-3 w-3 md:h-5 md:w-5 lg:h-6 lg:w-6 mb-0.5"/>
                  <span className="text-[12px] md:text-[14px] lg:text-[16px] font-poppins font-thin text-right leading-tight mt-0.5">
                    {eta && closestPharmacy ? `${eta} min${eta !== 1 ? 's' : ''} to ${closestPharmacy.name}` : 'Finding closest pharmacy...'}
                  </span>
                </div>
              </div>
              <div className="w-full" style={{}}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto w-full mx-auto flex flex-col pt-1 pb-28 px-0">
        <div className="mt-6 flex items-center gap-3 border-b border-zinc-300 pb-2">
          <SearchIcon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-zinc-400"/>
          <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Search drugs, pharmacies" className="w-full outline-none placeholder:text-[12px] md:placeholder:text-[14px] lg:placeholder:text-[16px] placeholder:text-[#888888] placeholder:font-light"/>
          <div className="flex gap-1 text-zinc-400"><div className="h-1 w-1 bg-current rounded-full"/><div className="h-1 w-1 bg-current rounded-full"/><div className="h-1 w-1 bg-current rounded-full"/></div>
        </div>

        <div className="mt-3 mb-2 w-full overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 min-w-max">
            {['All', 'Prescription', 'Over-the-counter', 'Syrup', 'Therapeutic', 'Controlled', 'Target System'].map(cat => (
              <button
                key={cat}
                className="px-4 py-2 md:px-6 md:py-2.5 lg:px-8 lg:py-3 rounded-full bg-zinc-100 text-zinc-700 text-[9px] md:text-[12px] lg:text-[14px] font-poppins font-light whitespace-nowrap border border-zinc-200 hover:bg-sky-50 transition"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] md:text-[18px] lg:text-[22px] font-medium font-poppins">New Arrivals</div>
            <button
              className="text-[13px] md:text-[15px] lg:text-[17px] font-normal font-poppins text-sky-600"
              onClick={() => setShowNewArrivalsModal(true)}
            >view all</button>
          </div>
          <div ref={newArrivalsRef} className="w-full overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing" style={{overflowX: 'auto'}} onMouseDown={e => {
            const el = newArrivalsRef.current;
            if (!el) return;
            let startX = e.pageX - el.offsetLeft;
            let scrollLeft = el.scrollLeft;
            function onMove(ev) {
              el.scrollLeft = scrollLeft - (ev.pageX - el.offsetLeft - startX);
            }
            function onUp() {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            }
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}>
            <div className="flex gap-3 md:gap-4 lg:gap-6 min-w-max pb-2">
              {newArrivals.map((p) => (
                <div className="relative" key={p.id || p.sku}>
                  <ProductCard
                    product={p}
                    onOpen={()=>handleProductOpen(p.id)}
                    onAdd={()=> user ? addToCart(user.uid, p.id, 1) : alert('Please sign in')}
                    cardWidth="110px"
                    cardHeight="128px"
                    nameSize="11px"
                    nameWeight="medium"
                    nameTracking="-0.5px"
                    priceSize="9px"
                    priceColor="#BDBDBD"
                    priceWeight="medium"
                    addColor="#36A5FF"
                    addSize="9px"
                  />
                  <span className="absolute top-1 left-1 bg-sky-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm select-none pointer-events-none">New</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {showNewArrivalsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-[20px] shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-800 text-xl font-bold"
                onClick={() => setShowNewArrivalsModal(false)}
                aria-label="Close"
              >&times;</button>
              <div className="text-[20px] md:text-[26px] font-light mb-4 font-poppins text-left">All New Products</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 justify-items-center">
                {allNewArrivals.map((p) => (
                  <div className="relative flex flex-col items-center" key={p.id || p.sku}>
                    <ProductCard
                      product={p}
                      onOpen={()=>handleProductOpen(p.id)}
                      onAdd={()=> user ? addToCart(user.uid, p.id, 1) : alert('Please sign in')}
                      cardWidth="110px"
                      cardHeight="128px"
                      nameSize="11px"
                      nameWeight="medium"
                      nameTracking="-0.5px"
                      priceSize="9px"
                      priceColor="#BDBDBD"
                      priceWeight="medium"
                      addColor="#36A5FF"
                      addSize="9px"
                    />
                    <span className="absolute top-1 left-1 bg-sky-500 text-white text-[9px] font-semibold px-2 py-0.5 rounded-full shadow-sm select-none pointer-events-none">New</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="mt-10">
          <div className="text-[15px] md:text-[18px] lg:text-[22px] font-medium font-poppins mb-3">Popular Products</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
            {popularProducts.map((p) => (
              <div className="flex justify-center" key={p.id || p.sku + '-wrapper'}>
                <ProductCard
                  key={p.id || p.sku}
                  product={p}
                  onOpen={()=>handleProductOpen(p.id)}
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