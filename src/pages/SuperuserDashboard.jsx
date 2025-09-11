import { useEffect, useState } from 'react';
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

  if (!user) return <LoadingSkeleton lines={4} className="my-8" />;
  if (loading) return <LoadingSkeleton lines={8} className="my-8" />;

  return (
    <div className="pt-10 pb-28 w-full max-w-4xl mx-auto px-4 min-h-screen flex flex-col">
      {/* Horizontal Tabs */}
      <div className="flex gap-4 mb-8 border-b">
        {dashboardTabs.map(tab => (
          <button key={tab.key} className={`px-4 py-2 font-semibold ${activeTab===tab.key?'border-b-2 border-yellow-600 text-yellow-700':'text-zinc-500'}`} onClick={()=>{setActiveTab(tab.key);setSelectedItems([]);}}>{tab.label}</button>
        ))}
      </div>
      {/* Users Section */}
      {activeTab==='users' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-semibold">Users</div>
            <button className="px-3 py-1 rounded bg-yellow-600 text-white text-xs" onClick={()=>{/* open create user modal */}}>Add User</button>
          </div>
          <div className="space-y-2">
            {(showAllUsers ? users : users.slice(0,3)).map(u => (
              <div key={u.id} className="border rounded p-3 flex items-center justify-between bg-white group hover:shadow-lg transition cursor-pointer">
                <input type="checkbox" checked={selectedItems.includes(u.id)} onChange={e=>setSelectedItems(sel=>e.target.checked?[...sel,u.id]:sel.filter(id=>id!==u.id))} />
                <div className="flex-1" onClick={(e)=>{if(e.target.tagName!=='BUTTON')setEditingUser(u);}}>
                  <div className="font-bold">{u.displayName || u.email}</div>
                  <div className="text-sm text-zinc-500">{u.email}</div>
                  <div className="text-xs text-zinc-400">Role: {u.role || 'customer'}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs" onClick={async(e)=>{e.stopPropagation();await updateDoc(doc(db,'users',u.id),{role:'suspended'});}}>Suspend</button>
                  <button className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs" onClick={async(e)=>{e.stopPropagation();await deleteDoc(doc(db,'users',u.id));}}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {/* Batch actions */}
          {selectedItems.length>0 && (
            <div className="flex gap-2 mt-2">
              <button className="px-3 py-1 rounded bg-red-600 text-white text-xs" onClick={async()=>{
                for(const id of selectedItems){await deleteDoc(doc(db,'users',id));}
                setSelectedItems([]);
              }}>Delete Selected</button>
              <button className="px-3 py-1 rounded bg-yellow-600 text-white text-xs" onClick={async()=>{
                for(const id of selectedItems){await updateDoc(doc(db,'users',id),{role:'suspended'});}
                setSelectedItems([]);
              }}>Suspend Selected</button>
            </div>
          )}
          {users.length > 3 && !showAllUsers && (
            <button className="mt-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs" onClick={()=>setShowAllUsers(true)}>See more</button>
          )}
          {users.length > 3 && showAllUsers && (
            <button className="mt-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs" onClick={()=>setShowAllUsers(false)}>See less</button>
          )}
        </div>
      )}
      {/* Products Section */}
      {activeTab==='products' && (
        <div className="mb-8">
          <div className="text-xl font-semibold mb-2">Products</div>
          <div className="space-y-2">
            {(showAllProducts ? products : products.slice(0,3)).map(p => (
              <div key={p.id} className="border rounded p-3 flex items-center justify-between bg-white group hover:shadow-lg transition cursor-pointer" 
                onClick={(e)=>{
                  if (e.target.tagName !== 'BUTTON') setEditingProduct(p);
                }}>
                <div className="flex-1">
                  <div className="font-bold">{p.name}</div>
                  <div className="text-sm text-zinc-500">{p.category}</div>
                  <div className="text-xs text-zinc-400">Vendor: {p.vendorId}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs" onClick={async (e) => {
                    e.stopPropagation();
                    await updateDoc(doc(db, 'products', p.id), { approved: true });
                    setProducts(products.map(pr => pr.id === p.id ? { ...pr, approved: true } : pr));
                  }}>Approve</button>
                  <button className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs" onClick={async (e) => {
                    e.stopPropagation();
                    await deleteDoc(doc(db, 'products', p.id));
                    setProducts(products.filter(pr => pr.id !== p.id));
                  }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
          {products.length > 3 && !showAllProducts && (
            <button className="mt-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs" onClick={()=>setShowAllProducts(true)}>See more</button>
          )}
          {products.length > 3 && showAllProducts && (
            <button className="mt-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs" onClick={()=>setShowAllProducts(false)}>See less</button>
          )}
        </div>
      )}
      {/* Prescriptions Section */}
      {activeTab==='prescriptions' && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xl font-semibold">Prescriptions</div>
            <button className="px-3 py-1 rounded bg-yellow-600 text-white text-xs" onClick={()=>{/* open create prescription modal */}}>Add Prescription</button>
          </div>
          <div className="space-y-2">
            {prescriptions.map(pres => (
              <div key={pres.id} className="border rounded p-3 flex items-center justify-between bg-white group hover:shadow-lg transition cursor-pointer">
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
              <div key={order.id} className="border rounded p-3 flex items-center justify-between bg-white group hover:shadow-lg transition cursor-pointer">
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
              <div key={cart.id} className="border rounded p-3 flex items-center justify-between bg-white group hover:shadow-lg transition cursor-pointer">
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
            <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={()=>exportTSV(users,'users')}>Export Users TSV</button>
            <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={()=>exportTSV(products,'products')}>Export Products TSV</button>
            <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={()=>exportTSV(prescriptions,'prescriptions')}>Export Prescriptions TSV</button>
            <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={()=>exportTSV(orders,'orders')}>Export Orders TSV</button>
            <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={()=>exportTSV(carts,'carts')}>Export Carts TSV</button>
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
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
            <div className="text-lg font-semibold mb-2">Edit User</div>
            {/* Modal Tabs */}
            <div className="flex gap-4 mb-4 border-b">
              <button className={`px-3 py-1 font-medium ${userModalTab==='profile'?'border-b-2 border-yellow-600 text-yellow-700':'text-zinc-500'}`} onClick={()=>setUserModalTab('profile')}>Profile</button>
              <button className={`px-3 py-1 font-medium ${userModalTab==='prescriptions'?'border-b-2 border-yellow-600 text-yellow-700':'text-zinc-500'}`} onClick={()=>setUserModalTab('prescriptions')}>Prescriptions</button>
              <button className={`px-3 py-1 font-medium ${userModalTab==='orders'?'border-b-2 border-yellow-600 text-yellow-700':'text-zinc-500'}`} onClick={()=>setUserModalTab('orders')}>Drugs Bought</button>
              <button className={`px-3 py-1 font-medium ${userModalTab==='cart'?'border-b-2 border-yellow-600 text-yellow-700':'text-zinc-500'}`} onClick={()=>setUserModalTab('cart')}>Cart</button>
            </div>
            {/* Tab Content */}
            {userModalTab==='profile' && (
              <div className="space-y-3">
                <input className="w-full border-b text-[13px] py-2" value={userForm.displayName} onChange={e=>setUserForm(f=>({...f,displayName:e.target.value}))} placeholder="Name" />
                <input className="w-full border-b text-[13px] py-2" value={userForm.email} onChange={e=>setUserForm(f=>({...f,email:e.target.value}))} placeholder="Email" />
                <input className="w-full border-b text-[13px] py-2" value={userForm.address} onChange={e=>setUserForm(f=>({...f,address:e.target.value}))} placeholder="Address" />
                <input className="w-full border-b text-[13px] py-2" value={userForm.phone} onChange={e=>setUserForm(f=>({...f,phone:e.target.value}))} placeholder="Phone Number" />
                <select className="w-full border-b text-[13px] py-2" value={userForm.role} onChange={e=>setUserForm(f=>({...f,role:e.target.value}))}>
                  <option value="customer">Customer</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="superuser">Superuser</option>
                  <option value="suspended">Suspended</option>
                </select>
                <div className="flex gap-2 mt-2">
                  <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={async()=>{
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
                    <button className="px-4 py-2 rounded bg-green-600 text-white font-medium" onClick={async()=>{
                      await updateDoc(doc(db,'users',editingUser.id),{role:'customer'});
                      setUsers(users.map(u=>u.id===editingUser.id?{...u,role:'customer'}:u));
                      setEditingUser(null);
                    }}>Lift Suspension</button>
                  ) : (
                    <button className="px-4 py-2 rounded bg-red-600 text-white font-medium" onClick={async()=>{
                      await updateDoc(doc(db,'users',editingUser.id),{role:'suspended'});
                      setUsers(users.map(u=>u.id===editingUser.id?{...u,role:'suspended'}:u));
                      setEditingUser(null);
                    }}>Suspend</button>
                  )}
                  <button className="px-4 py-2 rounded bg-zinc-200 text-zinc-700 font-medium" onClick={()=>setEditingUser(null)}>Cancel</button>
                </div>
              </div>
            )}
            {userModalTab==='prescriptions' && (
              <div>
                <div className="font-medium mb-2">Prescriptions</div>
                {userPrescriptions.length === 0 ? (
                  <div className="text-sm text-zinc-400">No prescriptions found.</div>
                ) : (
                  <ul className="space-y-2">
                    {userPrescriptions.map(pres => (
                      <li key={pres.id} className="border rounded p-2">
                        <div className="font-bold">{pres.title || pres.id}</div>
                        <div className="text-xs text-zinc-500">{pres.createdAt ? new Date(pres.createdAt.seconds*1000).toLocaleString() : ''}</div>
                        <div className="text-xs text-zinc-400">Drugs: {Array.isArray(pres.drugs) ? pres.drugs.join(', ') : pres.drugs}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {userModalTab==='orders' && (
              <div>
                <div className="font-medium mb-2">Drugs Bought</div>
                {userOrders.length === 0 ? (
                  <div className="text-sm text-zinc-400">No drugs bought.</div>
                ) : (
                  <ul className="space-y-2">
                    {userOrders
                      .flatMap(order => Array.isArray(order.products) ? order.products : [])
                      .map((product, idx) => (
                        <li key={product.id || idx} className="border rounded p-2">
                          <div className="font-bold">{product.name || product.title || product.id || 'Unnamed Drug'}</div>
                          {product.category && <div className="text-xs text-zinc-500">{product.category}</div>}
                          {product.price && <div className="text-xs text-zinc-400">Price: ₦{product.price}</div>}
                          {product.sku && <div className="text-xs text-zinc-400">SKU: {product.sku}</div>}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
            {userModalTab==='cart' && (
              <div>
                <div className="font-medium mb-2">Cart</div>
                {userCart.length === 0 ? (
                  <div className="text-sm text-zinc-400">Cart is empty.</div>
                ) : (
                  <ul className="space-y-2">
                    {userCart
                      .flatMap(cart => Array.isArray(cart.products) ? cart.products : [])
                      .map((product, idx) => (
                        <li key={product.id || idx} className="border rounded p-2">
                          <div className="font-bold">{product.name || product.title || product.id || 'Unnamed Drug'}</div>
                          {product.category && <div className="text-xs text-zinc-500">{product.category}</div>}
                          {product.price && <div className="text-xs text-zinc-400">Price: ₦{product.price}</div>}
                          {product.sku && <div className="text-xs text-zinc-400">SKU: {product.sku}</div>}
                        </li>
                      ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Product Edit Modal */}
      {editingProduct && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1000,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
            <div className="text-lg font-semibold mb-2">Edit Product</div>
            <div className="space-y-4">
              <input className="w-full border-b text-[13px] py-2" value={productForm.name} onChange={e=>setProductForm(f=>({...f,name:e.target.value}))} placeholder="Product Name" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.image} onChange={e=>setProductForm(f=>({...f,image:e.target.value}))} placeholder="Image URL" />
              <textarea className="w-full border-b text-[13px] py-2" value={productForm.description} onChange={e=>setProductForm(f=>({...f,description:e.target.value}))} placeholder="Description" rows={3}></textarea>
              <input className="w-full border-b text-[13px] py-2" value={productForm.stock} onChange={e=>setProductForm(f=>({...f,stock:e.target.value}))} placeholder="Stock" type="number" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.price} onChange={e=>setProductForm(f=>({...f,price:e.target.value}))} placeholder="Price" type="number" step="0.01" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.sku} onChange={e=>setProductForm(f=>({...f,sku:e.target.value}))} placeholder="SKU" />
              <select className="w-full border-b text-[13px] py-2" value={productForm.category} onChange={e=>setProductForm(f=>({...f,category:e.target.value}))}>
                {drugCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <div className="flex gap-2 mt-2">
                <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={async()=>{
                  await updateDoc(doc(db,'products',editingProduct.id),{
                    name:productForm.name,
                    image:productForm.image,
                    description:productForm.description,
                    stock:productForm.stock,
                    price:productForm.price,
                    sku:productForm.sku,
                    category:productForm.category
                  });
                  setProducts(products.map(p=>p.id===editingProduct.id?{...p,...productForm}:p));
                  setEditingProduct(null);
                }}>Save</button>
                <button className="px-4 py-2 rounded bg-zinc-200 text-zinc-700 font-medium" onClick={()=>setEditingProduct(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function exportTSV(data, name) {
  if (!data || !data.length) return;
  const keys = Object.keys(data[0]);
  // Helper to quote fields with tabs, newlines, or quotes
  const quoteField = v => {
    if (v == null) return '';
    const str = String(v);
    if (/[	\n\r"]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  };
  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const tsv = BOM + [keys.join('\t')].concat(
    data.map(row => keys.map(k => quoteField(row[k])).join('\t'))
  ).join('\n');
  const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.tsv`;
  a.click();
  URL.revokeObjectURL(url);
}
