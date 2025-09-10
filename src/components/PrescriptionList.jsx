import { useEffect, useState } from 'react';
import { getPrescriptionsForThread } from '@/lib/db';

export default function PrescriptionList({ chatThreadId, products, userId }) {
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    if (!chatThreadId) return;
    getPrescriptionsForThread(chatThreadId).then(setPrescriptions);
  }, [chatThreadId]);

  // Helper to compute days left and quantity left for each drug
  function getDrugStatus(drug, prescription) {
    const start = new Date(prescription.startDate);
    const now = new Date();
    const daysElapsed = Math.floor((now - start) / (1000*60*60*24));
    const daysLeft = Math.max(0, (Number(drug.duration || prescription.duration) - daysElapsed));
    // For demo: just show quantity left as prescribed quantity (real: decrement as doses are taken)
    const quantityLeft = drug.quantity;
    return { daysLeft, quantityLeft };
  }

  return (
    <div className="mt-4">
      <div className="text-lg font-light mb-2">Prescriptions</div>
      {prescriptions.length === 0 && <div className="text-zinc-400 text-sm">No prescriptions yet.</div>}
      {prescriptions.map(p => (
        <div key={p.id} className="mb-4 border rounded p-3">
          <div className="font-thin mb-1">Created: {new Date(p.startDate).toLocaleDateString()}</div>
          <div className="mb-1 text-xs text-zinc-500 font-light">Status: {p.status}</div>
          <ul className="mb-2 text-[12px]">
            {p.drugs.map((d, i) => {
              const { daysLeft, quantityLeft } = getDrugStatus(d, p);
              return (
                <li key={i} className="mb-1">
                  <span className="font-medium">{d.name}</span> — Qty: {d.quantity}, Dosage: {d.dosage}, Freq: {d.frequency}, Days left: <span className={daysLeft <= 2 ? 'text-red-500' : 'text-green-600'}>{daysLeft}</span>, Qty left: <span className={quantityLeft <= 2 ? 'text-red-500' : 'text-green-600'}>{quantityLeft}</span>
                  {d.notes && <span className="block text-xs text-zinc-400">Notes: {d.notes}</span>}
                </li>
              );
            })}
          </ul>
          <div className="text-xs text-zinc-400">Duration: {p.duration} days</div>
        </div>
      ))}
    </div>
  );
}
