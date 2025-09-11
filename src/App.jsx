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
  Outlet,
} from 'react-router-dom';
import { collection, query, onSnapshot, where, doc as firestoreDoc, getDoc } from 'firebase/firestore';

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
import { db } from '@/lib/firebase';
import Dashboard from '@/pages/Dashboard';
import GlobalMessageNotifier from '@/components/GlobalMessageNotifier';
import SuperuserDashboard from '@/pages/SuperuserDashboard';

// Auth flow pages
import Landing from '@/pages/auth/Landing';
import CustomerRegister from '@/pages/auth/CustomerRegister';
import CustomerSignIn from '@/pages/auth/CustomerSignIn';
import PharmacyRegister from '@/pages/auth/PharmacyRegister';
import PharmacySignIn from '@/pages/auth/PharmacySignIn';
import VerifyEmail from '@/pages/VerifyEmail';
import ForgotPassword from '@/pages/auth/ForgotPassword';

// Extra
import VendorProfile from '@/pages/VendorProfile';

/* ---------------------------
   LAYOUTS
----------------------------*/

// Layout that shows BottomNav
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tab, setTab] = useState(location.pathname);
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => setTab(location.pathname), [location.pathname]);

  useEffect(() => {
    if (!user || (profile && profile.role === 'pharmacy')) return setCartCount(0);
    const q = query(collection(db, 'users', user.uid, 'cart'));
    const unsub = onSnapshot(q, (snap) => setCartCount(snap.size));
    return unsub;
  }, [user, profile]);

  useEffect(() => {
    if (!user) return setUnreadMessages(0);
    // Listen for all threads where user is a participant
    const threadsQ = query(collection(db, 'threads'), where('participants', 'array-contains', user.uid));
    let unsubs = [];
    const unsub = onSnapshot(threadsQ, (threadsSnap) => {
      const threadIds = threadsSnap.docs.map(d => d.id);
      if (!threadIds.length) {
        setUnreadMessages(0);
        unsubs.forEach(u => u());
        unsubs = [];
        return;
      }
      // Unsubscribe from previous listeners
      unsubs.forEach(u => u());
      unsubs = [];
      let totalUnread = 0;
      let counts = {};
      let pending = threadIds.length;
      threadIds.forEach(threadId => {
        const unsubMsg = onSnapshot(
          query(
            collection(db, 'threads', threadId, 'messages'),
            where('to', '==', user.uid),
            where('read', '==', false)
          ),
          (msgSnap) => {
            counts[threadId] = msgSnap.size;
            pending--;
            if (pending === 0) {
              totalUnread = Object.values(counts).reduce((a, b) => a + b, 0);
              setUnreadMessages(totalUnread);
            }
          }
        );
        unsubs.push(unsubMsg);
      });
    });
    return () => {
      unsub();
      unsubs.forEach(u => u());
    };
  }, [user]);

  // Detect “chat modal open” via query param
  const params = new URLSearchParams(location.search);
  const chatModalOpen = !!params.get('chat'); // e.g. /messages?chat=<vendorId>

  return (
    <div className={`min-h-screen bg-white w-full flex flex-col items-center px-2 md:px-8 lg:px-16 xl:px-32 ${chatModalOpen ? '' : 'pb-24'}`}>
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex-1 flex flex-col">
        <Outlet />
      </div>

      {/* Hide BottomNav when chat modal flag is on */}
      {!chatModalOpen && (
        <BottomNav
          tab={tab}
          setTab={(k) => navigate(k)}
          cartCount={cartCount}
          unreadMessages={unreadMessages}
        />
      )}
    </div>
  );
}

// Layout without BottomNav (for auth pages and full-page chat route if you use it)
function BareLayout() {
  return (
    <div className="min-h-screen bg-white w-full flex flex-col items-center px-2 md:px-8 lg:px-16 xl:px-32">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex-1 flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

/* ---------------------------
   ROUTES
----------------------------*/

function ProductDetailRoute() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [pharmacy, setPharmacy] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const prodSnap = await getDoc(firestoreDoc(db, 'products', id));
      const prodData = prodSnap.data();
      setProduct(prodData ? { id, ...prodData } : null);
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
  if (profile.role === 'pharmacy')
    return <ProfilePharmacy onSwitchToCustomer={() => {}} />;
  return <ProfileCustomer onSwitchToPharmacy={() => {}} />;
}

function Shell() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const scrollTo = params.get('scrollTo') ? parseInt(params.get('scrollTo'), 10) : undefined;

  // Show loading until profile is loaded
  if (user && profile === undefined) {
    return <LoadingSkeleton lines={4} className="my-8" />;
  }

  // Block unverified users
  if (user && !user.emailVerified) {
    return (
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="*" element={<Navigate to="/verify-email" replace />} />
      </Routes>
    );
  }

  // Redirect superuser to /superuser ONLY if on root path
  if (profile && profile.role === 'superuser' && location.pathname === '/') {
    return <Navigate to="/superuser" replace />;
  }

  return (
    <Routes>
      {/* Auth (no BottomNav) */}
      <Route element={<BareLayout />}>
        <Route path="/auth/landing" element={<Landing />} />
        <Route path="/auth/customer/register" element={<CustomerRegister />} />
        <Route path="/auth/customer/signin" element={<CustomerSignIn />} />
        <Route path="/auth/pharmacy/register" element={<PharmacyRegister />} />
        <Route path="/auth/pharmacy/signin" element={<PharmacySignIn />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth" element={<Navigate to="/auth/landing" replace />} />

        {/* Optional full-page chat route (also no BottomNav) */}
        <Route
          path="/chat/:vendorId"
          element={
            <RequireAuth>
              <ChatThread scrollTo={scrollTo} onBackRoute="/messages" />
            </RequireAuth>
          }
        />
      </Route>

      {/* Superuser route - only for superuser role, uses BareLayout (no BottomNav) */}
      <Route element={<BareLayout />}>
        <Route path="/superuser" element={<RequireAuth><SuperuserDashboard /></RequireAuth>} />
      </Route>
      {/* Main app (with BottomNav, but it auto-hides if ?chat= is present) */}
      <Route element={<AppLayout />}> 
        {/* Remove / route for superuser, only show for pharmacy/customer */}
        {profile && profile.role === 'pharmacy' ? (
          <Route path="/" element={<Dashboard />} />
        ) : profile && profile.role === 'customer' ? (
          <Route path="/" element={<Home />} />
        ) : null}
        <Route path="/vendor/:id" element={<VendorProfile />} />
        <Route path="/product/:id" element={<ProductDetailRoute />} />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <Messages />
            </RequireAuth>
          }
        />
        <Route path="/cart" element={<RequireAuth>{profile && profile.role === 'pharmacy' ? <Navigate to="/" /> : <Cart />}</RequireAuth>} />
        <Route path="/orders" element={<RequireAuth><Orders /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><ProfileRouter /></RequireAuth>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalMessageNotifier />
      <Shell />
    </AuthProvider>
  );
}
