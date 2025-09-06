import { useEffect, useState } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { listenProducts, removeProduct } from '@/lib/db';
import AddProductModal from '@/components/AddProductModal';
import BulkUploadModal from '@/components/BulkUploadModal';
import { LogOut, Download, Trash, MoreVertical } from 'lucide-react';
import jsPDF from 'jspdf';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function ProfilePharmacy({ onSwitchToCustomer }) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [productsSold, setProductsSold] = useState(0);
  const [activeChats, setActiveChats] = useState(0);
  const [reviews, setReviews] = useState(0);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editSKU, setEditSKU] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => { if (user) return listenProducts(setInventory, user.uid); }, [user]);
  useEffect(() => {
    if (!user) return;
    // Fetch products sold
    getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', user.uid))).then(snapshot => {
      let sold = 0;
      snapshot.forEach(doc => {
        const order = doc.data();
        sold += (order.items || []).reduce((sum, item) => sum + (item.count || 1), 0);
      });
      setProductsSold(sold);
    });
    // Fetch active chats
    getDocs(query(collection(db, 'threads'), where('vendorId', '==', user.uid))).then(snapshot => {
      setActiveChats(snapshot.size);
    });
    // Fetch reviews
    getDocs(query(collection(db, 'reviews'), where('pharmacyId', '==', user.uid))).then(snapshot => {
      setReviews(snapshot.size);
    });
  }, [user]);

  function downloadReport() {
    const docPDF = new jsPDF();
    docPDF.setFont('helvetica', 'normal');
    docPDF.setFontSize(16);
    docPDF.text('Pharmacy Profile Report', 20, 20);
    docPDF.setFontSize(12);
    docPDF.text(`Name: ${user?.displayName || 'Pharmacy'}`, 20, 35);
    docPDF.text(`Email: ${user?.email || ''}`, 20, 45);
    docPDF.text('Storefront Preview:', 20, 60);
    docPDF.text(`Inventory: ${inventory.length}`, 25, 70);
    docPDF.text(`Products Sold: ${productsSold}`, 25, 80);
    docPDF.text(`Active Chats: ${activeChats}`, 25, 90);
    docPDF.text(`Reviews: ${reviews}`, 25, 100);
    docPDF.save('pharmacy-profile-report.pdf');
  }

  function handleSaveProduct() {
    // Save product logic here
    setEditingProduct(null);
  }

  function handleDeleteProduct() {
    // Delete product logic here
    setEditingProduct(null);
  }

  // Prefill fields when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      setEditName(editingProduct.name || '');
      setEditCategory(editingProduct.category || '');
      setEditStock(editingProduct.stock || '');
      setEditSKU(editingProduct.sku || '');
      setEditPrice(editingProduct.price || '');
    }
  }, [editingProduct]);

  return (
    <div className="pt-10 pb-28 max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto px-5 md:px-8 lg:px-12 xl:px-0 w-full min-h-screen flex flex-col">
      <div className="text-[30px] font-light font-poppins leading-none">My<br/>Profile</div>
      <div className="mt-8 rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start relative">
        <div className="mb-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="h-16 w-16 rounded-full object-cover border border-[#9ED3FF] shadow" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-[#E3F3FF] flex items-center justify-center border border-[#9ED3FF] shadow">
              <span className="text-sky-600 text-2xl font-light">{user?.displayName?.charAt(0) || 'P'}</span>
            </div>
          )}
        </div>
        <div className="text-3xl font-light font-poppins text-sky-600 mb-1 tracking-tight">{user?.displayName || 'Pharmacy'}</div>
        <div className="w-full border-b mb-2" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}></div>
        <div className="text-[13px] text-zinc-500 font-light mb-1">{user?.email}</div>
        <div className="flex items-center gap-2 text-zinc-500 text-[13px] font-light"><Clock className="h-4 w-4"/> 25 mins to HMedix Pharmacy</div>
      </div>
      {/* Storefront Preview Section */}
      <div className="mt-8 rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 flex flex-col items-start relative">
        <div className="text-[18px] font-light font-poppins text-black mb-2 tracking-tight">Storefront Preview</div>
        <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
          <span className="text-[12px] text-zinc-500 font-light">Inventory</span>
          <span className="text-[12px] text-sky-600 font-medium">{inventory.length}</span>
        </div>
        <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
          <span className="text-[12px] text-zinc-500 font-light">Products Sold</span>
          <span className="text-[12px] text-sky-600 font-medium">{productsSold}</span>
        </div>
        <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
          <span className="text-[12px] text-zinc-500 font-light">Active Chats</span>
          <span className="text-[12px] text-sky-600 font-medium">{activeChats}</span>
        </div>
        <div className="w-full flex items-center justify-between pb-2 border-b" style={{borderColor:'#9ED3FF', borderBottomWidth:'0.5px'}}>
          <span className="text-[12px] text-zinc-500 font-light">Reviews</span>
          <span className="text-[12px] text-sky-600 font-medium">{reviews}</span>
        </div>
        <div className="w-full flex justify-end mt-4">
          <button
            className="px-4 py-2 rounded-full bg-sky-600 text-white text-[12px] font-light flex items-center gap-1 shadow hover:bg-sky-700"
            onClick={downloadReport}
          >
            <Download className="h-4 w-4" /> Download report
          </button>
        </div>
      </div>
      {/* Add Products Section */}
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
      <div className="mt-6 rounded-3xl border bg-[#F7F7F7] border-[#36A5FF] p-4 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[17px] font-light font-poppins text-black tracking-tight">Products</div>
          {inventory.length > 3 && !showAllProducts && (
            <button className="text-sky-600 text-[13px] font-light px-3 py-1 rounded-full hover:bg-[#E3F3FF]" onClick={()=>setShowAllProducts(true)}>See more</button>
          )}
        </div>
        <div className="space-y-3">
          {(showAllProducts ? inventory : inventory.slice(0,3)).map(p => (
            <button
              key={p.id}
              className="w-full text-left rounded-2xl border border-[#9ED3FF] p-3 flex items-center gap-3 bg-white hover:bg-[#E3F3FF] transition shadow-sm"
              onClick={() => setEditingProduct(p)}
              type="button"
            >
              <img src={p.image} className="h-14 w-14 object-cover rounded-xl border border-[#9ED3FF]"/>
              <div className="flex-1">
                <div className="font-semibold text-[15px] text-black">{p.name}</div>
                <div className="text-zinc-500 text-[12px] font-light">{p.category} • Stock: {p.stock} • SKU: {p.sku}</div>
              </div>
              <div className="text-[15px] font-semibold text-sky-600 mr-2">₦{Number(p.price).toLocaleString()}</div>
            </button>
          ))}
          {inventory.length===0 && <div className="text-zinc-500">No products yet. Use the buttons above to add or bulk‑upload.</div>}
        </div>
        {inventory.length > 3 && showAllProducts && (
          <div className="w-full flex justify-end mt-4">
            <button className="text-sky-600 text-[13px] font-light px-3 py-1 rounded-full hover:bg-[#E3F3FF]" onClick={()=>setShowAllProducts(false)}>See less</button>
          </div>
        )}
      </div>
      {showAdd && <AddProductModal pharmacyId={user.uid} onClose={()=>setShowAdd(false)} />}
      {showBulk && <BulkUploadModal pharmacyId={user.uid} onClose={()=>setShowBulk(false)} />}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-[90vw] max-w-sm shadow-xl border border-[#9ED3FF] relative">
            <div className="flex items-center justify-between mb-4 relative">
              <div className="text-lg font-medium font-poppins text-black">Edit Product</div>
              <div className="relative">
                <button className="rounded-full border border-zinc-300 text-zinc-500 py-2 flex items-center justify-center ml-2" style={{width:'36px',height:'36px'}} onClick={e => {e.stopPropagation(); setShowAdvanced(v=>!v);}}><MoreVertical className="h-4 w-4"/></button>
                {showAdvanced && (
                  <div className="absolute right-0 top-full mt-2 bg-white border border-[#9ED3FF] rounded-xl shadow p-2 z-10" onClick={e => e.stopPropagation()}>
                    <button className="flex items-center gap-2 text-red-600 text-[13px] font-light px-2 py-1 hover:bg-red-50 rounded" onClick={()=>{setShowDeleteConfirm(true); setShowAdvanced(false);}}><Trash className="h-4 w-4"/> Delete</button>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-3" onClick={()=>showAdvanced && setShowAdvanced(false)}>
              <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Name" />
              <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" value={editCategory} onChange={e=>setEditCategory(e.target.value)} placeholder="Category" />
              <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" value={editStock} onChange={e=>setEditStock(e.target.value)} placeholder="Stock" type="number" />
              <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" value={editSKU} onChange={e=>setEditSKU(e.target.value)} placeholder="SKU" />
              <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" value={editPrice} onChange={e=>setEditPrice(e.target.value)} placeholder="Price" type="number" />
            </div>
            <div className="flex gap-2 mt-6 items-center">
              <button className="flex-1 rounded-full bg-sky-600 text-white text-[12px] font-light py-2 shadow hover:bg-sky-700" onClick={handleSaveProduct}>Save</button>
              <button className="flex-1 rounded-full border border-zinc-300 text-zinc-500 text-[12px] font-light py-2" onClick={()=>setEditingProduct(null)}>Cancel</button>
            </div>
            {showDeleteConfirm && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-3xl" onClick={()=>setShowDeleteConfirm(false)}>
                <div className="bg-white rounded-2xl p-5 shadow-xl border border-[#9ED3FF] text-center" onClick={e=>e.stopPropagation()}>
                  <div className="text-[15px] font-light mb-4">Are you sure you want to delete this item?</div>
                  <div className="flex gap-2 justify-center">
                    <button className="rounded-full bg-red-600 text-white text-[12px] font-light px-4 py-2" onClick={handleDeleteProduct}>Yes, Delete</button>
                    <button className="rounded-full border border-zinc-300 text-zinc-500 text-[12px] font-light px-4 py-2" onClick={()=>setShowDeleteConfirm(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="mt-6">
        <button onClick={() => { logout(); window.location.href = '/auth/landing'; }} className="rounded-full border border-red-300 text-red-600 px-3 py-1 inline-flex text-[12px] items-center gap-2"><LogOut className="h-4 w-4"/> Log Out</button>
      </div>
    </div>
  );
}