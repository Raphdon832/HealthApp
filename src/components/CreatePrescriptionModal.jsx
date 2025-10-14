import { useState } from 'react';
import Modal from './Modal';

export default function CreatePrescriptionModal({ open, onClose, products, onSubmit }) {
  const [selectedDrugs, setSelectedDrugs] = useState([]); // [{productId, name, quantity, dosage, frequency, duration, notes, times: []}]
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0,10));
  const [duration, setDuration] = useState(7);
  const [notes, setNotes] = useState('');
  const [requirePurchase, setRequirePurchase] = useState(false);

  const addDrug = () => setSelectedDrugs([...selectedDrugs, { productId: '', name: '', quantity: 1, dosage: '', frequency: '', duration: '', notes: '', times: [''] }]);
  const updateDrug = (idx, field, value) => {
    setSelectedDrugs(drugs => drugs.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  };
  const updateDrugTime = (idx, tIdx, value) => {
    setSelectedDrugs(drugs => drugs.map((d, i) => i === idx ? { ...d, times: d.times.map((t, j) => j === tIdx ? value : t) } : d));
  };
  const addDrugTime = idx => {
    setSelectedDrugs(drugs => drugs.map((d, i) => i === idx ? { ...d, times: [...(d.times || []), ''] } : d));
  };
  const removeDrugTime = (idx, tIdx) => {
    setSelectedDrugs(drugs => drugs.map((d, i) => i === idx ? { ...d, times: d.times.filter((_, j) => j !== tIdx) } : d));
  };
  const removeDrug = idx => setSelectedDrugs(drugs => drugs.filter((_, i) => i !== idx));

  const handleSubmit = e => {
    e.preventDefault();
    if (!selectedDrugs.length) return alert('Add at least one drug');
    onSubmit({ drugs: selectedDrugs, startDate, duration, notes, requirePurchase });
  };

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-lg font-light mb-2 animate-text-reveal">Create Prescription</div>
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <button 
            type="button" 
            onClick={addDrug} 
            className="mb-2 px-3 py-1 rounded-full text-[12px] bg-sky-600 text-white btn-interactive hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all duration-200"
          >
            + Add Drug
          </button>
          {selectedDrugs.map((drug, idx) => (
            <div key={idx} className="mb-2 p-2 border rounded-lg bg-zinc-50 card-interactive hover:shadow-md transition-all duration-200 animate-fadeInUp" style={{ animationDelay: `${0.1 * idx}s` }}>
              <select
                className="mb-1 w-full border-b p-1 text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200"
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
              <input 
                type="number" 
                min="1" 
                className="mb-1 w-full border-b p-1 text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
                placeholder="Quantity" 
                value={drug.quantity} 
                onChange={e => updateDrug(idx, 'quantity', e.target.value)} 
                required 
              />
              <input 
                className="mb-1 w-full border-b p-1 text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
                placeholder="Dosage (e.g. 1 tablet)" 
                value={drug.dosage} 
                onChange={e => updateDrug(idx, 'dosage', e.target.value)} 
                required 
              />
              <input 
                className="mb-1 w-full border-b p-1 text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
                placeholder="Frequency (e.g. 2x/day)" 
                value={drug.frequency} 
                onChange={e => updateDrug(idx, 'frequency', e.target.value)} 
                required 
              />
              <input 
                type="number" 
                min="1" 
                className="mb-1 w-full border-b p-1 text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
                placeholder="Duration (days)" 
                value={drug.duration} 
                onChange={e => updateDrug(idx, 'duration', e.target.value)} 
                required 
              />
              <input 
                className="mb-1 w-full border-b p-1 text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
                placeholder="Notes (optional)" 
                value={drug.notes} 
                onChange={e => updateDrug(idx, 'notes', e.target.value)} 
              />
              {/* Time fields */}
              <div className="mb-1">
                <label className="block text-xs font-light mb-1">Time(s) for this dosage (optional)</label>
                {(drug.times || []).map((time, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2 mb-1 animate-fade-in">
                    <input
                      type="time"
                      className="border-b p-1 text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200"
                      value={time}
                      onChange={e => updateDrugTime(idx, tIdx, e.target.value)}
                    />
                    <button 
                      type="button" 
                      className="text-xs text-red-500 hover:text-red-600 transition-colors duration-200 hover:scale-110" 
                      onClick={() => removeDrugTime(idx, tIdx)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className="text-xs text-sky-600 underline hover:text-sky-700 transition-colors duration-200" 
                  onClick={() => addDrugTime(idx)}
                >
                  + Add Time
                </button>
              </div>
              <button 
                type="button" 
                onClick={() => removeDrug(idx)} 
                className="text-xs text-red-500 hover:text-red-600 transition-colors duration-200 hover:scale-110"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <label className="block text-sm mb-1 font-light">Start Date</label>
          <input 
            type="date" 
            className="border-b p-1 w-full text-[12px] dark:bg-gray-800 focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            required 
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <label className="block text-sm mb-1 font-light">Total Duration (days)</label>
          <input 
            type="number" 
            min="1" 
            className="border-b p-1 w-full text-[12px] dark:bg-gray-800 focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
            value={duration} 
            onChange={e => setDuration(e.target.value)} 
            required 
          />
        </div>
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <label className="block text-sm mb-1 font-light">Notes</label>
          <textarea 
            className="border rounded p-1 w-full text-[12px] focus:border-sky-500 dark:border-gray-600 transition-colors duration-200" 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
          />
        </div>
        <div className="flex items-center gap-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <input 
            type="checkbox" 
            id="requirePurchase" 
            checked={requirePurchase} 
            onChange={e => setRequirePurchase(e.target.checked)} 
            className="transition-transform duration-200 hover:scale-110"
          />
          <label htmlFor="requirePurchase" className="text-xs font-light">Require customer to purchase before prescription starts</label>
        </div>
        <button 
          type="submit" 
          className="w-full rounded-full bg-sky-600 text-white py-2 font-light text-[12px] btn-interactive hover:bg-sky-700 hover:scale-105 active:scale-95 transition-all duration-200 animate-fade-in-up" 
          style={{ animationDelay: '0.6s' }}
        >
          Create Prescription
        </button>
      </form>
    </Modal>
  );
}
