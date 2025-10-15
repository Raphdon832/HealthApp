import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProductAvatar from '@/components/ProductAvatar';
import VerifiedName from '@/components/VerifiedName';
import { MapPin, Clock, Phone, ArrowLeft, Star } from 'lucide-react';

export default function ProductPreview() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const prodRef = doc(db, 'products', id);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap.exists()) {
          const prodData = prodSnap.data();
          setProduct({ id, ...prodData });
          if (prodData.pharmacyId) {
            const pharmRef = doc(db, 'pharmacies', prodData.pharmacyId);
            const pharmSnap = await getDoc(pharmRef);
            if (pharmSnap.exists()) setPharmacy({ id: prodData.pharmacyId, ...pharmSnap.data() });
          }
          const reviewsRef = collection(db, 'products', id, 'reviews');
          const q = query(reviewsRef, orderBy('createdAt', 'desc'));
          const snap = await getDocs(q);
          setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch {}
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-zinc-400 font-poppins">Loading…</div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center text-zinc-400 font-poppins">Product not found.</div>;

  const price = Number(product.price || 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-full md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-2 md:px-8 lg:px-12 xl:px-0 pt-8 pb-36">
        <div className="mb-6 flex items-center gap-2">
          <ArrowLeft className="h-5 w-5 text-zinc-500 cursor-pointer" onClick={() => window.history.back()} />
          <span className="font-poppins text-[18px] font-medium">Product Preview</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="rounded-2xl p-4 border flex flex-col items-center justify-center w-full card-interactive">
            {product.image ? (
              <img src={product.image} alt={product.name} className="max-h-[360px] w-full object-contain" />
            ) : (
              <div className="h-[200px] w-full flex items-center justify-center bg-zinc-100 rounded-md text-3xl font-semibold text-zinc-800">
                <ProductAvatar name={product.name} image={product.image} category={product.category} size={80} roundedClass="rounded-md" />
              </div>
            )}
            <div className="w-full mt-4 flex flex-col gap-3">
              <div className="w-full h-10 rounded-full bg-sky-100 text-sky-700 text-[14px] font-poppins font-light shadow-sm flex items-center justify-center">Preview Only</div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="mb-3 flex items-start justify-between">
              <h1 className="text-[20px] lg:text-[22px] font-poppins font-medium tracking-tight leading-tight min-w-0">{product.name}</h1>
              <div className="text-[20px] text-sky-600 font-poppins font-semibold">₦{price.toLocaleString()}</div>
            </div>
            <div className="mb-2">
              {pharmacy ? (
                <VerifiedName
                  name={pharmacy.name}
                  isVerified={pharmacy.isVerified}
                  className="text-sky-600 underline font-poppins text-[15px] font-light"
                  iconClassName="h-3.5 w-3.5 text-sky-500"
                />
              ) : (
                <span className="text-zinc-400 font-poppins text-[15px] font-light">Pharmacy info unavailable</span>
              )}
            </div>
            <div className="mb-1 flex items-center gap-2 text-zinc-600 text-[13px] font-poppins font-light">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{pharmacy?.address || 'Address unavailable'}</span>
            </div>
            <div className="mt-2">
              <div className="text-[15px] font-poppins font-medium tracking-tighter text-zinc-800">Product Description</div>
              <p className="mt-2 text-zinc-600 leading-6 font-poppins text-[14px] font-light">{product.description}</p>
            </div>
            <div className="mt-8">
              <div className="text-[15px] font-poppins font-medium tracking-tighter text-zinc-800 mb-2">Customer Reviews</div>
              <div className="space-y-4 mb-6">
                {reviews.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400">No reviews yet.</div>
                ) : (
                  reviews.map((review, idx) => (
                    <div key={review.id || idx} className="p-4 rounded-xl border border-sky-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-poppins font-semibold text-[14px] text-zinc-700">{review.name}</span>
                        <span className="flex gap-0.5 text-amber-400 text-[13px]">{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                      </div>
                      <div className="text-zinc-600 text-[13px] font-poppins font-light">{review.comment}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
