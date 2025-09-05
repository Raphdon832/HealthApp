// src/App.jsx
import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
  useParams,
  useMatch,
} from 'react-router-dom';
import { collection, query, onSnapshot } from 'firebase/firestore';

import BottomNav from '@/components/BottomNav';
import Home from '@/pages/Home';
import ProductDetail from '@/pages/ProductDetail';
import Messages from '@/pages/Messages';
import ChatThread from '@/pages/ChatThread';
import Cart from '@/pages/Cart';
import Orders from '@/pages/Orders';
import ProfileCustomer from '@/pages/ProfileCustomer';
import ProfilePharmacy from '@/pages/ProfilePharmacy';
import { AuthProvider, useAuth } from '@/lib/auth';
import { RequireAuth } from '@/components/Protected';
import { doc as firestoreDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Auth flow pages
import Landing from '@/pages/auth/Landing';
import CustomerRegister from '@/pages/auth/CustomerRegister';
import CustomerSignIn from '@/pages/auth/CustomerSignIn';
import PharmacyRegister from '@/pages/auth/PharmacyRegister';
import PharmacySignIn from '@/pages/auth/PharmacySignIn';

// Extra
import VendorProfile from '@/pages/VendorProfile';

function Shell() {
  const [tab, setTab] = useState('/');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => setTab(location.pathname), [location.pathname]);

  useEffect(() => {
    if (!user) return setCartCount(0);
    const q = query(collection(db, 'users', user.uid, 'cart'));
    const unsub = onSnapshot(q, (snap) => setCartCount(snap.size));
    return unsub;
  }, [user]);

  // Robust route matching (works with base paths / nested routers)
  const matchAuth = useMatch('/auth/*');
  const matchChat = useMatch('/chat/:vendorId');

  // Hide BottomNav on auth + chat routes
  const showNav = !(matchAuth || matchChat);

  // scrollTo param for chat thread (optional)
  const params = new URLSearchParams(location.search);
  const scrollTo = params.get('scrollTo')
    ? parseInt(params.get('scrollTo'), 10)
    : undefined;

  return (
    <div className={`min-h-screen bg-white w-full flex flex-col items-center px-2 md:px-8 lg:px-16 xl:px-32 ${showNav ? 'pb-24' : 'pb-0'}`}>
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex-1 flex flex-col">
        <Routes>
          {/* Home or redirect to landing */}
          <Route
            path="/"
            element={user ? <Home /> : <Navigate to="/auth/landing" replace />}
          />

          {/* Vendor profile */}
          <Route path="/vendor/:id" element={<VendorProfile />} />

          {/* Product detail */}
          <Route path="/product/:id" element={<ProductDetailRoute />} />

          {/* Auth flow */}
          <Route path="/auth/landing" element={<Landing />} />
          <Route path="/auth/customer/register" element={<CustomerRegister />} />
          <Route path="/auth/customer/signin" element={<CustomerSignIn />} />
          <Route path="/auth/pharmacy/register" element={<PharmacyRegister />} />
          <Route path="/auth/pharmacy/signin" element={<PharmacySignIn />} />
          <Route path="/auth" element={<Navigate to="/auth/landing" replace />} />

          {/* Protected routes */}
          <Route
            path="/messages"
            element={
              <RequireAuth>
                <Messages
                  openThread={(t) => {
                    const participants = t.participants || [];
                    let vendorId = '';
                    if (participants.length === 2) {
                      vendorId = participants.find((p) => p !== user?.uid);
                    } else {
                      vendorId = t.id?.split('__')[1] || '';
                    }
                    navigate(`/chat/${vendorId}`);
                  }}
                />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/:vendorId"
            element={
              <RequireAuth>
                {/* Always go back to /messages from chat */}
                <ChatThread scrollTo={scrollTo} onBackRoute="/messages" />
              </RequireAuth>
            }
          />
          <Route path="/cart" element={<RequireAuth><Cart /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfileRouter /></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {/* Only show BottomNav if not on chat thread */}
      {showNav && <BottomNav tab={tab} setTab={(k) => navigate(k)} cartCount={cartCount} />}
    </div>
  );
}

function ProductDetailRoute() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const prodSnap = await getDoc(firestoreDoc(db, 'products', id));
      const prodData = prodSnap.data();
      setProduct(prodData);
      if (prodData?.pharmacyId) {
        const pharmSnap = await getDoc(
          firestoreDoc(db, 'pharmacies', prodData.pharmacyId)
        );
        setPharmacy(pharmSnap.data());
      }
    }
    fetchData();
  }, [id]);

  if (!product) return null;
  return <ProductDetail product={product} pharmacy={pharmacy} />;
}

function ProfileRouter() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role === 'pharmacy')
    return <ProfilePharmacy onSwitchToCustomer={() => {}} />;
  return <ProfileCustomer onSwitchToPharmacy={() => {}} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}