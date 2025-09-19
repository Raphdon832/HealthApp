import { MapPin, Clock, Phone, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addToCart } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import DirectionsIcon from '@/icons/react/DirectionsIcon';
import ProductAvatar from '@/components/ProductAvatar';

export default function ProductDetail({ product, pharmacy }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  if (!product) return null;

  const price = Number(product.price || 0);
  const [imageError, setImageError] = useState(false);
  const [showCategoryProducts, setShowCategoryProducts] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [loadingCategoryProducts, setLoadingCategoryProducts] = useState(false);

  async function fetchProductsByCategory(cat) {
    if (!cat) return setCategoryProducts([]);
    try {
      setLoadingCategoryProducts(true);
      const q = query(collection(db, 'products'), where('category', '==', cat));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setCategoryProducts(items);
      setShowCategoryProducts(true);
    } catch (err) {
      console.error('Failed to fetch category products', err);
      setCategoryProducts([]);
      setShowCategoryProducts(true);
    } finally {
      setLoadingCategoryProducts(false);
    }
  }

  // Optional: gate by auth, as in your original
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-xl font-poppins font-light mb-6">Please sign in to continue</div>
        <button
          className="rounded-full bg-sky-600 text-white px-6 py-2 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate('/auth/landing')}
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Page container */}
      <div className="w-full max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 md:px-8 lg:px-12 xl:px-0">
        {/* Sticky back button */}
        <div className="pt-6 sticky top-0 z-20 bg-white/80 backdrop-blur-md pb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-[90px] h-[34px] font-poppins font-extralight tracking-tight text-[14px] flex items-center justify-center rounded-full bg-white border border-zinc-300"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
        </div>

        {/* Grey details sheet (border/rounded only on md+; mobile is full-bleed) */}
        <div className="mt-8 md:border md:rounded-t-3xl md:max-w-4xl md:border-zinc-100">
          <div className="w-full max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 md:px-8 lg:px-12 xl:px-0 pt-6 pb-36">

            {/* CENTRAL CONTENT: two-column on desktop, stacked on mobile */}
            <div className="mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* LEFT: Product image (widget-style) */}
                <div className=" rounded-2xl p-4 border flex flex-col items-center justify-center w-full">
                  {/* show image when available and not errored; otherwise show initials avatar */}
                  {product?.image && !imageError ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={() => setImageError(true)}
                      className="max-h-[360px] w-full object-contain"
                    />
                  ) : (
                    <div className="h-[200px] w-full flex items-center justify-center bg-zinc-100 rounded-md text-3xl font-semibold text-zinc-800">
                      <ProductAvatar name={product.name} image={product.image} category={product.category} size={80} roundedClass="rounded-md" />
                    </div>
                  )}

                  {/* CTAs moved here: stacked vertically under the image (desktop only) */}
                  <div className="w-full mt-4 hidden lg:flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        if (!user) return alert('Please sign in');
                        if (!product.id) return alert('Product unavailable. Please try again.');
                        try { await addToCart(user.uid, product.id, 1); } catch { alert('Failed to add to cart.'); }
                      }}
                      className="w-full h-10 rounded-full bg-sky-600 text-white text-[14px] font-poppins font-light shadow-sm"
                      aria-label="Add to cart"
                    >
                      Add to Cart
                    </button>

                    <a
                      href={`tel:${pharmacy?.phone || ''}`}
                      className="w-full h-10 rounded-full border border-zinc-400 text-[14px] font-poppins font-light flex items-center justify-center gap-2 text-zinc-800 bg-white"
                      aria-label="Call to order"
                    >
                      <Phone className="h-4 w-4" /> Call to Order
                    </a>
                  </div>
                </div>

                {/* RIGHT: stacked widgets */}
                <div className="flex flex-col">
                  {/* Name + Price row (mobile): price shown on mobile here and hidden on lg */}
                  <div className="mb-3 flex items-start justify-between">
                    <h1 className="text-[20px] lg:text-[22px] font-poppins font-medium tracking-tight leading-tight min-w-0">
                      {product.name}
                    </h1>
                    <div className="text-[20px] text-sky-600 font-poppins font-semibold lg:hidden">₦{price.toLocaleString()}</div>
                  </div>

                  {/* Price for lg screens (desktop): hidden on mobile */}
                  <div className="mb-4 hidden lg:block">
                    <div className="text-[20px] text-sky-600 font-poppins font-semibold">₦{price.toLocaleString()}</div>
                  </div>

                  {/* Pharmacy name (always under the product name on mobile) */}
                  <div className="mb-2">
                    <button
                      onClick={() => navigate(`/vendor/${pharmacy?.id || product.pharmacyId}`)}
                      className="text-sky-600 underline font-poppins text-[15px] font-light"
                    >
                      {pharmacy?.name}
                    </button>
                  </div>

                  {/* Address row: address on left, Get Directions on right (mobile). On lg the Get Directions is the separate block below. */}
                  <div className="mb-1 flex items-center justify-between gap-2 text-zinc-600 text-[13px] font-poppins font-light">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{pharmacy?.address}</span>
                    </div>

                    {pharmacy?.address && (
                      <button
                        onClick={() => {
                          const query = encodeURIComponent(pharmacy.address);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                        }}
                        className="text-sky-600 text-[13px] font-poppins font-light px-2 py-1 rounded-full hover:bg-sky-50 transition lg:hidden"
                        aria-label="Get directions"
                      >
                        <DirectionsIcon className="h-4 w-4 inline-block mr-1" /> Get Directions
                      </button>
                    )}
                  </div>

                  {/* ETA below the address (mobile and desktop) */}
                  <div className="mb-3 flex items-center gap-2 text-zinc-600 text-[13px] font-poppins font-light">
                    <Clock className="h-4 w-4" /> {pharmacy?.etaMins || 25} mins to {pharmacy?.name}
                  </div>

                  {/* Get Directions for lg (desktop) - keep original placement on larger screens */}
                  {pharmacy?.address && (
                    <div className="mb-4 hidden lg:block">
                      <button
                        className="flex items-center gap-2 text-sky-600 text-[13px] font-poppins font-light px-3 py-2 rounded-full hover:bg-sky-50 transition"
                        onClick={() => {
                          const query = encodeURIComponent(pharmacy.address);
                          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
                        }}
                      >
                        <DirectionsIcon className="h-4 w-4 text-sky-600" /> Get Directions
                      </button>
                    </div>
                  )}

                  {/* Category (responsive): stacked on lg, inline on smaller screens */}
                  <div className="mt-2">
                    {/* Desktop: show label then value underneath */}
                    <div className="hidden lg:block">
                      <div className="text-[15px] tracking-tight text-black font-poppins font-medium">Category</div>
                      <div className="mt-0.5 mb-5">
                        <button
                          type="button"
                          onClick={async (e) => { e.stopPropagation(); await fetchProductsByCategory(product.category || 'General'); }}
                          className="text-[13px] text-[#fc7f26] font-poppins font-normal underline hover:text-amber-500"
                        >
                          {product.category || 'General'}
                        </button>
                      </div>
                    </div>

                    {/* Mobile/tablet: label left, value right on same line */}
                    <div className="block lg:hidden">
                      <div className="flex items-center justify-between">
                        <div className="text-[15px] text-black font-poppins font-medium mb-2">Category</div>
                        <div>
                          <button
                            type="button"
                            onClick={async (e) => { e.stopPropagation(); await fetchProductsByCategory(product.category || 'General'); }}
                            className="text-[13px] text-[#fc7f26] font-poppins font-normal underline hover:text-amber-500"
                          >
                            {product.category || 'General'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product description */}
                  <div className="mt-2">
                    <div className="text-[15px] font-poppins font-medium tracking-tighter text-zinc-800">Product Description</div>
                    <p className="mt-2 text-zinc-600 leading-6 font-poppins text-[14px] font-light">{product.description}</p>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile fixed bottom CTA: visible on small screens, hidden on lg+ */}
        <div className="fixed left-0 right-0 bottom-28 z-30 lg:hidden">
          <div className="w-full max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 md:px-8 lg:px-12 xl:px-0">
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  if (!user) return alert('Please sign in');
                  if (!product.id) return alert('Product unavailable. Please try again.');
                  try { await addToCart(user.uid, product.id, 1); } catch { alert('Failed to add to cart.'); }
                }}
                className="w-full h-11 rounded-full bg-sky-600 text-white text-[14px] font-poppins font-light shadow-sm"
              >
                Add to Cart
              </button>
              <a
                href={`tel:${pharmacy?.phone || ''}`}
                className="w-full h-11 rounded-full border border-zinc-400 text-[14px] font-poppins font-light flex items-center justify-center gap-2 text-zinc-800 bg-white"
              >
                <Phone className="h-4 w-4" /> Call to Order
              </a>
            </div>
          </div>
        </div>

        {/* Category products modal */}
        {showCategoryProducts && (
          <div onClick={() => setShowCategoryProducts(false)} className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black bg-opacity-30" role="dialog" aria-modal="true">
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-4 w-[90vw] max-w-md max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-medium">Products in "{product.category || 'General'}"</div>
                <button onClick={() => setShowCategoryProducts(false)} className="text-zinc-500">Close</button>
              </div>

              {loadingCategoryProducts ? (
                <div className="p-4 text-center text-zinc-500">Loading…</div>
              ) : categoryProducts.length === 0 ? (
                <div className="p-4 text-zinc-500">No products found.</div>
              ) : (
                <div className="space-y-2">
                  {categoryProducts.map(p => (
                    <button key={p.id} onClick={() => { setShowCategoryProducts(false); navigate(`/product/${p.id}`); }} className="w-full text-left rounded-lg p-2 flex items-center gap-3 hover:bg-sky-50">
                      <ProductAvatar name={p.name} image={p.image} category={p.category} size={48} className="flex-shrink-0" roundedClass="rounded-md" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{p.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{p.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
