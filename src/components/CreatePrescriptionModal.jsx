import { useState } from 'react';
import Modal from './Modal';

export default function CreatePrescriptionModal({ open, onClose, products, onSubmit }) {
  const [selectedDrugs, setSelectedDrugs] = useState([]); // [{productId, name, quantity, dosage, frequency, duration, notes}]
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0,10));
  const [duration, setDuration] = useState(7);
  const [notes, setNotes] = useState('');

  const addDrug = () => setSelectedDrugs([...selectedDrugs, { productId: '', name: '', quantity: 1, dosage: '', frequency: '', duration: '', notes: '' }]);
  const updateDrug = (idx, field, value) => {
    setSelectedDrugs(drugs => drugs.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };
  const removeDrug = idx => setSelectedDrugs(drugs => drugs.filter((_, i) => i !== idx));

  const handleSubmit = e => {
    e.preventDefault();
    if (!selectedDrugs.length) return alert('Add at least one drug');
    onSubmit({ drugs: selectedDrugs, startDate, duration, notes });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-lg font-light mb-2">Create Prescription</div>
        <div>
          <button type="button" onClick={addDrug} className="mb-2 px-3 py-1 rounded-full text-[12px] bg-sky-600 text-white">+ Add Drug</button>
          {selectedDrugs.map((drug, idx) => (
            <div key={idx} className="mb-2 p-2">
              <select
                className="mb-1 w-full border-b p-1"
                value={drug.productId}
                onChange={e => {
                  const prod = products.find(p => p.id === e.target.value);
                  updateDrug(idx, 'productId', prod?.id || '');
                  updateDrug(idx, 'name', prod?.name || '');
                }}
                required
              >
                <option value="">Select drug</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <input type="number" min="1" className="mb-1 w-full border-b p-1" placeholder="Quantity" value={drug.quantity} onChange={e => updateDrug(idx, 'quantity', e.target.value)} required />
              <input className="mb-1 w-full border-b p-1" placeholder="Dosage (e.g. 1 tablet)" value={drug.dosage} onChange={e => updateDrug(idx, 'dosage', e.target.value)} required />
              <input className="mb-1 w-full border-b p-1" placeholder="Frequency (e.g. 2x/day)" value={drug.frequency} onChange={e => updateDrug(idx, 'frequency', e.target.value)} required />
              <input type="number" min="1" className="mb-1 w-full border-b p-1" placeholder="Duration (days)" value={drug.duration} onChange={e => updateDrug(idx, 'duration', e.target.value)} required />
              <input className="mb-1 w-full border-b p-1" placeholder="Notes (optional)" value={drug.notes} onChange={e => updateDrug(idx, 'notes', e.target.value)} />
              <button type="button" onClick={() => removeDrug(idx)} className="text-xs text-red-500">Remove</button>
            </div>
          ))}
        </div>
        <div>
          <label className="block text-sm mb-1">Start Date</label>
          <input type="date" className="border rounded p-1 w-full" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Total Duration (days)</label>
          <input type="number" min="1" className="border rounded p-1 w-full" value={duration} onChange={e => setDuration(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm mb-1">Notes</label>
          <textarea className="border rounded p-1 w-full" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button type="submit" className="w-full rounded bg-sky-600 text-white py-2 font-medium">Create Prescription</button>
      </form>
    </Modal>
  );
}
