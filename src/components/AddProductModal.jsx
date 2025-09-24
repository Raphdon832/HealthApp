// src/components/AddProductModal.jsx
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { addProduct } from '@/lib/db';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddProductModal({ pharmacyId, onClose }) {
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Over-the-Counter',
    stock: 0,
    sku: '',
    image: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);

  // Prevent background scroll while modal is open
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, []);

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
      const tagsArr = (form.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      await addProduct({ ...form, image: imageUrl, price: Number(form.price), pharmacyId, tags: tagsArr });
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  const overlay = (
    <div
      className="
        fixed inset-0 z-[100]
        grid place-items-center
        bg-black/30 backdrop-blur-sm
        min-h-[100svh]
        animate-fade-in
      "
      role="dialog"
      aria-modal="true"
      onClick={onClose}    /* click outside closes */
    >
      {/* Modal card */}
      <div
        className="
          bg-white rounded-3xl p-6 w-[92vw] max-w-sm
          shadow-xl border border-[#9ED3FF]
          max-h-[85svh] overflow-auto
          card-interactive hover:shadow-2xl transition-all duration-300
          animate-bounce-in
        "
        onClick={(e) => e.stopPropagation()}  /* prevent overlay click */
      >
        <div className="text-lg font-light font-poppins mb-4 text-black animate-text-reveal">Add Product</div>

        <div className="space-y-3">
          <input
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <select
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none bg-white focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="Prescription">Prescription</option>
            <option value="Over-the-Counter">Over-the-Counter</option>
            <option value="Syrup">Syrup</option>
            <option value="Therapeutic">Therapeutic</option>
            <option value="Controlled">Controlled</option>
            <option value="Target System">Target System</option>
            <option value="Others">Others</option>
          </select>

          <input
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
            placeholder="Stock"
            type="number"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
          />

          <input
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
            placeholder="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
          />

          <input
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
            placeholder="Price"
            type="number"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />

          <input
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
            placeholder="Tags (comma separated, e.g. pain relief, children)"
            value={form.tags || ''}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />

          <div className="flex flex-col gap-2 pt-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <label className="text-[13px] font-light text-zinc-500">Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <input
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              placeholder="Or paste image link here"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <textarea
            rows={3}
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border border-[#9ED3FF] rounded-xl p-3 text-[13px] font-light outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
          />
        </div>

        <div className="flex gap-2 mt-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <button
            className="flex-1 rounded-full bg-sky-600 text-white text-[13px] font-light py-2 shadow hover:bg-sky-700 btn-interactive hover:scale-105 active:scale-95 transition-all duration-200"
            disabled={busy}
            onClick={submit}
          >
            {busy ? 'Uploading…' : 'Add'}
          </button>
          <button
            className="flex-1 rounded-full border border-zinc-300 text-zinc-500 text-[13px] font-light py-2 btn-interactive hover:border-zinc-400 hover:scale-105 active:scale-95 transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}