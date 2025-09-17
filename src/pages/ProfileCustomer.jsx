import { useAuth } from '@/lib/auth';
import { MapPin, Phone, Search, LogOut, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { updateProfile, updatePhoneNumber, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import MyPrescriptionsSection from '@/components/MyPrescriptionsSection';
import LoadingSkeleton from '@/components/LoadingSkeleton';

export default function ProfileCustomer() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || '');
  const [editAddress, setEditAddress] = useState('Kuje, Abuja, Nigeria');
  const [editPassword, setEditPassword] = useState("");
  const [showAllDrugs, setShowAllDrugs] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeChats, setActiveChats] = useState(0);
  const [drugsBought, setDrugsBought] = useState([]);
  // Search state for customer profile
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchScope, setSearchScope] = useState('all'); // 'prescriptions' | 'orders' | 'drugs' | 'all'
  const [searchResults, setSearchResults] = useState([]);
  const [ordersCache, setOrdersCache] = useState(null);
  const [prescriptionsCache, setPrescriptionsCache] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    // Fetch cart items (actual count from user's cart subcollection)
    getDocs(collection(db, 'users', user.uid, 'cart')).then(snapshot => {
      setCartCount(snapshot.size);
    });
    // Fetch active chats (threads where customerId == user.uid)
    getDocs(query(collection(db, 'threads'), where('customerId', '==', user.uid))).then(snapshot => {
      setActiveChats(snapshot.size);
    });
    // Fetch drugs bought (harmonized by productId, using product name from products collection)
    getDocs(query(collection(db, 'orders'), where('customerId', '==', user.uid))).then(async snapshot => {
      const drugs = {};
      for (const docSnap of snapshot.docs) {
        const order = docSnap.data();
        for (const item of (order.items || [])) {
          const key = item.productId;
          if (!drugs[key]) {
            // Try to get product name from products collection
            let name = item.name;
            if (!name && key) {
              const prodSnap = await getDoc(doc(db, 'products', key));
              name = prodSnap.exists() ? prodSnap.data().name : key;
            }
            drugs[key] = { name, count: 0, lastDate: order.createdAt?.toDate?.() || null };
          }
          drugs[key].count += Number(item.qty || item.quantity || 1);
          // Use latest date
          const orderDate = order.createdAt?.toDate?.() || null;
          if (orderDate && (!drugs[key].lastDate || orderDate > drugs[key].lastDate)) {
            drugs[key].lastDate = orderDate;
          }
        }
      }
      // Sort by lastDate desc
      const drugsArr = Object.values(drugs).sort((a, b) => (b.lastDate || 0) - (a.lastDate || 0));
      setDrugsBought(drugsArr);
    });
  }, [user]);

  // Perform search across prescriptions, orders and drugsBought
  async function performSearch() {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const results = [];

    if (searchScope === 'drugs' || searchScope === 'all') {
      (drugsBought || []).forEach(d => {
        const hay = `${d.name || ''}`.toLowerCase();
        if (hay.includes(q)) {
          results.push({ type: 'drug', title: d.name, subtitle: `Bought ${d.count || 0} times`, item: d });
        }
      });
    }

    if (searchScope === 'orders' || searchScope === 'all') {
      let orders = ordersCache;
      if (!orders) {
        const snap = await getDocs(query(collection(db, 'orders'), where('customerId', '==', user.uid)));
        orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrdersCache(orders);
      }
      (orders || []).forEach(o => {
        const hay = `${o.id} ${(o.items || []).map(it => it.name).join(' ')} ${o.total || ''}`.toLowerCase();
        if (hay.includes(q)) {
          results.push({ type: 'order', title: `Order ${o.id}`, subtitle: `${o.items?.length || 0} items — ₦${Number(o.total || 0).toLocaleString()}`, item: o });
        }
      });
    }

    if (searchScope === 'prescriptions' || searchScope === 'all') {
      let pres = prescriptionsCache;
      if (!pres) {
        const snap = await getDocs(query(collection(db, 'prescriptions'), where('customerId', '==', user.uid)));
        pres = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPrescriptionsCache(pres);
      }
      (pres || []).forEach(p => {
        // try to match id, medicines array or notes
        const medicines = (p.medicines || []).join(' ');
        const hay = `${p.id} ${medicines} ${p.note || ''} ${p.pharmacyName || ''}`.toLowerCase();
        if (hay.includes(q)) {
          results.push({ type: 'prescription', title: `Prescription ${p.id}`, subtitle: p.note || '', item: p });
        }
      });
    }

    setSearchResults(results);
  }

  // Close search modal on Escape for accessibility
  useEffect(() => {
    if (!showSearch) return;
    function onKey(e) {
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSearch]);

  // Live search: debounce input so results update as the user types
  useEffect(() => {
    if (!showSearch) return;
    const q = (searchQuery || '').trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    const id = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(id);
  }, [searchQuery, searchScope, showSearch]);

  if (!user) {
    return <LoadingSkeleton lines={4} className="my-8" />;
  }

  return (
    <div className="pt-10 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0">
        <div className="w-full flex items-center justify-between">
          <div className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none">My<br/>Profile</div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSearch(true)} aria-label="Open search" className="rounded-full p-2 hover:bg-sky-50">
              <Search className="h-5 w-5 text-sky-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Search modal (click outside to close) */}
      {showSearch && (
        <div onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black bg-opacity-30" role="dialog" aria-modal="true" aria-label="Search modal">
          <div onClick={e => e.stopPropagation()} className="bg-white rounded-3xl w-[min(920px,95%)] p-4 shadow-xl border border-[#9ED3FF] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center bg-[#F0FAFF] border border-[#9ED3FF] rounded-full px-3 py-2 w-full overflow-hidden">
                  <Search className="h-4 w-4 text-sky-600 mr-2 flex-shrink-0" />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') performSearch(); }}
                    placeholder="Search prescriptions, orders, drugs..."
                    className="flex-1 min-w-0 bg-transparent text-sm outline-none truncate"
                    aria-label="Search query"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select value={searchScope} onChange={e => setSearchScope(e.target.value)} className="rounded-full border border-[#9ED3FF] px-3 py-2 text-sm bg-white w-36">
                  <option value="prescriptions">Prescriptions</option>
                  <option value="orders">Orders</option>
                  <option value="drugs">Drugs</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            <div className="border-t" style={{borderColor:'#E6F7FF'}} />

            <div className="mt-4 max-h-[60vh] overflow-auto px-1 py-2">
              {searchResults.length === 0 ? (
                <div className="text-zinc-500 p-4">No results yet. Enter a query.</div>
              ) : (
                <ul className="space-y-2">
                  {searchResults.map((r, idx) => (
                    <li key={idx} className="p-2 rounded-2xl border border-[#9ED3FF] bg-white hover:bg-[#E3F3FF] transition-shadow flex items-center gap-3 justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-black truncate">{r.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{r.subtitle}</div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {r.type === 'order' ? (
                          <button onClick={() => { navigate(`/orders/${r.item.id}`); setShowSearch(false); }} className="text-sky-600 rounded-full px-3 py-1 text-sm border border-transparent hover:bg-sky-50">Open</button>
                        ) : r.type === 'prescription' ? (
                          <button onClick={() => { navigate(`/prescriptions/${r.item.id}`); setShowSearch(false); }} className="text-sky-600 rounded-full px-3 py-1 text-sm border border-transparent hover:bg-sky-50">Open</button>
                        ) : (
                          <button onClick={() => { setShowSearch(false); }} className="text-sky-600 rounded-full px-3 py-1 text-sm border border-transparent hover:bg-sky-50">View</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Layout: single column on mobile, two-column on desktop */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Left column: Profile card + logout */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-zinc-200 flex items-center justify-center mb-3 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-3xl text-zinc-400 font-light">{user?.displayName?.[0] || 'C'}</span>
              )}
            </div>
            <div className="w-full flex items-center justify-between mt-1">
              <div className="text-[20px] font-medium text-sky-600 tracking-tighter">{user?.displayName||'Customer'}</div>
              <button
                className="ml-2 px-3 py-1 rounded-full border border-sky-200 text-sky-600 text-xs flex items-center gap-1 hover:bg-sky-50"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            </div>

            {/* Edit form modal */}
            {editing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white border border-[#36A5FF] rounded-3xl p-5 w-[90vw] max-w-sm shadow-xl">
                  <div className="text-[22px] font-light font-poppins text-sky-600 mb-2 tracking-tight">Edit Profile</div>
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={async e => {
                      e.preventDefault();
                      if (
                        editName !== user?.displayName ||
                        editPhone !== user?.phoneNumber ||
                        editAddress !== 'Kuje, Abuja, Nigeria'
                      ) {
                        if (!editPassword) {
                          alert('Please enter your account password to save changes.');
                          return;
                        }
                        try {
                          // Re-authenticate user
                          const credential = EmailAuthProvider.credential(user.email, editPassword);
                          await reauthenticateWithCredential(user, credential);
                          // Update Firebase Auth profile
                          await updateProfile(user, { displayName: editName });
                          // Update Firestore user doc
                          await updateDoc(doc(db, 'users', user.uid), {
                            displayName: editName,
                            phoneNumber: editPhone,
                            address: editAddress
                          });
                          setEditing(false);
                          window.location.reload();
                        } catch (err) {
                          alert('Failed to update profile: ' + err.message);
                        }
                      } else {
                        setEditing(false);
                      }
                    }}
                  >
                    <label className="text-[12px] text-zinc-500 font-light"></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 transition-all"
                      value={editName}
                      placeholder="Name"
                      onChange={e => setEditName(e.target.value)}
                      style={{boxShadow: 'none'}}
                    />
                    <label className="text-[12px] text-zinc-500 font-light"></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 transition-all"
                      value={editPhone}
                      placeholder="Phone Number"
                      onChange={e => setEditPhone(e.target.value)}
                      style={{boxShadow: 'none'}}
                    />
                    <label className="text-[12px] text-zinc-500 font-light"></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 transition-all"
                      value={editAddress}
                      placeholder="Address"
                      onChange={e => setEditAddress(e.target.value)}
                      style={{boxShadow: 'none'}}
                    />
                    <label className="text-[12px] text-zinc-500 font-light"></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 transition-all"
                      type="password"
                      placeholder="Account Password (required to save)"
                      onChange={e => setEditPassword(e.target.value)}
                      required
                      style={{boxShadow: 'none'}}
                    />
                    <div className="flex gap-2 mt-4">
                      <button type="button" className="px-4 py-2 rounded-full bg-zinc-100 text-[12px] font-light" onClick={() => setEditing(false)}>Cancel</button>
                      <button type="submit" className="px-4 py-2 rounded-full bg-sky-600 text-white text-[12px] font-light">Save</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="text-zinc-500 mt-1 text-[12px] font-light w-full pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>{user?.email}</div>
            <div className="flex items-center gap-2 text-zinc-500 mt-2 text-[12px] font-light w-full pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}><MapPin className="h-2.5 w-2.5"/> Kuje, Abuja, Nigeria</div>
            <div className="flex items-center gap-2 text-zinc-500 mt-1 text-[12px] font-light w-full" ><Phone className="h-2.5 w-2.5"/> 080123456789</div>
          </div>

          <div>
            <button onClick={() => { logout(); window.location.href = '/auth/landing'; }} className="rounded-full border border-red-300 text-red-600 px-3 py-1 inline-flex text-[12px] items-center gap-2"><LogOut className="h-4 w-4"/> Log Out</button>
          </div>
        </div>

        {/* Right column: Activity and Prescriptions stack */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start">
            <div className="text-[18px] font-light font-poppins text-black mb-2 tracking-tight">My Activity</div>
            <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
              <span className="text-[12px] text-zinc-500 font-light">Items in Cart</span>
              <span className="text-[12px] text-sky-600 font-medium">{cartCount ?? 0}</span>
            </div>
            <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
              <span className="text-[12px] text-zinc-500 font-light">Active Chats</span>
              <span className="text-[12px] text-sky-600 font-medium">{activeChats ?? 0}</span>
            </div>
            <div className="w-full flex items-center justify-between mt-3 mb-1">
              <span className="text-[14px] font-light text-zinc-800">Drugs Bought</span>
              <button className="text-[12px] text-sky-600 font-light px-2 py-1 rounded-full hover:bg-sky-50" onClick={() => setShowAllDrugs(true)}>See more</button>
            </div>
            <div className="w-full flex flex-col gap-2">
              {(drugsBought.slice(0,3)).map((drug, idx) => (
                <div key={drug.id || idx} className="w-full flex items-center pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
                  <span className="text-[12px] text-zinc-500 font-light w-1/3 text-left">{drug.name}</span>
                  <span className="text-[12px] text-zinc-400 font-light w-1/3 flex justify-center">{drug.date}</span>
                  <span className="text-[12px] text-zinc-500 font-light w-1/3 text-right">{drug.count ?? 1}</span>
                </div>
              ))}
            </div>

            {/* Modal for all drugs bought */}
            {showAllDrugs && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white border border-[#36A5FF] rounded-3xl p-5 w-[90vw] max-w-sm shadow-xl">
                  <div className="text-[18px] font-light font-poppins text-sky-600 mb-2 tracking-tight">All Drugs Bought</div>
                  <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                    {drugsBought.map((drug, idx) => (
                      <div key={drug.id || idx} className="w-full flex items-center pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
                        <span className="text-[12px] text-zinc-500 font-light w-1/3 text-left">{drug.name}</span>
                        <span className="text-[12px] text-zinc-400 font-light w-1/3 flex justify-center">{drug.date}</span>
                        <span className="text-[12px] text-zinc-500 font-light w-1/3 text-right">{drug.count ?? 1}</span>
                      </div>
                    ))}
                  </div>
                  <button className="mt-4 px-4 py-2 rounded-full bg-sky-600 text-white text-[12px] font-light w-full" onClick={() => setShowAllDrugs(false)}>Close</button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start">
            <MyPrescriptionsSection />
          </div>
        </div>
      </div>
    </div>
  );
}