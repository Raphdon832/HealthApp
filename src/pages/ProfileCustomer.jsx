import { useAuth } from '@/lib/auth';
import { MapPin, Phone, Search, LogOut, Pencil, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { updateProfile, updatePhoneNumber, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { doc, updateDoc, collection, query, where, getDocs, getDoc, onSnapshot } from 'firebase/firestore';
import { listenUserWishlist, listenUserBookmarkedVendors } from '@/lib/db';
import MyPrescriptionsSection from '@/components/MyPrescriptionsSection';

// Fixed Header Component
const FixedHeader = ({ title, onSearchClick, onSettingsClick }) => {
  return createPortal(
    <div className="fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md z-[100] px-4 py-4 border-b border-gray-100 dark:border-gray-700">
      <div className="w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
        <div className="mt-8 flex items-center justify-between">
          <h1 className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none text-gray-900 dark:text-white">My<br/>Profile</h1>
          <div className="flex items-center gap-2">
            <button onClick={onSearchClick} aria-label="Open search" className="rounded-full p-2 hover:bg-sky-50 transition-all duration-200">
              <Search className="h-5 w-5 text-sky-600" />
            </button>
            <button onClick={onSettingsClick} aria-label="Open settings" className="rounded-full p-2 hover:bg-sky-50 transition-all duration-200">
              <Settings className="h-5 w-5 text-sky-600" />
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function ProfileCustomer() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  // edit fields start empty and will be populated from real-time `customerProfile` when available
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPassword, setEditPassword] = useState("");
  const [showAllDrugs, setShowAllDrugs] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [activeChats, setActiveChats] = useState(0);
  const [wishlist, setWishlist] = useState([]);
  const [showWishlist, setShowWishlist] = useState(false);
  const [bookmarkedVendors, setBookmarkedVendors] = useState([]);
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'vendors'
  const [drugsBought, setDrugsBought] = useState([]);
  // Real-time customer profile from Firestore (name, address, email, phone)
  const [customerProfile, setCustomerProfile] = useState({
    displayName: user?.displayName || 'Customer',
    address: 'Kuje, Abuja, Nigeria',
    phone: user?.phoneNumber || '',
    email: user?.email || ''
  });
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

    // Listen to user's wishlist
    const unsubscribeWishlist = listenUserWishlist(user.uid, (wishlistItems) => {
      setWishlist(wishlistItems);
    });

    // Listen to user's bookmarked vendors
    const unsubscribeBookmarks = listenUserBookmarkedVendors(user.uid, (bookmarks) => {
      setBookmarkedVendors(bookmarks);
    });

    // Cleanup listeners on unmount
    return () => {
      if (unsubscribeWishlist) unsubscribeWishlist();
      if (unsubscribeBookmarks) unsubscribeBookmarks();
    };
    
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
    // Subscribe to real-time user profile document
    const userDocRef = doc(db, 'users', user.uid);
    const unsub = onSnapshot(userDocRef, snap => {
      if (snap && snap.exists()) {
        const d = snap.data();
        setCustomerProfile(prev => {
          // Prefer explicit phoneNumber/phone fields, but guard against data mistakes (e.g. an email accidentally stored in phone)
          let phoneVal = d.phoneNumber ?? d.phone ?? prev.phone ?? '';
          if (typeof phoneVal === 'string' && phoneVal.includes('@')) {
            phoneVal = prev.phone ?? '';
          }
          return {
            displayName: d.displayName || user.displayName || prev.displayName,
            address: d.address || prev.address || '',
            phone: phoneVal,
            email: d.email || user.email || prev.email || ''
          };
        });
      }
    }, () => {});

    return () => unsub && unsub();
  }, [user]);

  // Keep edit fields in sync with realtime profile when not actively editing
  useEffect(() => {
    if (!editing && customerProfile) {
      setEditName(customerProfile.displayName || '');
      setEditPhone(customerProfile.phone || '');
      setEditAddress(customerProfile.address || 'Kuje, Abuja, Nigeria');
    }
  }, [customerProfile, editing]);

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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-xl font-poppins font-light mb-6">Please sign in to continue</div>
        <button
          className="rounded-full bg-sky-600 text-white px-8 py-3 text-lg font-poppins font-medium shadow hover:bg-sky-700 transition"
          onClick={() => navigate('/auth/landing')}
        >
          Sign In / Sign Up
        </button>
      </div>
    );
  }

  return (
    <>
      <FixedHeader 
        title="My Profile"
        onSearchClick={() => setShowSearch(true)}
        onSettingsClick={() => navigate('/settings')}
      />
      <div className="pt-24 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen animate-fadeInUp">

      {/* Search modal (click outside to close) */}
      {showSearch && (
        <div onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black bg-opacity-30 animate-fadeInScale" role="dialog" aria-modal="true" aria-label="Search modal">
          <div onClick={e => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl w-[min(920px,95%)] p-4 shadow-xl border border-[#9ED3FF] dark:border-gray-600 max-h-[80vh] overflow-hidden modal-backdrop animate-bounceIn">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center bg-[#F0FAFF] dark:bg-gray-700 border border-[#9ED3FF] dark:border-gray-600 rounded-full px-3 py-2 w-full overflow-hidden input-interactive">
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
                <select value={searchScope} onChange={e => setSearchScope(e.target.value)} className="rounded-full border border-[#9ED3FF] dark:border-gray-600 px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-white w-36 input-interactive">
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
                    <li key={idx} className="p-2 rounded-2xl border border-[#9ED3FF] dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-[#E3F3FF] dark:hover:bg-gray-600 transition-all duration-200 flex items-center gap-3 justify-between animate-fadeInUp card-interactive hover:shadow-md" style={{ animationDelay: `${idx * 0.05}s` }}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          r.type === 'order' ? 'bg-green-100' : 
                          r.type === 'prescription' ? 'bg-blue-100' : 
                          'bg-purple-100'
                        }`}>
                          {r.type === 'order' ? (
                            <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          ) : r.type === 'prescription' ? (
                            <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-black truncate">{r.title}</div>
                          <div className="text-xs text-zinc-500 truncate">{r.subtitle}</div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-2">
                        {r.type === 'order' ? (
                          <button onClick={() => { navigate('/orders', { state: { highlightOrderId: r.item.id } }); setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="text-sky-600 rounded-full px-3 py-1 text-sm border border-transparent hover:bg-sky-50 btn-interactive transition-all duration-200">Open</button>
                        ) : r.type === 'prescription' ? (
                          <button onClick={() => { navigate(`/prescriptions/${r.item.id}`); setShowSearch(false); }} className="text-sky-600 rounded-full px-3 py-1 text-sm border border-transparent hover:bg-sky-50 btn-interactive transition-all duration-200">Open</button>
                        ) : (
                          <button onClick={() => { setShowSearch(false); }} className="text-sky-600 rounded-full px-3 py-1 text-sm border border-transparent hover:bg-sky-50 btn-interactive transition-all duration-200">View</button>
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
          <div className="rounded-3xl border bg-[#F7F7F7] dark:bg-gray-800 border-[#36A5FF] dark:border-gray-600 p-4 flex flex-col items-start">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center mb-3 overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-3xl text-zinc-400 font-light">{(customerProfile.displayName && customerProfile.displayName[0]) || 'C'}</span>
              )}
            </div>
            <div className="w-full flex items-center justify-between mt-1">
              <div className="text-[20px] font-medium text-sky-600 tracking-tighter">{customerProfile.displayName || 'Customer'}</div>
              <button
                className="ml-2 px-3 py-1 rounded-full border border-sky-200 dark:border-gray-600 text-sky-600 text-xs flex items-center gap-1 hover:bg-sky-50"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" /> Edit
              </button>
            </div>

            {/* Edit form modal */}
            {editing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 animate-fadeInScale">
                <div className="bg-white dark:bg-gray-800 border border-[#36A5FF] dark:border-gray-600 rounded-3xl p-5 w-[90vw] max-w-sm shadow-xl modal-backdrop animate-bounceIn">
                  <div className="text-[22px] font-light font-poppins text-sky-600 mb-2 tracking-tight animate-slideInLeft">Edit Profile</div>
                  <form
                    className="flex flex-col gap-4"
                    onSubmit={async e => {
                      e.preventDefault();
                      if (
                        editName !== (customerProfile?.displayName || user?.displayName) ||
                        editPhone !== (customerProfile?.phone || user?.phoneNumber) ||
                        editAddress !== (customerProfile?.address || 'Address missing')
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
                    <label className="text-[12px] text-zinc-500 font-light animate-fadeInUp" style={{ animationDelay: '0.1s' }}></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 dark:border-gray-600 transition-all input-interactive animate-fadeInUp"
                      style={{ animationDelay: '0.2s', boxShadow: 'none' }}
                      value={editName}
                      placeholder="Name"
                      onChange={e => setEditName(e.target.value)}
                    />
                    <label className="text-[12px] text-zinc-500 font-light"></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 dark:border-gray-600 transition-all"
                      value={editPhone}
                      placeholder="Phone Number"
                      onChange={e => setEditPhone(e.target.value)}
                      style={{boxShadow: 'none'}}
                    />
                    <label className="text-[12px] text-zinc-500 font-light"></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 dark:border-gray-600 transition-all"
                      value={editAddress}
                      placeholder="Address"
                      onChange={e => setEditAddress(e.target.value)}
                      style={{boxShadow: 'none'}}
                    />
                    <label className="text-[12px] text-zinc-500 font-light"></label>
                    <input
                      className="w-full border-b border-[#9ED3FF] bg-transparent px-1 py-2 text-[12px] font-light outline-none focus:border-sky-400 dark:border-gray-600 transition-all"
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

            <div className="text-zinc-500 mt-1 text-[12px] font-light w-full pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>{customerProfile.email}</div>
            <div className="flex items-center gap-2 text-zinc-500 mt-2 text-[12px] font-light w-full pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}><MapPin className="h-2.5 w-2.5"/> {customerProfile.address || 'Kuje, Abuja, Nigeria'}</div>
            <div className="flex items-center gap-2 text-zinc-500 mt-1 text-[12px] font-light w-full" ><Phone className="h-2.5 w-2.5"/> {customerProfile.phone || 'phone number missing'}</div>
          </div>

          {/*<div>
            <button onClick={() => { logout(); window.location.href = '/auth/landing'; }} className="rounded-full border border-red-300 dark:border-gray-600 text-red-600 px-3 py-1 inline-flex text-[12px] items-center gap-2"><LogOut className="h-4 w-4"/> Log Out</button>
          </div>*/}
        </div>

        {/* Right column: Activity and Prescriptions stack */}
        <div className="space-y-6">
          <div className="rounded-3xl border bg-[#F7F7F7] dark:bg-gray-800 border-[#36A5FF] dark:border-gray-600 p-4 flex flex-col items-start">
            <div className="text-[18px] font-light font-poppins text-black dark:text-white mb-2 tracking-tight">My Activity</div>
            <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
              <span className="text-[12px] text-zinc-500 font-light">Items in Cart</span>
              <span className="text-[12px] text-sky-600 font-medium">{cartCount ?? 0}</span>
            </div>
            <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
              <span className="text-[12px] text-zinc-500 font-light">Active Chats</span>
              <span className="text-[12px] text-sky-600 font-medium">{activeChats ?? 0}</span>
            </div>
            <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
              <span className="text-[12px] text-sky-500 font-light">Saved Items</span>
              <button 
                className="text-[12px] text-sky-600 font-medium hover:underline"
                onClick={() => setShowWishlist(true)}
              >
                {(wishlist?.length ?? 0) + (bookmarkedVendors?.length ?? 0)}
              </button>
            </div>
            <div className="w-full flex items-center justify-between mt-3 mb-1">
              <span className="text-[14px] font-light text-zinc-800 dark:text-zinc-200">Drugs Bought</span>
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
                <div className="bg-white dark:bg-gray-800 border border-[#36A5FF] dark:border-gray-600 rounded-3xl p-5 w-[90vw] max-w-sm shadow-xl">
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

            {/* Modal for saved items (Products & Vendors) */}
            {showWishlist && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
                <div className="bg-white dark:bg-gray-800 border border-[#36A5FF] dark:border-gray-600 rounded-3xl p-5 w-[90vw] max-w-md shadow-xl">
                  <div className="text-[18px] font-light font-poppins text-sky-600 dark:text-sky-400 mb-4 tracking-tight">My Saved Items</div>
                  
                  {/* Tab Headers */}
                  <div className="flex border-b border-gray-200 dark:border-gray-600 dark:border-gray-600 mb-4">
                    <button
                      className={`px-4 py-2 text-[14px] font-medium transition-colors ${
                        activeTab === 'products'
                          ? 'text-sky-600 border-b-2 border-sky-600 dark:border-gray-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('products')}
                    >
                      Products ({wishlist?.length ?? 0})
                    </button>
                    <button
                      className={`px-4 py-2 text-[14px] font-medium transition-colors ${
                        activeTab === 'vendors'
                          ? 'text-sky-600 border-b-2 border-sky-600 dark:border-gray-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setActiveTab('vendors')}
                    >
                      Vendors ({bookmarkedVendors?.length ?? 0})
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
                    {activeTab === 'products' ? (
                      wishlist?.length > 0 ? (
                        wishlist.map((item) => (
                          <div key={item.id} className="w-full flex items-center pb-3 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
                            <div className="flex items-center gap-3 w-full">
                              {/* Product Image */}
                              <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {item.productData?.image ? (
                                  <img 
                                    src={item.productData.image} 
                                    alt={item.productData?.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xs font-medium">
                                    {item.productData?.name?.[0] || 'P'}
                                  </span>
                                )}
                              </div>
                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-gray-800 truncate">
                                  {item.productData?.name || 'Unknown Product'}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {item.productData?.pharmacyName || 'Unknown Pharmacy'}
                                </div>
                                <div className="text-[12px] text-sky-600 font-medium">
                                  ₦{item.productData?.price || '0'}
                                </div>
                              </div>
                              {/* View Button */}
                              <button
                                className="px-3 py-1 bg-sky-100 text-sky-600 rounded-full text-[10px] font-medium hover:bg-sky-200 transition-colors"
                                onClick={() => {
                                  navigate(`/product/${item.productId}`);
                                  setShowWishlist(false);
                                }}
                              >
                                View
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">💝</div>
                          <div className="text-[14px] font-light">No products saved</div>
                          <div className="text-[12px] text-gray-400 mt-1">Start adding products you like!</div>
                        </div>
                      )
                    ) : (
                      bookmarkedVendors?.length > 0 ? (
                        bookmarkedVendors.map((bookmark) => (
                          <div key={bookmark.id} className="w-full flex items-center pb-3 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
                            <div className="flex items-center gap-3 w-full">
                              {/* Vendor Avatar */}
                              <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sky-600 text-lg font-medium">
                                  {bookmark.vendorData?.name?.[0] || 'V'}
                                </span>
                              </div>
                              {/* Vendor Details */}
                              <div className="flex-1 min-w-0">
                                <div className="text-[13px] font-medium text-gray-800 truncate">
                                  {bookmark.vendorData?.name || 'Unknown Vendor'}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                  {bookmark.vendorData?.address || 'Address not available'}
                                </div>
                                <div className="text-[11px] text-gray-500">
                                  {bookmark.vendorData?.phone || ''}
                                </div>
                              </div>
                              {/* Visit Button */}
                              <button
                                className="px-3 py-1 bg-sky-100 text-sky-600 rounded-full text-[10px] font-medium hover:bg-sky-200 transition-colors"
                                onClick={() => {
                                  navigate(`/vendor/${bookmark.vendorId}`);
                                  setShowWishlist(false);
                                }}
                              >
                                Visit
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">🔖</div>
                          <div className="text-[14px] font-light">No vendors bookmarked</div>
                          <div className="text-[12px] text-gray-400 mt-1">Bookmark vendors you like!</div>
                        </div>
                      )
                    )}
                  </div>

                  <button 
                    className="mt-4 px-4 py-2 rounded-full bg-sky-600 text-white text-[12px] font-light w-full" 
                    onClick={() => {
                      setShowWishlist(false);
                      setActiveTab('products'); // Reset to products tab
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border bg-[#F7F7F7] dark:bg-gray-800 border-[#36A5FF] dark:border-gray-600 p-4 flex flex-col items-start">
            <MyPrescriptionsSection />
          </div>
        </div>
      </div>
       <div>
            <button onClick={() => { logout(); window.location.href = '/auth/landing'; }} className="mt-10 rounded-full border border-red-300 dark:border-gray-600 text-red-600 px-3 py-1 inline-flex text-[12px] items-center gap-2"><LogOut className="h-4 w-4"/> Log Out</button>
          </div>
      </div>
    </>
  );
}