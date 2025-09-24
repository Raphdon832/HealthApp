import { MapPin, Clock, Phone, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addToCart } from '@/lib/db';
import { useAuth } from '@/lib/auth';
import { useNavigate } from 'react-router-dom';
import DirectionsIcon from '@/icons/react/DirectionsIcon';
import ProductAvatar from '@/components/ProductAvatar';
import { useUserLocation } from '@/hooks/useUserLocation';
import { calculatePharmacyETA } from '@/lib/eta';

export default function ProductDetail({ product, pharmacy }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userCoords } = useUserLocation();
  
  if (!product) return null;

  const price = Number(product.price || 0);
  const [imageError, setImageError] = useState(false);
  const [showCategoryProducts, setShowCategoryProducts] = useState(false);
  const [etaInfo, setEtaInfo] = useState(null);

  // Calculate ETA when user location or pharmacy changes
  useEffect(() => {
    if (pharmacy && userCoords) {
      const eta = calculatePharmacyETA(pharmacy, userCoords, 'driving');
      setEtaInfo(eta);
    } else {
      setEtaInfo(null);
    }
  }, [pharmacy, userCoords]);
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

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewForm, setReviewForm] = useState({ name: user?.displayName || '', rating: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch reviews from Firestore
  useEffect(() => {
    async function fetchReviews() {
      if (!product?.id) return setReviews([]);
      setLoadingReviews(true);
      try {
        const reviewsRef = collection(db, 'products', product.id, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        setReviews([]);
      } finally {
        setLoadingReviews(false);
      }
    }
    fetchReviews();
  }, [product?.id]);

  // Handle review form input
  function handleReviewChange(e) {
    const { name, value } = e.target;
    setReviewForm(f => ({ ...f, [name]: value }));
  }

  // Submit review to Firestore
  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.rating || !reviewForm.comment) return;
    setSubmitting(true);
    try {
      const reviewsRef = collection(db, 'products', product.id, 'reviews');
      await addDoc(reviewsRef, {
        name: reviewForm.name,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment,
        createdAt: serverTimestamp(),
        userId: user?.uid || null,
      });
      setReviewForm({ name: user?.displayName || '', rating: '', comment: '' });
      // Refresh reviews
      const q = query(reviewsRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      // Optionally show error
    } finally {
      setSubmitting(false);
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
        <div className="pt-6 sticky top-0 z-20 bg-white/80 backdrop-blur-md pb-2 animate-slide-down-fade">
          <button
            onClick={() => navigate(-1)}
            className="w-[90px] h-[34px] font-poppins font-extralight tracking-tight text-[14px] flex items-center justify-center rounded-full bg-white border border-zinc-300 hover:scale-105 hover:shadow-md transition-all duration-200 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </button>
        </div>

        {/* Grey details sheet (border/rounded only on md+; mobile is full-bleed) */}
        <div className="mt-8 md:border md:rounded-t-3xl md:max-w-4xl md:border-zinc-100 animate-fade-in-up">
          <div className="w-full max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 md:px-8 lg:px-12 xl:px-0 pt-6 pb-36">

            {/* CENTRAL CONTENT: two-column on desktop, stacked on mobile */}
            <div className="mx-auto w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

                {/* LEFT: Product image (widget-style) */}
                <div className="rounded-2xl p-4 border flex flex-col items-center justify-center w-full card-interactive hover:shadow-lg transition-all duration-300 animate-fade-in-left">
                  {/* show image when available and not errored; otherwise show initials avatar */}
                  {product?.image && !imageError ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={() => setImageError(true)}
                      className="max-h-[360px] w-full object-contain hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="h-[200px] w-full flex items-center justify-center bg-zinc-100 rounded-md text-3xl font-semibold text-zinc-800 animate-bounce-gentle">
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
                      className="w-full h-10 rounded-full bg-sky-600 text-white text-[14px] font-poppins font-light shadow-sm btn-interactive hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all duration-200"
                      aria-label="Add to cart"
                    >
                      Add to Cart
                    </button>

                    <a
                      href={`tel:${pharmacy?.phone || ''}`}
                      className="w-full h-10 rounded-full border border-zinc-400 text-[14px] font-poppins font-light flex items-center justify-center gap-2 text-zinc-800 bg-white btn-interactive hover:border-zinc-500 hover:scale-105 active:scale-95 transition-all duration-200"
                      aria-label="Call to order"
                    >
                      <Phone className="h-4 w-4" /> Call to Order
                    </a>
                  </div>
                </div>

                {/* RIGHT: stacked widgets */}
                <div className="flex flex-col animate-fade-in-right">
                  {/* Name + Price row (mobile): price shown on mobile here and hidden on lg */}
                  <div className="mb-3 flex items-start justify-between animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <h1 className="text-[20px] lg:text-[22px] font-poppins font-medium tracking-tight leading-tight min-w-0 animate-text-reveal">
                      {product.name}
                    </h1>
                    <div className="text-[20px] text-sky-600 font-poppins font-semibold lg:hidden animate-pulse-slow">₦{price.toLocaleString()}</div>
                  </div>

                  {/* Price for lg screens (desktop): hidden on mobile */}
                  <div className="mb-4 hidden lg:block animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="text-[20px] text-sky-600 font-poppins font-semibold animate-pulse-slow">₦{price.toLocaleString()}</div>
                  </div>

                  {/* Pharmacy name (always under the product name on mobile) */}
                  <div className="mb-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <button
                      onClick={() => navigate(`/vendor/${pharmacy?.id || product.pharmacyId}`)}
                      className="text-sky-600 underline font-poppins text-[15px] font-light hover:text-sky-700 transition-colors duration-200 hover:scale-105"
                    >
                      {pharmacy?.name}
                    </button>
                  </div>

                  {/* Address row: address on left, Get Directions on right (mobile). On lg the Get Directions is the separate block below. */}
                  <div className="mb-1 flex items-center justify-between gap-2 text-zinc-600 text-[13px] font-poppins font-light animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
                        className="text-sky-600 text-[13px] font-poppins font-light px-2 py-1 rounded-full hover:bg-sky-50 transition-all duration-200 lg:hidden hover:scale-105 active:scale-95"
                        aria-label="Get directions"
                      >
                        <DirectionsIcon className="h-4 w-4 inline-block mr-1" /> Get Directions
                      </button>
                    )}
                  </div>

                  {/* ETA below the address (mobile and desktop) */}
                  <div className="mb-3 flex items-center gap-2 text-zinc-600 text-[13px] font-poppins font-light animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <Clock className="h-4 w-4" /> 
                    {etaInfo 
                      ? `${etaInfo.formatted} to ${pharmacy?.name}` 
                      : userCoords 
                        ? 'Calculating ETA...' 
                        : 'Fetching location...'
                    }
                  </div>

                  {/* Get Directions for lg (desktop) - keep original placement on larger screens */}
                  {pharmacy?.address && (
                    <div className="mb-4 hidden lg:block animate-fade-in" style={{ animationDelay: '0.6s' }}>
                      <button
                        className="flex items-center gap-2 text-sky-600 text-[13px] font-poppins font-light px-3 py-2 rounded-full hover:bg-sky-50 transition-all duration-200 hover:scale-105 active:scale-95"
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
                  <div className="mt-2 animate-fade-in" style={{ animationDelay: '0.7s' }}>
                    {/* Desktop: show label then value underneath */}
                    <div className="hidden lg:block">
                      <div className="text-[15px] tracking-tight text-black font-poppins font-medium">Category</div>
                      <div className="mt-0.5 mb-5">
                        <button
                          type="button"
                          onClick={async (e) => { e.stopPropagation(); await fetchProductsByCategory(product.category || 'General'); }}
                          className="text-[13px] text-[#fc7f26] font-poppins font-normal underline hover:text-amber-500 transition-colors duration-200 hover:scale-105"
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
                            className="text-[13px] text-[#fc7f26] font-poppins font-normal underline hover:text-amber-500 transition-colors duration-200 hover:scale-105"
                          >
                            {product.category || 'General'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product description */}
                  <div className="mt-2 animate-fade-in" style={{ animationDelay: '0.8s' }}>
                    <div className="text-[15px] font-poppins font-medium tracking-tighter text-zinc-800">Product Description</div>
                    <p className="mt-2 text-zinc-600 leading-6 font-poppins text-[14px] font-light">{product.description}</p>
                  </div>

                  {/* Reviews/Comments Section */}
                  <div className="mt-8 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                    <div className="text-[15px] font-poppins font-medium tracking-tighter text-zinc-800 mb-2">Customer Reviews</div>
                    {/* Reviews List */}
                    <div className="space-y-4 mb-6">
                      {loadingReviews ? (
                        <div className="p-4 text-center text-zinc-400 animate-pulse">Loading reviews…</div>
                      ) : reviews.length === 0 ? (
                        <div className="p-4 text-center text-zinc-400 animate-fade-in">No reviews yet. Be the first to review!</div>
                      ) : (
                        reviews.map((review, idx) => (
                          <div key={review.id || idx} className="p-4 rounded-xl border border-zinc-100 bg-zinc-50 shadow-sm animate-slide-up hover:shadow-md transition-all duration-200">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-poppins font-semibold text-[14px] text-zinc-700">{review.name}</span>
                              <span className="flex gap-0.5 text-amber-400 text-[13px]">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                            </div>
                            <div className="text-zinc-600 text-[13px] font-poppins font-light">{review.comment}</div>
                          </div>
                        ))
                      )}
                    </div>
                    {/* Review Form */}
                    <form className="p-4 rounded-xl border border-zinc-100 bg-white shadow-sm animate-bounce-in" style={{ animationDelay: '1.0s' }} onSubmit={handleReviewSubmit}>
                      <div className="mb-2 font-poppins text-[14px] font-medium text-zinc-700">Leave a Review</div>
                      <input type="text" name="name" value={reviewForm.name} onChange={handleReviewChange} placeholder="Your Name" className="w-full mb-2 px-3 py-2 rounded-lg border border-zinc-200 font-poppins text-[13px] focus:ring-2 focus:ring-sky-200 transition-all duration-200" />
                      <select name="rating" value={reviewForm.rating} onChange={handleReviewChange} className="w-full mb-2 px-3 py-2 rounded-lg border border-zinc-200 font-poppins text-[13px] focus:ring-2 focus:ring-amber-200 transition-all duration-200">
                        <option value="">Rating</option>
                        {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Star{r>1?'s':''}</option>)}
                      </select>
                      <textarea name="comment" value={reviewForm.comment} onChange={handleReviewChange} placeholder="Your review..." className="w-full mb-2 px-3 py-2 rounded-lg border border-zinc-200 font-poppins text-[13px] focus:ring-2 focus:ring-sky-200 transition-all duration-200" rows={3} />
                      <button type="submit" disabled={submitting} className="w-full h-10 rounded-full bg-sky-600 text-white text-[14px] font-poppins font-light shadow-sm btn-interactive hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all duration-200">
                        {submitting ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Mobile fixed bottom CTA: visible on small screens, hidden on lg+ */}
        <div className="fixed left-0 right-0 bottom-28 z-30 lg:hidden animate-slide-up-fade">
          <div className="w-full max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 md:px-8 lg:px-12 xl:px-0">
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  if (!user) return alert('Please sign in');
                  if (!product.id) return alert('Product unavailable. Please try again.');
                  try { await addToCart(user.uid, product.id, 1); } catch { alert('Failed to add to cart.'); }
                }}
                className="w-full h-11 rounded-full bg-sky-600 text-white text-[14px] font-poppins font-light shadow-sm btn-interactive hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                Add to Cart
              </button>
              <a
                href={`tel:${pharmacy?.phone || ''}`}
                className="w-full h-11 rounded-full border border-zinc-400 text-[14px] font-poppins font-light flex items-center justify-center gap-2 text-zinc-800 bg-white btn-interactive hover:border-zinc-500 hover:scale-105 active:scale-95 transition-all duration-200"
              >
                <Phone className="h-4 w-4" /> Call to Order
              </a>
            </div>
          </div>
        </div>

        {/* Category products modal */}
        {showCategoryProducts && (
          <div onClick={() => setShowCategoryProducts(false)} className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black bg-opacity-30 animate-fade-in" role="dialog" aria-modal="true">
            <div onClick={e => e.stopPropagation()} className="bg-white rounded-2xl p-4 w-[90vw] max-w-md max-h-[80vh] overflow-y-auto animate-bounce-in shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-medium animate-text-reveal">Products in "{product.category || 'General'}"</div>
                <button onClick={() => setShowCategoryProducts(false)} className="text-zinc-500 hover:text-zinc-700 transition-colors duration-200 hover:scale-110 active:scale-95">Close</button>
              </div>

              {loadingCategoryProducts ? (
                <div className="p-4 text-center text-zinc-500 animate-pulse">Loading…</div>
              ) : categoryProducts.length === 0 ? (
                <div className="p-4 text-zinc-500 animate-fade-in">No products found.</div>
              ) : (
                <div className="space-y-2">
                  {categoryProducts.map((p, index) => (
                    <button 
                      key={p.id} 
                      onClick={() => { setShowCategoryProducts(false); navigate(`/product/${p.id}`); }} 
                      className="w-full text-left rounded-lg p-2 flex items-center gap-3 hover:bg-sky-50 transition-all duration-200 card-interactive animate-fadeInUp hover:scale-102"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <ProductAvatar name={p.name} image={p.image} category={p.category} size={48} className="flex-shrink-0 animate-bounce-gentle" roundedClass="rounded-md" />
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