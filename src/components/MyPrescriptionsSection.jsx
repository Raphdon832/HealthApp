import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import PrescriptionList from '@/components/PrescriptionList';
import { useAuth } from '@/lib/auth';

export default function MyPrescriptionsSection() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    async function fetchPrescriptions() {
      setLoading(true);
      const q = query(collection(db, 'prescriptions'), where('customerId', '==', user.uid));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrescriptions(data);
      setLoading(false);
    }
    fetchPrescriptions();
  }, [user]);

  if (!user) return null;

  return (
    <div className="w-full">
      <div className="text-[18px] font-light font-poppins text-black mb-2 tracking-tight"></div>
      {loading ? (
        <div className="text-zinc-400">Loading...</div>
      ) : prescriptions.length === 0 ? (
        <div className="text-zinc-400">No prescriptions found.</div>
      ) : (
        <PrescriptionList
          prescriptions={prescriptions}
          userId={user.uid}
          chatThreadId={null} // Not needed for this view
        />
      )}
    </div>
  );
}
