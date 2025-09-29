// src/pages/AddProduct.jsx
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '@/lib/language';
import { addProduct } from '@/lib/db';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AddProduct() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const pharmacyId = searchParams.get('pharmacyId');

  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Over-the-Counter',
    stock: 0,
    sku: '',
    tags: '',
    image: '',
    description: '',
  });
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const validateForm = () => {
    if (!form.name.trim()) {
      alert(t('please_fill_required', 'Please fill in all required fields'));
      return false;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      alert(t('invalid_price', 'Please enter a valid price'));
      return false;
    }
    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;
    
    setBusy(true);
    try {
      let imageUrl = form.image;
      
      // Upload file if selected
      if (!imageUrl && file) {
        setUploading(true);
        const key = `products/${pharmacyId}/${Date.now()}_${file.name}`;
        const storageRef = ref(storage, key);
        await uploadBytes(storageRef, file);
        imageUrl = await getDownloadURL(storageRef);
        setUploading(false);
      }
      
      // Parse tags
      const tagsArr = (form.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      
      // Add product to database
      await addProduct({ 
        ...form, 
        image: imageUrl, 
        price: Number(form.price), 
        pharmacyId, 
        tags: tagsArr 
      });
      
      alert(t('product_created_success', 'Product created successfully!'));
      navigate(-1); // Go back to previous page
    } catch (error) {
      console.error('Error creating product:', error);
      alert(t('error_creating_product', 'Error creating product. Please try again.'));
    } finally {
      setBusy(false);
      setUploading(false);
    }
  };

  const categoryOptions = [
    { value: 'Prescription', label: t('prescription_drugs', 'Prescription Drugs') },
    { value: 'Over-the-Counter', label: t('over_counter', 'Over-the-counter') },
    { value: 'General Pills', label: t('general_pills', 'General Pills') },
    { value: 'Controlled', label: t('controlled_substances', 'Controlled Substances') },
    { value: 'Syrup', label: t('syrup_liquid', 'Syrup/Liquid') },
    { value: 'Therapeutic', label: t('therapeutic_drugs', 'Therapeutic Drugs') },
    { value: 'Others', label: t('supplements_vitamins', 'Supplements & Vitamins') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl border border-[#9ED3FF] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-light font-poppins">{t('add_product_title', 'Add New Product')}</h1>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Product Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('product_name', 'Product Name')} *</label>
            <input
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-3 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              placeholder={t('product_name_placeholder', 'Enter product name')}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          {/* Price */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('product_price', 'Price')} *</label>
            <input
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-3 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              placeholder={t('product_price_placeholder', 'Enter price')}
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('product_category', 'Category')} *</label>
            <select
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-3 outline-none bg-white focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option value="" disabled>{t('select_category', 'Select Category')}</option>
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Stock */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('stock_quantity', 'Stock Quantity')}</label>
            <input
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-3 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              placeholder={t('stock_placeholder', 'Enter stock quantity')}
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
            />
          </div>

          {/* SKU */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('product_sku', 'SKU')}</label>
            <input
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-3 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              placeholder={t('sku_placeholder', 'Enter SKU (optional)')}
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </div>

          {/* Tags */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('product_tags', 'Tags')}</label>
            <input
              className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-3 outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
              placeholder={t('tags_placeholder', 'Add tags separated by commas')}
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          {/* Product Image */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('product_image', 'Product Image')}</label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                className="w-full border border-[#9ED3FF] rounded-lg p-3 text-[13px] font-light focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="text-center text-xs text-gray-500">or</div>
              <input
                className="w-full border border-[#9ED3FF] rounded-lg p-3 text-[13px] font-light outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400"
                placeholder={t('image_url_placeholder', 'Or enter image URL')}
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">{t('product_description', 'Description')}</label>
            <textarea
              rows={4}
              placeholder={t('description_placeholder', 'Enter product description')}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-[#9ED3FF] rounded-lg p-3 text-[13px] font-light outline-none focus:border-sky-500 transition-colors duration-200 hover:border-sky-400 resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 pt-0">
          <div className="flex gap-3">
            <button
              className="flex-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-medium py-3 shadow-lg hover:from-sky-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              disabled={busy || uploading}
              onClick={submit}
            >
              {uploading ? 
                t('uploading', 'Uploading...') : 
                busy ? 
                  t('creating_product', 'Creating Product...') : 
                  t('create_product', 'Create Product')
              }
            </button>
            <button
              className="flex-1 rounded-full border border-gray-300 text-gray-700 text-sm font-medium py-3 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
              onClick={() => navigate(-1)}
              disabled={busy}
            >
              {t('cancel', 'Cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}