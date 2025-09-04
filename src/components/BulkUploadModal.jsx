import { useState } from 'react';
import { parseCsvFile, parseXlsxFile } from '@/lib/csv';
import { bulkAddProducts } from '@/lib/db';

export default function BulkUploadModal({ pharmacyId, onClose }) {
  const [error, setError] = useState('');

  const downloadTemplate = () => {
    const rows = [
      { name: 'Paracetamol', price: 800, description: 'OTC analgesic', image: 'https://...', category: 'Over‑the‑Counter', stock: 50, sku: 'PAR-500' },
      { name: 'Ibuprofen', price: 1200, description: 'NSAID', image: 'https://...', category: 'Over‑the‑Counter', stock: 30, sku: 'IBU-200' }
    ];
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => r[h]).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pharmasea_inventory_template.csv'; a.click();
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
      const cleaned = rows.map(r => ({ name: r.name, price: Number(r.price), description: r.description || '', image: r.image || '', category: r.category || 'Over‑the‑Counter', stock: Number(r.stock || 0), sku: r.sku || '' }))
        .filter(r => r.name && r.price);
      if (!cleaned.length) throw new Error('No valid rows found. Expect headers: name, price, description, image, category, stock, sku');
      await bulkAddProducts(cleaned, pharmacyId);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to parse file');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-6 w-[90vw] max-w-sm shadow-xl border border-[#9ED3FF]">
        <div className="text-lg font-light font-poppins mb-4 text-black">Bulk Upload Products</div>
        <div className="space-y-3">
          <input className="w-full border-b border-[#9ED3FF] text-[13px] font-light py-2 outline-none" placeholder="CSV File" type="file" onChange={(e)=>onFiles(e.target.files)} accept=".csv,.xlsx" />
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={downloadTemplate} className="flex-1 rounded-full bg-sky-600 text-white text-[13px] font-light py-2 shadow hover:bg-sky-700">Download CSV template</button>
          <button className="flex-1 rounded-full border border-zinc-300 text-zinc-500 text-[13px] font-light py-2" onClick={onClose}>Cancel</button>
        </div>
        {error && <div className="mt-3 text-red-600 text-sm">{error}</div>}
      </div>
    </div>
  );
}