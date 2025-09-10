import { useAuth } from '@/lib/auth';
import { MapPin, Phone } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { Pencil } from 'lucide-react';
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

  if (!user) {
    return <LoadingSkeleton lines={4} className="my-8" />;
  }

  return (
    <div className="pt-10 pb-28 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0 min-h-screen flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md pb-2 pt-4 -mx-4 sm:-mx-5 md:-mx-8 lg:-mx-12 xl:-mx-0 px-4 sm:px-5 md:px-8 lg:px-12 xl:px-0">
        <div className="text-[24px] sm:text-[30px] md:text-[36px] lg:text-[42px] font-light font-poppins leading-none">My<br/>Profile</div>
      </div>
      <div className="mt-8 rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start">
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
                      // Update phone number (if using phone auth, otherwise update Firestore)
                      // await updatePhoneNumber(user, editPhone); // Only for phone auth
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
      {/* My Activity Section */}
      <div className="mt-8 rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start">
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

      {/* My Prescriptions Section (Card) */}
      <div className="mt-8 rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start">
        <MyPrescriptionsSection />
      </div>

      <div className="mt-6">
        <button onClick={() => { logout(); window.location.href = '/auth/landing'; }} className="rounded-full border border-red-300 text-red-600 px-3 py-1 inline-flex text-[12px] items-center gap-2"><LogOut className="h-4 w-4"/> Log Out</button>
      </div>
    </div>
  );
}