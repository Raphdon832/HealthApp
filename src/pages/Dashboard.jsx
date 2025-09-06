import React, { useEffect, useState } from 'react';
import { getBestSellingProducts } from '../lib/db';
import { useAuth } from '../lib/auth';

export default function Dashboard() {
  const [bestSelling, setBestSelling] = useState([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

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
                          className="h-3 bg-sky-400 rounded-full"
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
