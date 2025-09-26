import { useEffect, useState } from 'react';
import { getPrescriptionsForThread } from '@/lib/db';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function PrescriptionList({ chatThreadId, prescriptions: propPrescriptions, userId }) {
  const [prescriptions, setPrescriptions] = useState(propPrescriptions || []);
  // Track local quantity left for each prescription/drug: { [prescriptionId]: { [drugIdx]: qtyLeft } }
  const [qtyMap, setQtyMap] = useState({});

  useEffect(() => {
    if (propPrescriptions && propPrescriptions.length > 0) {
      setPrescriptions(propPrescriptions);
      // Initialize qtyMap from prescription data
      const map = {};
      propPrescriptions.forEach(p => {
        map[p.id] = {};
        p.drugs.forEach((d, i) => {
          map[p.id][i] = d.quantity;
        });
      });
      setQtyMap(map);
      return;
    }
    if (chatThreadId) {
      getPrescriptionsForThread(chatThreadId).then(data => {
        setPrescriptions(data);
        // Initialize qtyMap from prescription data
        const map = {};
        data.forEach(p => {
          map[p.id] = {};
          p.drugs.forEach((d, i) => {
            map[p.id][i] = d.quantity;
          });
        });
        setQtyMap(map);
      });
    }
  }, [chatThreadId, propPrescriptions]);

  // Helper to compute days left and quantity left for each drug
  function getDrugStatus(drug, prescription, idx) {
    const start = new Date(prescription.startDate);
    const now = new Date();
    const daysElapsed = Math.floor((now - start) / (1000*60*60*24));
    const daysLeft = Math.max(0, (Number(drug.duration || prescription.duration) - daysElapsed));
    // Use local qtyMap if available
    const quantityLeft = qtyMap[prescription.id]?.[idx] ?? drug.quantity;
    return { daysLeft, quantityLeft };
  }

  // Helper to parse dosage string and extract the number of pills per dose
  function parseDosage(dosage) {
    // Try to extract a number from the dosage string (e.g. "2 tablets", "1 capsule", "3 pills")
    if (!dosage) return 1;
    const match = dosage.match(/(\d+(?:\.\d+)?)/);
    if (match) return Number(match[1]);
    return 1;
  }

  // Mark dose taken handler
  async function handleMarkDose(prescriptionId, drugIdx) {
    setQtyMap(prev => {
      const next = { ...prev };
      const p = prescriptions.find(p => p.id === prescriptionId);
      if (!p) return prev;
      const d = p.drugs[drugIdx];
      const dosageNum = parseDosage(d.dosage);
      const currentQty = next[prescriptionId]?.[drugIdx] ?? d.quantity;
      next[prescriptionId] = { ...next[prescriptionId], [drugIdx]: Math.max(0, currentQty - dosageNum) };
      return next;
    });
    // Persist to Firestore (update the prescription's drugs array)
    const p = prescriptions.find(p => p.id === prescriptionId);
    if (!p) return;
    const d = p.drugs[drugIdx];
    const dosageNum = parseDosage(d.dosage);
    const newDrugs = p.drugs.map((drug, i) =>
      i === drugIdx ? { ...drug, quantity: Math.max(0, drug.quantity - dosageNum) } : drug
    );
    await updateDoc(doc(db, 'prescriptions', prescriptionId), { drugs: newDrugs });
    // Optionally, update local state
    setPrescriptions(prev => prev.map(p => p.id === prescriptionId ? { ...p, drugs: newDrugs } : p));
  }

  return (
    <div className="mt-4">
      <div className="text-lg font-light mb-2 text-black dark:text-white">Prescriptions</div>
      {prescriptions.length === 0 && <div className="text-zinc-400 text-sm">No prescriptions yet.</div>}
      {prescriptions.map(p => (
        <div key={p.id} className="mb-4 border rounded-2xl p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 shadow-sm relative">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-thin text-[14px] mb-1 text-black dark:text-white">Created: {new Date(p.startDate).toLocaleDateString()}</div>
              <div className="mb-1 text-xs text-zinc-500 font-light">Status: {p.status}</div>
            </div>
            <div className="flex flex-col gap-2">
              {p.drugs.map((d, i) => {
                const { quantityLeft } = getDrugStatus(d, p, i);
                // Disable if requirePurchase and not fulfilled
                const disableMarkDose = (p.requirePurchase && !p.fulfilled) || quantityLeft <= 0;
                return (
                  <button
                    key={i}
                    className="rounded-full bg-sky-600 text-white text-[10px] px-2 py-0.5 ml-auto disabled:opacity-40 mb-1 shadow-sm"
                    style={{minWidth: 70, height: 24, lineHeight: '16px'}}
                    disabled={disableMarkDose}
                    onClick={() => handleMarkDose(p.id, i)}
                  >Mark Dose</button>
                );
              })}
            </div>
          </div>
          <ul className="mb-2 text-[13px]">
            {p.drugs.map((d, i) => {
              const { daysLeft, quantityLeft } = getDrugStatus(d, p, i);
              return (
                <li key={i} className="mb-2 flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="font-medium text-sky-700">{d.name}</span>
                  <span className="text-zinc-500">Qty: {quantityLeft}</span>
                  <span className="text-zinc-500">Dosage: {d.dosage}</span>
                  <span className="text-zinc-500">Freq: {d.frequency}</span>
                  <span className={daysLeft <= 2 ? 'text-red-500' : 'text-green-600'}>Days left: {daysLeft}</span>
                  <span className={quantityLeft <= 2 ? 'text-red-500' : 'text-green-600'}>Qty left: {quantityLeft}</span>
                  {d.notes && <span className="block text-xs text-zinc-400">Notes: {d.notes}</span>}
                  {d.productId && p.requirePurchase && (
                    <a
                      href={`/product/${d.productId}`}
                      className="mt-1 inline-block text-xs text-sky-600 underline hover:text-sky-800 transition"
                    >
                      View & Buy
                    </a>
                  )}
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
