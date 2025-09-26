// src/components/BulkUploadModal.jsx
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { parseCsvFile, parseXlsxFile } from '@/lib/csv';
import { bulkAddProducts } from '@/lib/db';

export default function BulkUploadModal({ pharmacyId, onClose }) {
  const [error, setError] = useState('');

  // Prevent background scroll when modal is open
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, []);

  const downloadTemplate = () => {
    const rows = [
      { name: 'Paracetamol', price: 800, description: 'OTC analgesic', image: 'https://...', category: 'Over-the-Counter', stock: 50, sku: 'PAR-500' },
      { name: 'Ibuprofen', price: 1200, description: 'NSAID', image: 'https://...', category: 'Over-the-Counter', stock: 30, sku: 'IBU-200' }
    ];
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pharmasea_inventory_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFiles = async (files) => {
    try {
      setError('');
      const file = files?.[0];
      if (!file) return;
      let rows = [];
      if (file.name.endsWith('.csv')) rows = await parseCsvFile(file);
      else rows = await parseXlsxFile(file);

      const cleaned = rows
        .map(r => ({
          name: r.name,
          price: Number(r.price),
          description: r.description || '',
          image: r.image || '',
          category: r.category || 'Over-the-Counter',
          stock: Number(r.stock || 0),
          sku: r.sku || ''
        }))
        .filter(r => r.name && r.price);

      if (!cleaned.length) {
        throw new Error('No valid rows found. Expect headers: name, price, description, image, category, stock, sku');
      }

      await bulkAddProducts(cleaned, pharmacyId);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to parse file');
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
      onClick={onClose}
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
        onClick={(e) => e.stopPropagation()} // prevent overlay click
      >
        <div className="text-lg font-light font-poppins mb-4 text-black animate-text-reveal">
          Bulk Upload Products
        </div>

        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <input
            className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none focus:border-sky-500 dark:border-gray-600 transition-colors duration-200 hover:border-sky-400"
            placeholder="CSV or XLSX File"
            type="file"
            onChange={(e) => onFiles(e.target.files)}
            accept=".csv,.xlsx"
          />
        </div>

        <div className="flex gap-2 mt-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={downloadTemplate}
            className="flex-1 rounded-full bg-sky-600 text-white text-[13px] font-light py-2 shadow hover:bg-sky-700 btn-interactive hover:scale-105 active:scale-95 transition-all duration-200"
          >
            Download CSV template
          </button>
          <button
            className="flex-1 rounded-full border border-zinc-300 text-zinc-500 text-[13px] font-light py-2 btn-interactive hover:border-zinc-400 hover:scale-105 active:scale-95 transition-all duration-200"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mt-3 text-red-600 text-sm animate-shake animate-fade-in">{error}</div>
        )}
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}