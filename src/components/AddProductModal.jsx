// src/components/AddProductModal.jsx (styled version)
// This version styles the AddProductModal to match the design language: rounded corners, thin fonts, line inputs, modern buttons, modal overlay.
import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { addProduct } from '@/lib/db';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddProductModal({ pharmacyId, onClose }) {
  const [form, setForm] = useState({ name: '', price: '', category: 'Over‑the‑Counter', stock: 0, sku: '', image: '', description: '' });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!form.name || !form.price) return alert('Name and price required');
    setBusy(true);
    try {
      let imageUrl = form.image;
      if (!imageUrl && file) {
        const key = `products/${pharmacyId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, key);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
      }
      // Parse tags into array
      const tagsArr = (form.tags||'').split(',').map(t=>t.trim()).filter(Boolean);
      await addProduct({ ...form, image: imageUrl, price: Number(form.price), pharmacyId, tags: tagsArr });
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-[90vw] max-w-sm shadow-xl border border-[#9ED3FF]">
        <div className="text-lg font-light font-poppins mb-4 text-black">Add Product</div>
        <div className="space-y-3">
          <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
          <select
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none bg-white"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
          >
            <option value="Prescription">Prescription</option>
            <option value="Over-the-counter">Over-the-counter</option>
            <option value="Syrup">Syrup</option>
            <option value="Therapeutic">Therapeutic</option>
            <option value="Controlled">Controlled</option>
            <option value="Target System">Target System</option>
            <option value="Others">Others</option>
          </select>
          <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" placeholder="Stock" type="number" value={form.stock} onChange={(e)=>setForm({...form,stock:e.target.value})} />
          <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" placeholder="SKU" value={form.sku} onChange={(e)=>setForm({...form,sku:e.target.value})} />
          <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" placeholder="Price" type="number" value={form.price} onChange={(e)=>setForm({...form,price:e.target.value})} />
          <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" placeholder="Tags (comma separated, e.g. pain relief, children)" value={form.tags||''} onChange={e=>setForm({...form, tags: e.target.value})} />
          <div className="flex flex-col gap-2 pt-2">
            <label className="text-[13px] font-light text-zinc-500">Product Image</label>
            <input type="file" accept="image/*" className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2" onChange={(e)=>setFile(e.target.files?.[0]||null)} />
            <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" placeholder="Or paste image link here" value={form.image} onChange={(e)=>setForm({...form,image:e.target.value})} />
          </div>
        </div>
        <div className="mt-3">
          <Textarea rows={3} placeholder="Description" value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} />
        </div>
        <div className="flex gap-2 mt-6">
          <button className="flex-1 rounded-full bg-sky-600 text-white text-[13px] font-light py-2 shadow hover:bg-sky-700" disabled={busy} onClick={submit}>{busy?'Uploading…':'Add'}</button>
          <button className="flex-1 rounded-full border border-zinc-300 text-zinc-500 text-[13px] font-light py-2" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
