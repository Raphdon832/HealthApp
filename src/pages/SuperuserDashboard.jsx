import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import LoadingSkeleton from '@/components/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/Modal';

export default function SuperuserDashboard() {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [userForm, setUserForm] = useState({ displayName: '', email: '', address: '', role: '', suspended: false });
  const [productForm, setProductForm] = useState({ name: '', image: '', description: '', stock: '', price: '', sku: '', category: '' });
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const productsSnap = await getDocs(collection(db, 'products'));
      setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setProducts(productsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }
    fetchData();
  }, [user]);

  // Prefill user form when editingUser changes
  useEffect(() => {
    if (editingUser) {
      setUserForm({
        displayName: editingUser.displayName || '',
        email: editingUser.email || '',
        address: editingUser.address || '',
        role: editingUser.role || '',
        suspended: editingUser.role === 'suspended',
      });
    }
  }, [editingUser]);
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
      <div className="text-[32px] font-bold text-yellow-700 mb-6">Superuser Dashboard</div>
      <div className="mb-8">
        <div className="text-xl font-semibold mb-2">Users</div>
        <div className="space-y-2">
          {(showAllUsers ? users : users.slice(0,3)).map(u => (
            <div key={u.id} className="border rounded p-3 flex items-center justify-between bg-white group hover:shadow-lg transition cursor-pointer" 
              onClick={(e)=>{
                // Only open modal if not clicking a button
                if (e.target.tagName !== 'BUTTON') setEditingUser(u);
              }}>
              <div className="flex-1">
                <div className="font-bold">{u.displayName || u.email}</div>
                <div className="text-sm text-zinc-500">{u.email}</div>
                <div className="text-xs text-zinc-400">Role: {u.role || 'customer'}</div>
              </div>
              <div className="flex gap-2">
                <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs" onClick={async (e) => {
                  e.stopPropagation();
                  await updateDoc(doc(db, 'users', u.id), { role: 'suspended' });
                  setUsers(users.map(us => us.id === u.id ? { ...us, role: 'suspended' } : us));
                }}>Suspend</button>
                <button className="px-2 py-1 rounded bg-red-100 text-red-700 text-xs" onClick={async (e) => {
                  e.stopPropagation();
                  await deleteDoc(doc(db, 'users', u.id));
                  setUsers(users.filter(us => us.id !== u.id));
                }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
        {users.length > 3 && !showAllUsers && (
          <button className="mt-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs" onClick={()=>setShowAllUsers(true)}>See more</button>
        )}
        {users.length > 3 && showAllUsers && (
          <button className="mt-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs" onClick={()=>setShowAllUsers(false)}>See less</button>
        )}
      </div>
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
      {/* Add more sections for prescriptions, analytics, moderation, etc. */}
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
      {/* User Edit Modal */}
      {editingUser && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1000,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
            <div className="text-lg font-semibold mb-2">Edit User</div>
            <div className="space-y-3">
              <input className="w-full border-b text-[13px] py-2" value={userForm.displayName} onChange={e=>setUserForm(f=>({...f,displayName:e.target.value}))} placeholder="Name" />
              <input className="w-full border-b text-[13px] py-2" value={userForm.email} onChange={e=>setUserForm(f=>({...f,email:e.target.value}))} placeholder="Email" />
              <input className="w-full border-b text-[13px] py-2" value={userForm.address} onChange={e=>setUserForm(f=>({...f,address:e.target.value}))} placeholder="Address" />
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
          </div>
        </div>
      )}
      {/* Product Edit Modal */}
      {editingProduct && (
        <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,zIndex:1000,background:'rgba(0,0,0,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md w-full">
            <div className="text-lg font-semibold mb-2">Edit Product</div>
            <div className="space-y-3">
              <input className="w-full border-b text-[13px] py-2" value={productForm.name} onChange={e=>setProductForm(f=>({...f,name:e.target.value}))} placeholder="Product Name" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.image} onChange={e=>setProductForm(f=>({...f,image:e.target.value}))} placeholder="Image URL" />
              <textarea className="w-full border rounded p-2 text-sm" rows={3} value={productForm.description} onChange={e=>setProductForm(f=>({...f,description:e.target.value}))} placeholder="Description" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.stock} onChange={e=>setProductForm(f=>({...f,stock:e.target.value}))} placeholder="Stock" type="number" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.price} onChange={e=>setProductForm(f=>({...f,price:e.target.value}))} placeholder="Price" type="number" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.sku} onChange={e=>setProductForm(f=>({...f,sku:e.target.value}))} placeholder="SKU" />
              <input className="w-full border-b text-[13px] py-2" value={productForm.category} onChange={e=>setProductForm(f=>({...f,category:e.target.value}))} placeholder="Category" />
              <div className="flex gap-2 mt-2">
                <button className="px-4 py-2 rounded bg-yellow-600 text-white font-medium" onClick={async()=>{
                  await updateDoc(doc(db,'products',editingProduct.id),{
                    name:productForm.name,
                    image:productForm.image,
                    description:productForm.description,
                    stock:Number(productForm.stock),
                    price:Number(productForm.price),
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
