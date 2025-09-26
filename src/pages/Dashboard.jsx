import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getBestSellingProducts } from '../lib/db';
import { useAuth } from '../lib/auth';
import AddProductModal from '@/components/AddProductModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import RevenueGraph from '@/components/RevenueGraph';
import VendorStatsCarousel from '@/components/VendorStatsCarousel';
import SalesTrends from '@/components/SalesTrends';
import MessagesPreview from '@/components/MessagesPreview';
import RecentReviewsPreview from '@/components/RecentReviewsPreview';
import ReviewsManagement from '@/components/ReviewsManagement';
import ReviewNotificationManager from '@/components/ReviewNotificationManager';
import { useReviewNotifications } from '../hooks/useReviewNotifications';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';
import Fab from '@/components/Fab'; // ✅ use the portal-based FAB

export default function Dashboard() {
  const [bestSelling, setBestSelling] = useState([]);
  const { profile, user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueFilter, setRevenueFilter] = useState({ type: 'month', value: '' });
  const [topPeriod, setTopPeriod] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesTrends, setSalesTrends] = useState([]);
  const [recentThreads, setRecentThreads] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showAddButton, setShowAddButton] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  // New statistics
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [averageOrderValue, setAverageOrderValue] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [lowStockItems, setLowStockItems] = useState(0);
  const [ordersThisMonth, setOrdersThisMonth] = useState(0);
  const [lastMonthOrders, setLastMonthOrders] = useState(0);
  const navigate = useNavigate();

  // Review notifications
  const { newReviews, unreadReviewsCount, markReviewsAsRead } = useReviewNotifications();

  // Mobile Header Component
  const MobileHeader = () => (
    <header 
      className="sm:hidden fixed top-0 left-0 right-0 z-[100] border-b border-gray-100/50 dark:border-gray-700/50 shadow-sm px-4 py-4 transition-all duration-200"
      style={{
        backgroundColor: document.documentElement.classList.contains('dark') 
          ? 'rgba(17, 24, 39, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <h1 className="mt-8 text-[25px] font-light text-black dark:text-white leading-none animate-slideInLeft mb-4">
        My<br />Dashboard
      </h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => {
            setActiveTab('reviews');
            if (unreadReviewsCount > 0) {
              markReviewsAsRead();
            }
          }}
          className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
            activeTab === 'reviews'
              ? 'bg-white text-sky-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reviews
          {unreadReviewsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
              {unreadReviewsCount > 9 ? '9+' : unreadReviewsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );

  useEffect(() => {
    async function fetchData() {
      if (profile && profile.role === 'pharmacy') {
        const data = await getBestSellingProducts(5, profile.uid); // pass vendorId
        setBestSelling(data);
      } else {
        setBestSelling([]);
      }
    }
    fetchData();
  }, [profile]);

  useEffect(() => {
    async function fetchRevenue() {
      if (!profile || profile.role !== 'pharmacy') return setRevenueData([]);
      const q = query(collection(db, 'orders'), where('pharmacyId', '==', profile.uid));
      const snap = await getDocs(q);
      const orders = snap.docs.map(d => d.data());
      let grouped = {};
      let labelFn = d => '';

      if (revenueFilter.type === 'date') {
        labelFn = d => {
          const dt = d.createdAt?.toDate?.() || new Date(d.createdAt);
          return dt ? dt.toLocaleDateString('en-GB') : '';
        };
      } else if (revenueFilter.type === 'month') {
        labelFn = d => {
          const dt = d.createdAt?.toDate?.() || new Date(d.createdAt);
          return dt ? `${dt.getMonth() + 1}/${dt.getFullYear()}` : '';
        };
      } else if (revenueFilter.type === 'year') {
        labelFn = d => {
          const dt = d.createdAt?.toDate?.() || new Date(d.createdAt);
          return dt ? `${dt.getFullYear()}` : '';
        };
      }

      orders.forEach(o => {
        const label = labelFn(o);
        if (!label) return;
        if (revenueFilter.value && !label.startsWith(revenueFilter.value)) return;
        grouped[label] = (grouped[label] || 0) + (o.total || 0);
      });

      const arr = Object.entries(grouped).map(([label, value]) => ({ label, value }));
      arr.sort((a, b) => a.label.localeCompare(b.label));
      setRevenueData(arr);

      if (arr.length > 0) {
        const top = arr.reduce((max, cur) => (cur.value > max.value ? cur : max), arr[0]);
        setTopPeriod(top);
      } else {
        setTopPeriod(null);
      }
    }
    fetchRevenue();
  }, [profile, revenueFilter]);

  useEffect(() => {
    async function fetchStats() {
      if (!profile || profile.role !== 'pharmacy') return;
      const pharmacyId = profile.uid || user?.uid;
      if (!pharmacyId) return;

      // Total products
      const productsSnap = await getDocs(query(collection(db, 'products'), where('pharmacyId', '==', pharmacyId)));
      setTotalProducts(productsSnap.size);

      // Low stock items
      const lowStock = productsSnap.docs.filter(doc => {
        const data = doc.data();
        const stock = data.stock || 0;
        const threshold = data.lowStockThreshold || 10;
        return stock <= threshold;
      });
      setLowStockItems(lowStock.length);

      // Orders data
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', pharmacyId)));
      setTotalOrders(ordersSnap.size);

      let revenue = 0;
      let recents = [];
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      let thisMonthOrders = 0;
      let lastMonthOrdersCount = 0;
      let pendingOrdersCount = 0;
      const uniqueCustomers = new Set();
      const completedOrders = [];

      ordersSnap.forEach(doc => {
        const d = doc.data();
        revenue += d.total || 0;
        recents.push({ id: doc.id, ...d });

        const orderDate = d.createdAt?.toDate?.() || new Date(d.createdAt);
        const orderMonth = orderDate.getMonth();
        const orderYear = orderDate.getFullYear();

        if (orderMonth === currentMonth && orderYear === currentYear) {
          thisMonthOrders++;
        }
        if (orderMonth === lastMonth && orderYear === lastMonthYear) {
          lastMonthOrdersCount++;
        }
        if (d.status === 'pending' || d.status === 'processing') {
          pendingOrdersCount++;
        }
        if (orderMonth === currentMonth && orderYear === currentYear && d.customerId) {
          uniqueCustomers.add(d.customerId);
        }
        if (d.status === 'completed' || d.status === 'delivered') {
          completedOrders.push(d);
        }
      });

      setTotalRevenue(revenue);
      setOrdersThisMonth(thisMonthOrders);
      setLastMonthOrders(lastMonthOrdersCount);
      setPendingOrders(pendingOrdersCount);
      setActiveCustomers(uniqueCustomers.size);

      if (completedOrders.length > 0) {
        const totalCompletedRevenue = completedOrders.reduce((sum, order) => sum + (order.total || 0), 0);
        setAverageOrderValue(totalCompletedRevenue / completedOrders.length);
      } else {
        setAverageOrderValue(0);
      }

      recents.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setRecentOrders(recents.slice(0, 3));
    }
    fetchStats();
  }, [profile, user]);

  useEffect(() => {
    async function fetchSalesTrends() {
      if (!profile || profile.role !== 'pharmacy') {
        setSalesTrends([]);
        return;
      }
      const pharmacyId = profile.uid || user?.uid;
      if (!pharmacyId) return;

      const q = query(collection(db, 'orders'), where('pharmacyId', '==', pharmacyId));
      const snap = await getDocs(q);
      const orders = snap.docs.map(d => d.data());

      const now = new Date();
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ label: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() + 1 });
      }
      const trends = months.map(({ label, year, month }) => {
        const value = orders.filter(o => {
          const dt = o.createdAt?.toDate?.() || new Date(o.createdAt);
          return dt.getFullYear() === year && dt.getMonth() + 1 === month;
        }).length;
        return { label, value };
      });
      setSalesTrends(trends);
    }
    fetchSalesTrends();
  }, [profile, user]);

  useEffect(() => {
    async function fetchThreads() {
      if (!profile || profile.role !== 'pharmacy') {
        setRecentThreads([]);
        setUnreadMessages(0);
        return;
      }
      const pharmacyId = profile.uid || user?.uid;
      if (!pharmacyId) return;

      const q = query(
        collection(db, 'threads'),
        where('vendorId', '==', pharmacyId),
        orderBy('lastAt', 'desc'),
        limit(3)
      );
      const snap = await getDocs(q);
      const threads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentThreads(
        threads.map(t => ({
          ...t,
          unread: t.unread?.[pharmacyId] || 0
        }))
      );
      const unread = threads.reduce((sum, t) => sum + (t.unread?.[pharmacyId] || 0), 0);
      setUnreadMessages(unread);
    }
    fetchThreads();
  }, [profile, user]);

  return (
    <>
      {/* Mobile Fixed Header - Rendered via Portal outside transform context */}
      {typeof window !== 'undefined' && createPortal(<MobileHeader />, document.body)}

      <div className="pt-32 sm:pt-10 pb-32 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-0 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen flex flex-col animate-fadeInUp">
        {/* Desktop Header - Non-sticky, inside container */}
        <header className="hidden sm:block pb-2 pt-4">
          <h1 className="text-[25px] font-light text-black dark:text-white leading-none animate-slideInLeft mb-4">
            My<br />Dashboard
          </h1>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('reviews');
                if (unreadReviewsCount > 0) {
                  markReviewsAsRead();
                }
              }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                activeTab === 'reviews'
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reviews
              {unreadReviewsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {unreadReviewsCount > 9 ? '9+' : unreadReviewsCount}
                </span>
              )}
            </button>
          </div>
        </header>

      <main className="flex-1 px-3 sm:px-4 py-2 sm:py-6 relative w-full mt-4">
        {activeTab === 'overview' ? (
          // Existing Overview Content
          <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start pb-16">
          {/* LEFT COLUMN: Best Selling, Add Buttons, Sales Trends */}
          <div className="flex flex-col gap-6">
            <div
              className="bg-gradient-to-br from-[#F7F7F7] to-[#F0F8FF] rounded-2xl border border-sky-500 p-6 relative overflow-hidden card-interactive animate-fadeInUp"
              style={{ animationDelay: '0.1s' }}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sky-100/40 to-transparent rounded-full -translate-y-10 translate-x-10"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-black dark:text-white font-light text-xl tracking-tight animate-slideInLeft"
                    style={{ animationDelay: '0.2s' }}
                  >
                    Top Products
                  </h2>
                  <div
                    className="px-3 py-1 bg-sky-100 rounded-full text-xs text-sky-700 font-medium animate-bounceIn"
                    style={{ animationDelay: '0.3s' }}
                  >
                    🏆 Best Sellers
                  </div>
                </div>

                {bestSelling.length === 0 ? (
                  <div className="text-center py-8 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
                    <div className="text-4xl mb-3">📊</div>
                    <div className="text-zinc-400 text-sm">No sales data yet</div>
                    <div className="text-xs text-zinc-400 mt-1">Start selling products to see your top performers</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {bestSelling.map((prod, idx) => (
                      <div key={prod.id || idx} className="group hover:bg-white/50 rounded-xl p-3 transition-all duration-200 relative">
                        {/* Rank badge */}
                        <div
                          className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                            idx === 0
                              ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                              : idx === 1
                              ? 'bg-gradient-to-br from-gray-400 to-gray-600'
                              : idx === 2
                              ? 'bg-gradient-to-br from-orange-400 to-orange-600'
                              : 'bg-gradient-to-br from-sky-400 to-sky-600'
                          }`}
                        >
                          {idx + 1}
                        </div>

                        <div className="flex items-center justify-between ml-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[14px] text-zinc-800 truncate max-w-[140px] group-hover:text-sky-700 transition-colors">
                              {prod.name}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">{prod.sold} units sold</div>
                          </div>

                          <div className="flex-1 mx-4 relative">
                            {/* Progress bar background */}
                            <div className="h-4 bg-gradient-to-r from-sky-100 to-blue-100 rounded-full relative overflow-hidden">
                              {/* Animated progress bar */}
                              <div
                                className={`h-4 rounded-full transition-all duration-1000 ease-out relative ${
                                  idx === 0
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                    : idx === 1
                                    ? 'bg-gradient-to-r from-gray-400 to-gray-500'
                                    : idx === 2
                                    ? 'bg-gradient-to-r from-orange-400 to-orange-500'
                                    : 'bg-gradient-to-r from-sky-400 to-sky-500'
                                }`}
                                style={{
                                  width: `${Math.max(
                                    15,
                                    (prod.sold / (bestSelling[0]?.sold || 1)) * 100
                                  )}%`,
                                  boxShadow: '0 2px 8px rgba(54, 165, 255, 0.3)'
                                }}
                              >
                                {/* Shine effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 transform -skew-x-12 animate-pulse"></div>
                              </div>

                              {/* Progress percentage */}
                              <div
                                className="absolute top-0 right-2 h-4 flex items-center text-xs font-medium text-white"
                                style={{
                                  left: `${Math.max(
                                    15,
                                    (prod.sold / (bestSelling[0]?.sold || 1)) * 100
                                  )}%`,
                                  transform: 'translateX(-100%)'
                                }}
                              >
                                {Math.round((prod.sold / (bestSelling[0]?.sold || 1)) * 100)}%
                              </div>
                            </div>
                          </div>

                          <div className="text-right min-w-[50px]">
                            <span
                              className={`font-bold text-lg ${
                                idx === 0
                                  ? 'text-yellow-600'
                                  : idx === 1
                                  ? 'text-gray-600'
                                  : idx === 2
                                  ? 'text-orange-600'
                                  : 'text-sky-600'
                              }`}
                            >
                              {prod.sold}
                            </span>
                            <div className="text-xs text-zinc-400">units</div>
                          </div>
                        </div>

                        {/* Hover effect overlay */}
                        <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-sky-200 transition-all duration-200"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Add Products / Bulk Upload buttons */}
            <div className="flex gap-2 w-full">
              <button
                className="flex-1 rounded-full bg-sky-600 text-white text-[13px] font-light py-2 shadow hover:bg-sky-700"
                onClick={() => setShowAdd(true)}
              >
                + Add Product
              </button>
              <button
                className="flex-1 rounded-full border border-sky-600 dark:border-gray-600 text-sky-600 text-[13px] font-light py-2 hover:bg-[#E3F3FF]"
                onClick={() => setShowBulk(true)}
              >
                Bulk Upload
              </button>
            </div>

            {showAdd && <AddProductModal pharmacyId={profile?.uid || user?.uid} onClose={() => setShowAdd(false)} />}
            {showBulk && <BulkUploadModal pharmacyId={profile?.uid || user?.uid} onClose={() => setShowBulk(false)} />}

            {/* Sales Trends placed under Add buttons on left column */}
            <div>
              <SalesTrends data={salesTrends} />
            </div>
          </div>

          {/* RIGHT COLUMN: Revenue, Vendor Stats, Messages */}
          <div className="flex flex-col gap-6 pb-8 relative z-0">
            <div className="relative z-0">
              <RevenueGraph
                data={revenueData}
                filter={revenueFilter}
                onFilterChange={setRevenueFilter}
                topPeriod={topPeriod}
              />
            </div>

            <div>
              <VendorStatsCarousel
                cards={[
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Total Products</div>
                    <div className="text-[19px] font-semibold text-sky-700 tracking-tight">{totalProducts}</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Total Orders</div>
                    <div className="text-[19px] font-semibold text-sky-700 tracking-tight">{totalOrders}</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Total Revenue</div>
                    <div className="text-[19px] font-semibold text-sky-700 tracking-tight">₦{totalRevenue.toLocaleString()}</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Active Customers</div>
                    <div className="text-[19px] font-semibold text-emerald-600 tracking-tight">{activeCustomers}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">This Month</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Avg Order Value</div>
                    <div className="text-[19px] font-semibold text-purple-600 tracking-tight">₦{averageOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Pending Orders</div>
                    <div className="text-[19px] font-semibold text-orange-600 tracking-tight">{pendingOrders}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Awaiting</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Low Stock Items</div>
                    <div className="text-[19px] font-semibold text-red-600 tracking-tight">{lowStockItems}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Need Restock</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Orders This Month</div>
                    <div className="text-[19px] font-semibold text-blue-600 tracking-tight">{ordersThisMonth}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">
                      {lastMonthOrders > 0 ? (
                        ordersThisMonth >= lastMonthOrders ? (
                          <span className="text-emerald-600">↗ +{((ordersThisMonth - lastMonthOrders) / lastMonthOrders * 100).toFixed(0)}%</span>
                        ) : (
                          <span className="text-red-500">↘ -{((lastMonthOrders - ordersThisMonth) / lastMonthOrders * 100).toFixed(0)}%</span>
                        )
                      ) : (
                        <span className="text-gray-400">No comparison</span>
                      )}
                    </div>
                  </div>,
                  // Reviews stats cards
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Pending Reviews</div>
                    <div className="text-[19px] font-semibold text-yellow-600 tracking-tight">{unreadReviewsCount}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Need Response</div>
                  </div>,
                  <div>
                    <div className="text-zinc-500 text-xs mb-1">Recent Reviews</div>
                    <div className="text-[19px] font-semibold text-indigo-600 tracking-tight">{newReviews.length}</div>
                    <div className="text-[10px] text-zinc-400 mt-0.5">Last 24h</div>
                  </div>
                ]}
              />
            </div>

            {/* Low Stock Alert */}
            {lowStockItems > 0 && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">!</span>
                  </div>
                  <div>
                    <div className="text-red-700 font-medium text-sm">Low Stock Alert</div>
                    <div className="text-red-600 text-xs">
                      {lowStockItems} item{lowStockItems > 1 ? 's' : ''} need restocking
                    </div>
                  </div>
                </div>
                <div className="text-xs text-red-600 bg-red-100 rounded-lg px-3 py-2">
                  💡 Check your inventory to avoid running out of popular products
                </div>
              </div>
            )}

            <div>
              <MessagesPreview
                threads={recentThreads}
                unreadCount={unreadMessages}
                onThreadClick={t => navigate(`/messages/${t.id}`)}
              />
            </div>

            {/* Recent Reviews Preview */}
            <div>
              <RecentReviewsPreview
                reviews={newReviews.slice(0, 5)} // Show up to 5 recent reviews
                onViewAllReviews={() => {
                  setActiveTab('reviews');
                  markReviewsAsRead();
                }}
              />
            </div>
          </div>
        </div>
        ) : (
          // Reviews Tab Content
          <div className="pb-16">
            <ReviewsManagement />
          </div>
        )}

        {/* (Removed old floating button here) */}
      </main>

      {/* ✅ Portal-based Floating Action Button (always fixed to viewport) */}
      <Fab onClick={() => setShowAdd(true)} disabled={showAdd} />

      {/* Review Notification Manager */}
      <ReviewNotificationManager
        newReviews={newReviews}
        onDismissReview={(reviewId) => {
          // Just dismiss from notifications, don't need to do anything special
        }}
        onViewReview={(reviewId) => {
          // Switch to reviews tab and scroll to the specific review
          setActiveTab('reviews');
          markReviewsAsRead();
        }}
      />
      </div>
    </>
  );
}