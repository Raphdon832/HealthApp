// src/App.jsx
import React, { useEffect, useState } from "react";
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
import { collection, query, onSnapshot, doc as firestoreDoc, getDoc, where } from 'firebase/firestore';
import { listenUserThreads } from '@/lib/db';
import PageTransitionWrapper from '@/components/PageTransitionWrapper';
import InteractiveSwipeWrapper from '@/components/InteractiveSwipeWrapper';
import { useSettings, SETTINGS_KEYS } from '@/lib/settings';
import useApplySettings from '@/hooks/useApplySettings';

import BottomNav from '@/components/BottomNav';
import Home from '@/pages/Home';
import ProductDetail from '@/pages/ProductDetail';
import Messages from '@/pages/Messages';
import ChatThread from '@/pages/ChatThread';
import Cart from '@/pages/Cart';
import Orders from '@/pages/Orders';
import ProfileCustomer from '@/pages/ProfileCustomer';
import ProfilePharmacy from '@/pages/ProfilePharmacy';
import Settings from '@/pages/Settings';
import { AuthProvider, useAuth } from '@/lib/auth';
import { RequireAuth } from '@/components/Protected';
import { db } from '@/lib/firebase';
import Dashboard from '@/pages/Dashboard';
import NotificationManager from '@/components/NotificationManager';
import OrderNotificationModal from '@/components/OrderNotificationModal';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';
import SuperuserDashboard from '@/pages/SuperuserDashboard';
import PharmacyMap from '@/pages/PharmacyMap';
import GlobalMessageNotifier from '@/components/GlobalMessageNotifier';

// Auth flow pages
import Landing from "@/pages/auth/Landing";
import CustomerRegister from "@/pages/auth/CustomerRegister";
import CustomerSignIn from "@/pages/auth/CustomerSignIn";
import PharmacyRegister from "@/pages/auth/PharmacyRegister";
import PharmacySignIn from "@/pages/auth/PharmacySignIn";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/auth/ForgotPassword";

import AddProduct from '@/pages/AddProduct';

// Extra
import VendorProfile from '@/pages/VendorProfile';
import ProductPreview from '@/pages/ProductPreview';

/* ---------------------------
   LAYOUTS
----------------------------*/

// Layout that shows BottomNav
function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { getSetting } = useSettings();
  const [tab, setTab] = useState(location.pathname);
  const [cartCount, setCartCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);

  // Order notifications for pharmacies
  const { newOrder, showNotification, clearNotification, viewOrder } = useOrderNotifications();

  useEffect(() => setTab(location.pathname), [location.pathname]);

  useEffect(() => {
    if (!user || (profile && profile.role === "pharmacy"))
      return setCartCount(0);
    const q = query(collection(db, "users", user.uid, "cart"));
    const unsub = onSnapshot(q, (snap) => setCartCount(snap.size));
    return unsub;
  }, [user, profile]);

  // Listen to orders count for pharmacy users (exclude processing, shipped, cancelled)
  useEffect(() => {
    if (!user || !profile || profile.role !== 'pharmacy') return setOrdersCount(0);
    
    const pharmacyId = profile.uid || user.uid;
    const q = query(
      collection(db, 'orders'), 
      where('pharmacyId', '==', pharmacyId)
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const filteredOrders = snap.docs.filter(doc => {
        const order = doc.data();
        const status = order.status?.toLowerCase() || 'pending';
        // Exclude processing, shipped, fulfilled, cancelled - count pending, etc.
        return !['processing', 'shipped', 'fulfilled', 'cancelled'].includes(status);
      });
      setOrdersCount(filteredOrders.length);
    });
    
    return unsub;
  }, [user, profile]);

  useEffect(() => {
    if (!user || !profile?.role) return setUnreadMessages(0);

    // Use the same listener used by Messages.jsx to ensure we subscribe to the exact same
    // set of threads (by customerId/vendorId) and compute unread total from thread docs.
    const unsub = listenUserThreads(
      { uid: user.uid, role: profile.role },
      (threads) => {
        try {
          const sum = threads.reduce((acc, t) => {
            const u = t?.unread?.[user.uid];
            return acc + (typeof u === "number" ? u : 0);
          }, 0);
          setUnreadMessages(sum);
          console.debug("[AppLayout] unread total from listenUserThreads", {
            sum,
            count: threads.length,
          });
        } catch (e) {
          console.error("[AppLayout] error computing unread from threads", e);
        }
      },
      (err) => console.error("[AppLayout] listenUserThreads error", err)
    );

    return () => unsub && unsub();
  }, [user, profile?.role]);

  // Detect “chat modal open” via query param
  const params = new URLSearchParams(location.search);
  const chatModalOpen = !!params.get("chat"); // e.g. /messages?chat=<vendorId>

  // Dev overlay flag
  const showDebug =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("debugBottomNav") === "1";

  useEffect(() => {
    if (showDebug)
      console.debug("[AppLayout] render", {
        chatModalOpen,
        unreadMessages,
        tab,
        cartCount,
      });
  }, [showDebug, chatModalOpen, unreadMessages, tab, cartCount]);

  const handleViewOrder = (order) => {
    // Navigate to orders page when viewing the order
    navigate('/orders');
  };

  // Device detection and swipe setting check
  const isMobileOrTablet = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(max-width: 1024px)').matches;
  const isSwipeEnabled = getSetting(SETTINGS_KEYS.SWIPE_NAVIGATION);
  const shouldShowSwipeWrapper = isMobileOrTablet && isSwipeEnabled;

  return (
    <div
      className={`min-h-screen bg-white w-full flex flex-col items-center px-2 md:px-8 lg:px-16 xl:px-32 ${
        chatModalOpen ? "" : "pb-24"
      }`}
    >
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto flex-1 flex flex-col">
        {shouldShowSwipeWrapper ? (
          <InteractiveSwipeWrapper />
        ) : (
          <Outlet />
        )}
      </div>

      {/* Hide BottomNav when chat modal flag is on */}
      {!chatModalOpen && (
        <>
          <BottomNav
            tab={tab}
            setTab={(k) => navigate(k)}
            cartCount={cartCount}
            unreadMessages={unreadMessages}
            ordersCount={ordersCount}
          />
        </>
      )}

      {/* Debug overlay to surface unread and chatModalOpen even if BottomNav not mounted */}
      {showDebug && (
        <div className="fixed bottom-24 right-4 z-60 bg-black/80 text-white text-xs px-3 py-1 rounded">
          AppDebug: chatModalOpen={String(chatModalOpen)} unread=
          {String(unreadMessages)}
        </div>
      )}

      {/* Order Notification Modal */}
      <OrderNotificationModal
        order={newOrder}
        isOpen={showNotification}
        onClose={clearNotification}
        onViewOrder={handleViewOrder}
      />
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
      const prodSnap = await getDoc(firestoreDoc(db, "products", id));
      const prodData = prodSnap.data();
      setProduct(prodData ? { id, ...prodData } : null);
      if (prodData?.pharmacyId) {
        const pharmSnap = await getDoc(
          firestoreDoc(db, "pharmacies", prodData.pharmacyId)
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
  if (profile.role === "pharmacy")
    return <ProfilePharmacy onSwitchToCustomer={() => {}} />;
  return <ProfileCustomer onSwitchToPharmacy={() => {}} />;
}

function Shell() {
  const { user, profile } = useAuth();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const scrollTo = params.get("scrollTo")
    ? parseInt(params.get("scrollTo"), 10)
    : undefined;

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
  if (profile && profile.role === "superuser" && location.pathname === "/") {
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

        {/* Chat page routes - no BottomNav */}
        <Route
          path="/chat/:vendorId"
          element={
            <RequireAuth>
              <ChatThread />
            </RequireAuth>
          }
        />
        <Route
          path="/thread/:threadId"
          element={
            <RequireAuth>
              <ChatThread />
            </RequireAuth>
          }
        />
      </Route>

      {/* Superuser route - only for superuser role, uses BareLayout (no BottomNav) */}
      <Route element={<BareLayout />}>
        <Route
          path="/superuser"
          element={
            <RequireAuth>
              <SuperuserDashboard />
            </RequireAuth>
          }
        />
      </Route>
      {/* Main app (with BottomNav, but it auto-hides if ?chat= is present) */}
      <Route element={<AppLayout />}>
        {/* Root route adapts based on auth state */}
        <Route
          path="/"
          element={
            profile
              ? profile.role === "pharmacy"
                ? <Dashboard />
                : profile.role === "customer"
                  ? <Home />
                  : <Navigate to="/auth/landing" replace />
              : <Navigate to="/auth/landing" replace />
          }
        />
        <Route path="/vendor/:id" element={<VendorProfile />} />
        <Route path="/product/:id" element={<ProductDetailRoute />} />
        <Route path="/pharmacy-map" element={<RequireAuth><PharmacyMap /></RequireAuth>} />
        <Route 
          path="/add-product" 
          element={
            <RequireAuth>
              <AddProduct />
            </RequireAuth>
          } 
        />
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <Messages />
            </RequireAuth>
          }
        />
        <Route
          path="/cart"
          element={
            <RequireAuth>
              {profile && profile.role === "pharmacy" ? (
                <Navigate to="/" />
              ) : (
                <Cart />
              )}
            </RequireAuth>
          }
        />
        <Route
          path="/orders"
          element={
            <RequireAuth>
              <Orders />
            </RequireAuth>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <ProfileRouter />
            </RequireAuth>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireAuth>
              <Settings />
            </RequireAuth>
          }
        />
      </Route>

      {/* Public product preview route (no auth required) */}
      <Route element={<BareLayout />}>
        <Route path="/product-preview/:id" element={<ProductPreview />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  // Apply global settings
  useApplySettings();
  
  return (
    <AuthProvider>
      <NotificationManager />
      <Shell />
      <GlobalMessageNotifier />
    </AuthProvider>
  );
}
