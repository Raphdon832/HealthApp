import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth';
import { collection, updateDoc, doc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';

const drugCategories = [
  'Controlled Substances',
  'Over-the-counter',
  'Prescription',
  'Syrup',
  'Target System',
  'Therapeutic'
];

const dashboardTabs = [
  { key: 'users', label: 'Users' },
  { key: 'products', label: 'Products' },
  { key: 'prescriptions', label: 'Prescriptions' },
  { key: 'orders', label: 'Orders' },
  { key: 'carts', label: 'Carts' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'moderation', label: 'Moderation' },
  { key: 'export', label: 'Export' }
];

const TABS_PER_PAGE = 3;

export default function SuperuserDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [userForm, setUserForm] = useState({ displayName: '', email: '', address: '', phone: '', role: '', suspended: false });
  const [productForm, setProductForm] = useState({ name: '', image: '', description: '', stock: '', price: '', sku: '', category: '' });
  const [activeTab, setActiveTab] = useState('users');
  const [userModalTab, setUserModalTab] = useState('profile');
  const [userPrescriptions, setUserPrescriptions] = useState([]);
  const [userOrders, setUserOrders] = useState([]);
  const [userCart, setUserCart] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [tabPage, setTabPage] = useState(0);
  const tabContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const unsubUsers = onSnapshot(collection(db, 'users'), (usersSnap) => {
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubProducts = onSnapshot(collection(db, 'products'), (productsSnap) => {
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubPrescriptions = onSnapshot(collection(db, 'prescriptions'), (presSnap) => {
      setPrescriptions(presSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubOrders = onSnapshot(collection(db, 'orders'), (ordersSnap) => {
      setOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubCarts = onSnapshot(collection(db, 'carts'), (cartsSnap) => {
      setCarts(cartsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubUsers();
      unsubProducts();
      unsubPrescriptions();
      unsubOrders();
      unsubCarts();
    };
  }, [user]);

  // Prefill user form and fetch user data when editingUser changes
  useEffect(() => {
    let unsubPres = null, unsubOrders = null, unsubCart = null;
    if (editingUser && editingUser.id) {
      setUserForm({
        displayName: editingUser.displayName || '',
        email: editingUser.email || '',
        address: editingUser.address || '',
        phone: editingUser.phone || '',
        role: editingUser.role || '',
        suspended: editingUser.role === 'suspended',
      });
      // Prescriptions
      unsubPres = onSnapshot(query(collection(db, 'prescriptions'), where('userId', '==', editingUser.id)), (presSnap) => {
        setUserPrescriptions(presSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Orders
      unsubOrders = onSnapshot(query(collection(db, 'orders'), where('userId', '==', editingUser.id)), (ordersSnap) => {
        setUserOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      // Cart
      unsubCart = onSnapshot(query(collection(db, 'carts'), where('userId', '==', editingUser.id)), (cartSnap) => {
        setUserCart(cartSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    } else {
      setUserPrescriptions([]);
      setUserOrders([]);
      setUserCart([]);
    }
    return () => {
      if (unsubPres) unsubPres();
      if (unsubOrders) unsubOrders();
      if (unsubCart) unsubCart();
    };
  }, [editingUser && editingUser.id]);

  // Prefill product form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setProductForm({
        name: editingProduct.name || '',
        image: editingProduct.image || '',
        description: editingProduct.description || '',
        stock: editingProduct.stock || '',
        price: editingProduct.price || '',
        sku: editingProduct.sku || '',
        category: editingProduct.category || '',
      });
    }
  }, [editingProduct]);

  // Scroll to active tab when changed
  useEffect(() => {
    if (!tabContainerRef.current) return;
    const activeIdx = dashboardTabs.findIndex(tab => tab.key === activeTab);
    const page = Math.floor(activeIdx / TABS_PER_PAGE);
    setTabPage(page);
    // Scroll to page
    tabContainerRef.current.scrollTo({
      left: page * tabContainerRef.current.offsetWidth,
      behavior: 'smooth'
    });
  }, [activeTab]);

  if (!user) return <LoadingSkeleton lines={4} className="my-8" />;
  if (loading) return <LoadingSkeleton lines={8} className="my-8" />;

  return (
    <div className="pt-10 pb-28 w-full max-w-4xl mx-auto px-4 min-h-screen flex flex-col">
      {/* Horizontal Tabs */}
      <div className="relative mb-8 flex items-center justify-center">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-sky-100 shadow text-sky-500 hover:bg-sky-100 transition absolute left-0 top-1/2 -translate-y-1/2"
          style={{display: tabPage > 0 ? 'flex' : 'none'}}
          onClick={() => setTabPage(p => Math.max(0, p-1))}
          aria-label="Previous tabs"
        >
          <span className="text-lg">&lt;</span>
        </button>
        <div className="flex gap-2 px-8 w-full justify-center">
          {dashboardTabs.slice(tabPage*TABS_PER_PAGE, (tabPage+1)*TABS_PER_PAGE).map(tab => (
            <button
              key={tab.key}
              className={`min-w-[110px] px-3 py-2 font-semibold tracking-wide text-[13px] rounded-t-lg transition-colors duration-150
                ${activeTab===tab.key?'border-b-2 border-sky-500 text-sky-500 bg-sky-50':'text-zinc-400 bg-white hover:bg-sky-50'}`}
              onClick={()=>{setActiveTab(tab.key);setSelectedItems([]);}}
            >{tab.label}</button>
          ))}
        </div>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-sky-100 shadow text-sky-500 hover:bg-sky-100 transition absolute right-0 top-1/2 -translate-y-1/2"
          style={{display: tabPage < Math.ceil(dashboardTabs.length/TABS_PER_PAGE)-1 ? 'flex' : 'none'}}
          onClick={() => setTabPage(p => Math.min(Math.ceil(dashboardTabs.length/TABS_PER_PAGE)-1, p+1))}
          aria-label="Next tabs"
        >
          <span className="text-lg">&gt;</span>
        </button>
      </div>
      {/* Users Section */}
      {activeTab==='users' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[15px] font-semibold tracking-wide text-sky-500">Users</div>
            <button className="px-3 py-1 rounded bg-sky-500 text-white text-[12px] font-medium shadow hover:bg-sky-600" onClick={()=>{/* open create user modal */}}>Add User</button>
          </div>
          <div className="space-y-2">
            {(showAllUsers ? users : users.slice(0,3)).map(u => (
              <div key={u.id} className="border border-sky-100 rounded-lg p-3 flex items-center justify-between bg-white group hover:shadow-md transition cursor-pointer">
                <input type="checkbox" checked={selectedItems.includes(u.id)} onChange={e=>setSelectedItems(sel=>e.target.checked?[...sel,u.id]:sel.filter(id=>id!==u.id))} />
                <div className="flex-1" onClick={(e)=>{if(e.target.tagName!=='BUTTON')setEditingUser(u);}}>
                  <div className="font-semibold text-[13px] text-sky-500">{u.displayName || u.email}</div>
                  <div className="text-[12px] text-zinc-500">{u.email}</div>
                  <div className="text-[11px] text-zinc-400">Role: {u.role || 'customer'}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-sky-100 text-sky-500 text-[12px] font-medium" onClick={async(e)=>{e.stopPropagation();await updateDoc(doc(db,'users',u.id),{role:'suspended'});}}>Suspend</button>
                  <button className="px-2 py-1 rounded bg-red-100 text-red-600 text-[12px] font-medium" onClick={async(e)=>{e.stopPropagation();await deleteDoc(doc(db,'users',u.id));}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {/* Batch actions */}
          {selectedItems.length>0 && (
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-red-600 text-white text-[12px] font-medium" onClick={async()=>{
                for(const id of selectedItems){await deleteDoc(doc(db,'users',id));}
                setSelectedItems([]);
              }}>Delete Selected</button>
              <button className="px-3 py-1 rounded bg-sky-500 text-white text-[12px] font-medium" onClick={async()=>{
                for(const id of selectedItems){await updateDoc(doc(db,'users',id),{role:'suspended'});}
                setSelectedItems([]);
              }}>Suspend Selected</button>
            </div>
          )}
          {users.length > 3 && !showAllUsers && (
            <button className="mt-2 px-3 py-1 rounded-full bg-sky-100 text-sky-500 text-[12px] font-medium" onClick={()=>setShowAllUsers(true)}>See more</button>
          )}
          {users.length > 3 && showAllUsers && (
            <button className="mt-2 px-3 py-1 rounded-full bg-sky-100 text-sky-500 text-[12px] font-medium" onClick={()=>setShowAllUsers(false)}>See less</button>
          )}
        </div>
      )}
      {/* Products Section */}
      {activeTab==='products' && (
        <div className="mb-8">
          <div className="text-xl font-semibold mb-2">Products</div>
          <div className="space-y-2">
            {(showAllProducts ? products : products.slice(0,3)).map(p => (
              <div key={p.id} className="border border-sky-100 rounded-lg p-3 flex items-center justify-between bg-white group hover:shadow-md transition cursor-pointer" 
                onClick={(e)=>{
                  if (e.target.tagName !== 'BUTTON') setEditingProduct(p);
                }}>
                <div className="flex-1">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-sm text-zinc-500">{p.category}</div>
                  <div className="text-xs text-zinc-400">Vendor: {p.vendorId}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-sky-100 text-sky-500 text-[12px] font-medium" onClick={async (e) => {
                    e.stopPropagation();
                    await updateDoc(doc(db, 'products', p.id), { approved: true });
                    setProducts(products.map(pr => pr.id === p.id ? { ...pr, approved: true } : pr));
                  }}>Approve</button>
                  <button className="px-2 py-1 rounded bg-red-100 text-red-600 text-[12px] font-medium" onClick={async (e) => {
                    e.stopPropagation();
                    await deleteDoc(doc(db, 'products', p.id));
                    setProducts(products.filter(pr => pr.id !== p.id));
                  }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
          {products.length > 3 && !showAllProducts && (
            <button className="mt-2 px-3 py-1 rounded-full bg-sky-100 text-sky-500 text-[12px] font-medium" onClick={()=>setShowAllProducts(true)}>See more</button>
          )}
          {products.length > 3 && showAllProducts && (
            <button className="mt-2 px-3 py-1 rounded-full bg-sky-100 text-sky-500 text-[12px] font-medium" onClick={()=>setShowAllProducts(false)}>See less</button>
          )}
        </div>
      )}
      {/* Prescriptions Section */}
      {activeTab==='prescriptions' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-semibold">Prescriptions</div>
            <button className="px-3 py-1 rounded bg-sky-500 text-white text-[12px] font-medium shadow hover:bg-sky-600" onClick={()=>{/* open create prescription modal */}}>Add Prescription</button>
          </div>
          <div className="space-y-2">
            {prescriptions.map(pres => (
              <div key={pres.id} className="border border-sky-100 rounded-lg p-3 flex items-center justify-between bg-white group hover:shadow-md transition cursor-pointer">
                <input type="checkbox" checked={selectedItems.includes(pres.id)} onChange={e=>setSelectedItems(sel=>e.target.checked?[...sel,pres.id]:sel.filter(id=>id!==pres.id))} />
                <div className="flex-1" onClick={()=>{/* open prescription modal */}}>
                  <div className="font-bold">{pres.title || pres.id}</div>
                  <div className="text-xs text-zinc-500">{pres.createdAt ? new Date(pres.createdAt.seconds*1000).toLocaleString() : ''}</div>
                  <div className="text-xs text-zinc-400">Drugs: {Array.isArray(pres.drugs) ? pres.drugs.join(', ') : pres.drugs}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs" onClick={async(e)=>{e.stopPropagation();await deleteDoc(doc(db,'prescriptions',pres.id));}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {selectedItems.length>0 && (
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-red-600 text-white text-xs" onClick={async()=>{
                for(const id of selectedItems){await deleteDoc(doc(db,'prescriptions',id));}
                setSelectedItems([]);
              }}>Delete Selected</button>
            </div>
          )}
        </div>
      )}
      {/* Orders Section */}
      {activeTab==='orders' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-semibold">Orders</div>
          </div>
          <div className="space-y-2">
            {orders.map(order => (
              <div key={order.id} className="border border-sky-100 rounded-lg p-3 flex items-center justify-between bg-white group hover:shadow-md transition cursor-pointer">
                <input type="checkbox" checked={selectedItems.includes(order.id)} onChange={e=>setSelectedItems(sel=>e.target.checked?[...sel,order.id]:sel.filter(id=>id!==order.id))} />
                <div className="flex-1" onClick={()=>{/* open order modal */}}>
                  <div className="font-bold">Order #{order.id}</div>
                  <div className="text-xs text-zinc-500">{order.createdAt ? new Date(order.createdAt.seconds*1000).toLocaleString() : ''}</div>
                  <div className="text-xs text-zinc-400">Products: {Array.isArray(order.products) ? order.products.map(p=>p.name).join(', ') : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs" onClick={async(e)=>{e.stopPropagation();await deleteDoc(doc(db,'orders',order.id));}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {selectedItems.length>0 && (
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-red-600 text-white text-xs" onClick={async()=>{
                for(const id of selectedItems){await deleteDoc(doc(db,'orders',id));}
                setSelectedItems([]);
              }}>Delete Selected</button>
            </div>
          )}
        </div>
      )}
      {/* Carts Section */}
      {activeTab==='carts' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-semibold">Carts</div>
          </div>
          <div className="space-y-2">
            {carts.map(cart => (
              <div key={cart.id} className="border border-sky-100 rounded-lg p-3 flex items-center justify-between bg-white group hover:shadow-md transition cursor-pointer">
                <input type="checkbox" checked={selectedItems.includes(cart.id)} onChange={e=>setSelectedItems(sel=>e.target.checked?[...sel,cart.id]:sel.filter(id=>id!==cart.id))} />
                <div className="flex-1" onClick={()=>{/* open cart modal */}}>
                  <div className="font-bold">Cart #{cart.id}</div>
                  <div className="text-xs text-zinc-500">{cart.updatedAt ? new Date(cart.updatedAt.seconds*1000).toLocaleString() : ''}</div>
                  <div className="text-xs text-zinc-400">Products: {Array.isArray(cart.products) ? cart.products.map(p=>p.name).join(', ') : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs" onClick={async(e)=>{e.stopPropagation();await deleteDoc(doc(db,'carts',cart.id));}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {selectedItems.length>0 && (
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-red-600 text-white text-xs" onClick={async()=>{
                for(const id of selectedItems){await deleteDoc(doc(db,'carts',id));}
                setSelectedItems([]);
              }}>Delete Selected</button>
            </div>
          )}
        </div>
      )}
      {/* Add more tabs for analytics, moderation, etc. */}
      {activeTab==='analytics' && (
        <div className="mb-8">
          <div className="text-xl font-semibold mb-4">Analytics</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-xs text-zinc-600">Users</div>
            </div>
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-xs text-zinc-600">Products</div>
            </div>
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-2xl font-bold">{prescriptions.length}</div>
              <div className="text-xs text-zinc-600">Prescriptions</div>
            </div>
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-2xl font-bold">{orders.length}</div>
              <div className="text-xs text-zinc-600">Orders</div>
            </div>
            <div className="bg-yellow-100 rounded p-4 text-center">
              <div className="text-2xl font-bold">{carts.length}</div>
              <div className="text-xs text-zinc-600">Carts</div>
            </div>
          </div>
          {/* Placeholder for charts, can use chart libraries for more advanced analytics */}
          <div className="mt-4 text-zinc-500 text-xs">Charts and advanced analytics coming soon.</div>
        </div>
      )}
      {activeTab==='moderation' && (
        <div className="mb-8">
          <div className="text-xl font-semibold mb-4">Moderation</div>
          {/* Placeholder: List flagged items, batch delete */}
          <div className="text-zinc-500 mb-4">No flagged items yet. Moderation features coming soon.</div>
          {/* Example batch delete UI */}
          {selectedItems.length>0 && (
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-red-600 text-white text-xs" onClick={async()=>{
                for(const id of selectedItems){/* await deleteDoc(doc(db,'flagged',id)); */}
                setSelectedItems([]);
              }}>Delete Selected</button>
            </div>
          )}
        </div>
      )}
      {activeTab==='export' && (
        <div className="mb-8">
          <div className="text-xl font-semibold mb-4">Export Data</div>
          <div className="space-y-2">
            <button className="px-4 py-2 rounded bg-sky-500 text-white font-medium" onClick={()=>exportTSV(users,'users')}>Export Users TSV</button>
            <button className="px-4 py-2 rounded bg-sky-500 text-white font-medium" onClick={()=>exportTSV(products,'products')}>Export Products TSV</button>
            <button className="px-4 py-2 rounded bg-sky-500 text-white font-medium" onClick={()=>exportTSV(prescriptions,'prescriptions')}>Export Prescriptions TSV</button>
            <button className="px-4 py-2 rounded bg-sky-500 text-white font-medium" onClick={()=>exportTSV(orders,'orders')}>Export Orders TSV</button>
            <button className="px-4 py-2 rounded bg-sky-500 text-white font-medium" onClick={()=>exportTSV(carts,'carts')}>Export Carts TSV</button>
          </div>
        </div>
      )}
      <div className="mt-6">
        <button
          onClick={async () => {
            await logout();
            window.location.href = '/auth/landing';
          }}
          className="rounded-full border border-red-300 text-red-600 px-3 py-1 inline-flex text-[12px] items-center gap-2"
        >
          Log Out
        </button>
      </div>
      {/* User Edit Modal with Tabs */}
      {editingUser && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1000,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full border border-sky-100">
            <div className="text-[16px] font-semibold tracking-wide text-sky-500 mb-4">Edit User</div>
            <div className="space-y-3">
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={userForm.displayName} onChange={e=>setUserForm(f=>({...f,displayName:e.target.value}))} placeholder="Name" />
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={userForm.email} onChange={e=>setUserForm(f=>({...f,email:e.target.value}))} placeholder="Email" />
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={userForm.address} onChange={e=>setUserForm(f=>({...f,address:e.target.value}))} placeholder="Address" />
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={userForm.phone} onChange={e=>setUserForm(f=>({...f,phone:e.target.value}))} placeholder="Phone Number" />
              <select className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500" value={userForm.role} onChange={e=>setUserForm(f=>({...f,role:e.target.value}))}>
                <option value="customer">Customer</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="superuser">Superuser</option>
                <option value="suspended">Suspended</option>
              </select>
              <div className="flex gap-2 mt-4">
                <button className="px-4 py-2 rounded bg-sky-500 text-white font-medium text-[13px] shadow hover:bg-sky-600" onClick={async()=>{
                  await updateDoc(doc(db,'users',editingUser.id),{
                    displayName:userForm.displayName,
                    email:userForm.email,
                    address:userForm.address,
                    phone:userForm.phone,
                    role:userForm.role
                  });
                  setUsers(users.map(u=>u.id===editingUser.id?{...u,...userForm}:u));
                  setEditingUser(null);
                }}>Save</button>
                {userForm.role==='suspended' ? (
                  <button className="px-4 py-2 rounded bg-green-500 text-white font-medium text-[13px] shadow hover:bg-green-600" onClick={async()=>{
                    await updateDoc(doc(db,'users',editingUser.id),{role:'customer'});
                    setUsers(users.map(u=>u.id===editingUser.id?{...u,role:'customer'}:u));
                    setEditingUser(null);
                  }}>Lift Suspension</button>
                ) : (
                  <button className="px-4 py-2 rounded bg-red-500 text-white font-medium text-[13px] shadow hover:bg-red-600" onClick={async()=>{
                    await updateDoc(doc(db,'users',editingUser.id),{role:'suspended'});
                    setUsers(users.map(u=>u.id===editingUser.id?{...u,role:'suspended'}:u));
                    setEditingUser(null);
                  }}>Suspend</button>
                )}
                <button className="px-4 py-2 rounded bg-zinc-100 text-zinc-700 font-medium text-[13px] shadow hover:bg-zinc-200" onClick={()=>setEditingUser(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Product Edit Modal */}
      {editingProduct && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1000,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full border border-sky-100">
            <div className="text-[16px] font-semibold tracking-wide text-sky-500 mb-4">Edit Product</div>
            <div className="space-y-4">
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={productForm.name} onChange={e=>setProductForm(f=>({...f,name:e.target.value}))} placeholder="Product Name" />
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={productForm.sku} onChange={e=>setProductForm(f=>({...f,sku:e.target.value}))} placeholder="SKU" />
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={productForm.price} onChange={e=>setProductForm(f=>({...f,price:e.target.value}))} placeholder="Price" />
              <input className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={productForm.stock} onChange={e=>setProductForm(f=>({...f,stock:e.target.value}))} placeholder="Stock" />
              <textarea className="w-full border-b border-sky-100 text-[13px] py-2 focus:outline-none focus:border-sky-500 placeholder:text-zinc-400" value={productForm.description} onChange={e=>setProductForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows="2"></textarea>
              <div className="flex gap-2 mt-4">
                <button className="px-4 py-2 rounded bg-sky-500 text-white font-medium text-[13px] shadow hover:bg-sky-600" onClick={async()=>{
                  await updateDoc(doc(db,'products',editingProduct.id),{
                    name:productForm.name,
                    sku:productForm.sku,
                    price:productForm.price,
                    stock:productForm.stock,
                    description:productForm.description
                  });
                  setProducts(products.map(p=>p.id===editingProduct.id?{...p,...productForm}:p));
                  setEditingProduct(null);
                }}>Save</button>
                <button className="px-4 py-2 rounded bg-zinc-100 text-zinc-700 font-medium text-[13px] shadow hover:bg-zinc-200" onClick={()=>setEditingProduct(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
