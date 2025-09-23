import React, { useEffect, useState } from 'react';
import { getBestSellingProducts } from '../lib/db';
import { useAuth } from '../lib/auth';
import AddProductModal from '@/components/AddProductModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import RevenueGraph from '@/components/RevenueGraph';
import VendorStatsCarousel from '@/components/VendorStatsCarousel';
import SalesTrends from '@/components/SalesTrends';
import MessagesPreview from '@/components/MessagesPreview';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

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
          return dt ? `${dt.getMonth()+1}/${dt.getFullYear()}` : '';
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
        const top = arr.reduce((max, cur) => cur.value > max.value ? cur : max, arr[0]);
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
      // Orders
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', pharmacyId)));
      setTotalOrders(ordersSnap.size);
      let revenue = 0;
      let recents = [];
      ordersSnap.forEach(doc => {
        const d = doc.data();
        revenue += d.total || 0;
        recents.push({ id: doc.id, ...d });
      });
      setTotalRevenue(revenue);
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
      // Group orders by month for the last 6 months
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
      // Get the 3 most recent threads for this vendor
      const q = query(
        collection(db, 'threads'),
        where('vendorId', '==', pharmacyId),
        orderBy('lastAt', 'desc'),
        limit(3)
      );
      const snap = await getDocs(q);
      const threads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentThreads(threads.map(t => ({
        ...t,
        unread: t.unread?.[pharmacyId] || 0
      })));
      // Count total unread
      const unread = threads.reduce((sum, t) => sum + (t.unread?.[pharmacyId] || 0), 0);
      setUnreadMessages(unread);
    }
    fetchThreads();
  }, [profile, user]);

  return (
    <div className="pt-10 pb-32 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-0 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen flex flex-col">
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md pb-2 pt-4 -mx-auto sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0">
        <h1 className="text-[25px] font-light text-black leading-none">My<br/>Dashboard</h1>
      </header>

      <main className="flex-1 px-3 sm:px-4 py-6 relative w-full mb-4">
        {/* Responsive grid: single column on mobile, two columns on lg+ */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 items-start pb-16">
          {/* LEFT COLUMN: Best Selling, Add Buttons, Sales Trends */}
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-br from-[#F7F7F7] to-[#F0F8FF] rounded-2xl border border-sky-500 p-6 relative overflow-hidden">
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-sky-100/40 to-transparent rounded-full -translate-y-10 translate-x-10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-black font-light text-xl tracking-tight">Top Products</h2>
                  <div className="px-3 py-1 bg-sky-100 rounded-full text-xs text-sky-700 font-medium">
                    🏆 Best Sellers
                  </div>
                </div>
                
                {bestSelling.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-3">📊</div>
                    <div className="text-zinc-400 text-sm">No sales data yet</div>
                    <div className="text-xs text-zinc-400 mt-1">Start selling products to see your top performers</div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {bestSelling.map((prod, idx) => (
                      <div key={prod.id || idx} className="group hover:bg-white/50 rounded-xl p-3 transition-all duration-200 relative">
                        {/* Rank badge */}
                        <div className={`absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                          'bg-gradient-to-br from-sky-400 to-sky-600'
                        }`}>
                          {idx + 1}
                        </div>
                        
                        <div className="flex items-center justify-between ml-4">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[14px] text-zinc-800 truncate max-w-[140px] group-hover:text-sky-700 transition-colors">
                              {prod.name}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                              {prod.sold} units sold
                            </div>
                          </div>
                          
                          <div className="flex-1 mx-4 relative">
                            {/* Progress bar background */}
                            <div className="h-4 bg-gradient-to-r from-sky-100 to-blue-100 rounded-full relative overflow-hidden">
                              {/* Animated progress bar */}
                              <div
                                className={`h-4 rounded-full transition-all duration-1000 ease-out relative ${
                                  idx === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                                  idx === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                                  idx === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                                  'bg-gradient-to-r from-sky-400 to-sky-500'
                                }`}
                                style={{ 
                                  width: `${Math.max(15, (prod.sold / (bestSelling[0]?.sold || 1)) * 100)}%`,
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
                                  left: `${Math.max(15, (prod.sold / (bestSelling[0]?.sold || 1)) * 100)}%`,
                                  transform: 'translateX(-100%)'
                                }}
                              >
                                {Math.round((prod.sold / (bestSelling[0]?.sold || 1)) * 100)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right min-w-[50px]">
                            <span className={`font-bold text-lg ${
                              idx === 0 ? 'text-yellow-600' :
                              idx === 1 ? 'text-gray-600' :
                              idx === 2 ? 'text-orange-600' :
                              'text-sky-600'
                            }`}>
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
                className="flex-1 rounded-full border border-sky-600 text-sky-600 text-[13px] font-light py-2 hover:bg-[#E3F3FF]"
                onClick={() => setShowBulk(true)}
              >
                Bulk Upload
              </button>
            </div>

            {showAdd && <AddProductModal pharmacyId={profile?.uid || user?.uid} onClose={()=>setShowAdd(false)} />}
            {showBulk && <BulkUploadModal pharmacyId={profile?.uid || user?.uid} onClose={()=>setShowBulk(false)} />}

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
                  </div>
                ]}
              />
            </div>

            <div>
              <MessagesPreview
                threads={recentThreads}
                unreadCount={unreadMessages}
                onThreadClick={t => navigate(`/messages/${t.id}`)}
              />
            </div>
          </div>
        </div>

        {/* Floating Add Product Button (unchanged) */}
        <button
          className="fixed bottom-24 right-8 z-50 bg-sky-400 text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center disabled:opacity-0 disabled:cursor-not-allowed"
          aria-label="Add Product"
          onClick={() => setShowAdd(true)}
          disabled={showAdd}
        >
          <span className="text-3xl font-bold leading-none">+</span>
        </button>
      </main>
    </div>
  );
}
