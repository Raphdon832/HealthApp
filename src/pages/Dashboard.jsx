import React, { useEffect, useState } from 'react';
import { getBestSellingProducts } from '../lib/db';
import { useAuth } from '../lib/auth';
import AddProductModal from '@/components/AddProductModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import RevenueGraph from '@/components/RevenueGraph';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function Dashboard() {
  const [bestSelling, setBestSelling] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [revenueData, setRevenueData] = useState([]);
  const [revenueFilter, setRevenueFilter] = useState({ type: 'month', value: '' });
  const [topPeriod, setTopPeriod] = useState(null);

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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-sky-100 py-4 px-6 flex items-center justify-start">
        <h1 className="text-[25px] font-light text-black leading-none">My<br/>Dashboard</h1>
      </header>
      <main className="flex-1 px-4 py-6 flex flex-col items-center justify-start">
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
          {/* Add dashboard widgets or content here */}
          <div className="w-full max-w-md text-center">
            <p className="text-zinc-500 text-lg">Welcome to your pharmacy dashboard.</p>
            {/* Example widget placeholder */}
            <div className="mt-8 grid gap-4">
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 shadow-sm">
                <h2 className="text-sky-700 font-semibold mb-1">Orders Overview</h2>
                <p className="text-zinc-500 text-sm">Track and manage your recent orders here.</p>
              </div>
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 shadow-sm">
                <h2 className="text-sky-700 font-semibold mb-1">Messages</h2>
                <p className="text-zinc-500 text-sm">View and respond to customer messages.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
