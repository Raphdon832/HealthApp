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
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
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
      setLoading(true);
      if (profile && profile.role === 'pharmacy') {
        const data = await getBestSellingProducts(5, profile.uid); // pass vendorId
        setBestSelling(data);
      } else {
        setBestSelling([]);
      }
      setLoading(false);
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
      // Total products
      const productsSnap = await getDocs(query(collection(db, 'products'), where('pharmacyId', '==', profile.uid)));
      setTotalProducts(productsSnap.size);
      // Orders
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', profile.uid)));
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
  }, [profile]);

  useEffect(() => {
    async function fetchSalesTrends() {
      if (!profile || profile.role !== 'pharmacy') {
        setSalesTrends([]);
        return;
      }
      // Group orders by month for the last 6 months
      const q = query(collection(db, 'orders'), where('pharmacyId', '==', profile.uid));
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
  }, [profile]);

  useEffect(() => {
    async function fetchThreads() {
      if (!profile || profile.role !== 'pharmacy') {
        setRecentThreads([]);
        setUnreadMessages(0);
        return;
      }
      // Get the 3 most recent threads for this vendor
      const q = query(
        collection(db, 'threads'),
        where('vendorId', '==', profile.uid),
        orderBy('lastAt', 'desc'),
        limit(3)
      );
      const snap = await getDocs(q);
      const threads = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentThreads(threads.map(t => ({
        ...t,
        unread: t.unread?.[profile.uid] || 0
      })));
      // Count total unread
      const unread = threads.reduce((sum, t) => sum + (t.unread?.[profile.uid] || 0), 0);
      setUnreadMessages(unread);
    }
    fetchThreads();
  }, [profile]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-sky-100 py-4 px-6 flex items-center justify-start">
        <h1 className="text-[25px] font-light text-black leading-none">My<br/>Dashboard</h1>
      </header>
      <main className="flex-1 px-4 py-6 flex flex-col items-center justify-start relative">
        <div className="w-full max-w-md">
          {/* Best Selling Section */}
          <div className="mb-8 mt-[-12px]">
            <div className="bg-[#F7F7F7] rounded-2xl border border-sky-500 p-5">
              <h2 className="text-black font-light mb-3 text-lg tracking-tight">Best Selling</h2>
              {loading ? (
                <div className="text-zinc-400 text-sm">Loading...</div>
              ) : bestSelling.length === 0 ? (
                <div className="text-zinc-400 text-sm">No sales data yet.</div>
              ) : (
                <div className="flex flex-col gap-3">
                  {bestSelling.map((prod, idx) => (
                    <div key={prod.id || idx} className="flex items-center justify-between">
                      <span className="font-light text-[13px] text-zinc-700 truncate max-w-[120px]">{prod.name}</span>
                      <div className="flex-1 mx-2 h-3 bg-sky-100 rounded-full relative">
                        <div
                          className="h-3 bg-sky-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(10, (prod.sold / (bestSelling[0]?.sold || 1)) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sky-700 font-semibold text-sm min-w-[32px] text-right">{prod.sold}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Add Products Section (copied from ProfilePharmacy) */}
          <div className="mt-4 flex gap-2 w-full">
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
          {showAdd && <AddProductModal pharmacyId={profile?.uid} onClose={()=>setShowAdd(false)} />}
          {showBulk && <BulkUploadModal pharmacyId={profile?.uid} onClose={()=>setShowBulk(false)} />}
          {/* Revenue Graph Section */}
          <RevenueGraph
            data={revenueData}
            filter={revenueFilter}
            onFilterChange={setRevenueFilter}
            topPeriod={topPeriod}
          />
          {/* Vendor Stats Carousel */}
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
          {/* Sales Trends Section */}
          <SalesTrends data={salesTrends} />
          {/* Messages Preview Section */}
          <MessagesPreview
            threads={recentThreads}
            unreadCount={unreadMessages}
            onThreadClick={t => navigate(`/messages/${t.id}`)}
          />
        </div>
        {/* Floating Add Product Button */}
        <button
          className="fixed bottom-24 right-8 z-50 bg-sky-400 text-white rounded-full shadow-lg w-10 h-10 flex items-center justify-center"
          aria-label="Add Product"
          onClick={() => setShowAdd(true)}
        >
          <span className="text-3xl font-bold leading-none">+</span>
        </button>
      </main>
    </div>
  );
}
