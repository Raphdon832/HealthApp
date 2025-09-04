// src/App.jsx (routing to Auth + protected pages)
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate, Navigate, useParams } from 'react-router-dom';
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

// NEW: role/landing screens
import Landing from '@/pages/auth/Landing';
import CustomerRegister from '@/pages/auth/CustomerRegister';
import CustomerSignIn from '@/pages/auth/CustomerSignIn';
import PharmacyRegister from '@/pages/auth/PharmacyRegister';
import PharmacySignIn from '@/pages/auth/PharmacySignIn';
import VendorProfile from '@/pages/VendorProfile';

function Shell() {
  const [tab, setTab] = useState('/');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => setTab(location.pathname), [location.pathname]);

  // Hide bottom nav on auth and chat pages
  const showNav = !location.pathname.startsWith('/auth') && !location.pathname.startsWith('/chat');

  // Compute scrollTo for chat thread
  const params = new URLSearchParams(location.search);
  const scrollTo = params.get('scrollTo') ? parseInt(params.get('scrollTo'), 10) : undefined;

  return (
    <div className="min-h-screen bg-white flex flex-col items-center w-full">
      <div className="w-full max-w-md flex-1">
        <Routes>
          {/* If not signed in, send "/" to landing; else show Home */}
          <Route
            path="/"
            element={user ? <Home /> : <Navigate to="/auth/landing" replace />}
          />
          {/* Vendor profile route */}
          <Route path="/vendor/:id" element={<VendorProfile />} />
          {/* Product detail route */}
          <Route path="/product/:id" element={<ProductDetailRoute />} />
          {/* Auth flow */}
          <Route path="/auth/landing" element={<Landing />} />
          <Route path="/auth/customer/register" element={<CustomerRegister />} />
          <Route path="/auth/customer/signin" element={<CustomerSignIn />} />
          <Route path="/auth/pharmacy/register" element={<PharmacyRegister />} />
          <Route path="/auth/pharmacy/signin" element={<PharmacySignIn />} />
          <Route path="/auth" element={<Navigate to="/auth/landing" replace />} />
          {/* Protected app routes */}
          <Route
            path="/messages"
            element={
              <RequireAuth>
                <Messages openThread={(t) => {
                  const participants = t.participants || [];
                  let vendorId = '';
                  if (participants.length === 2) {
                    vendorId = participants.find(p => p !== user?.uid);
                  } else {
                    vendorId = t.id?.split('__')[1] || '';
                  }
                  navigate(`/chat/${vendorId}`);
                }} />
              </RequireAuth>
            }
          />
          <Route
            path="/chat/:vendorId"
            element={
              <RequireAuth>
                <ChatThread scrollTo={scrollTo} />
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
      {showNav && <BottomNav tab={tab} setTab={(k) => navigate(k)} />}
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
        const pharmSnap = await getDoc(firestoreDoc(db, 'pharmacies', prodData.pharmacyId));
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
  if (profile.role === 'pharmacy') return <ProfilePharmacy onSwitchToCustomer={() => {}} />;
  return <ProfileCustomer onSwitchToPharmacy={() => {}} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
