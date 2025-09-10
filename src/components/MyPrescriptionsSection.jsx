import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import PrescriptionList from '@/components/PrescriptionList';
import { useAuth } from '@/lib/auth';

// Helper: Parse frequency string like "2x/day" to number of times per day
function parseFrequency(freq) {
  if (!freq) return 1;
  const match = freq.match(/(\d+)x\s*\/\s*day/i);
  if (match) return Number(match[1]);
  return 1;
}

// Helper: Schedule browser notifications for a prescription
function scheduleNotifications(prescription) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const { drugs, startDate, duration } = prescription;
  const start = new Date(startDate);
  const now = new Date();
  const days = Number(duration) || 1;
  drugs.forEach(drug => {
    const timesPerDay = parseFrequency(drug.frequency);
    // Schedule for each day and each time per day
    for (let day = 0; day < days; day++) {
      for (let t = 0; t < timesPerDay; t++) {
        // For demo: schedule at intervals from now (in real: use actual time fields)
        const notifyTime = new Date(start.getTime() + day * 24*60*60*1000 + t * (24/timesPerDay)*60*60*1000);
        if (notifyTime > now) {
          const timeout = notifyTime.getTime() - now.getTime();
          setTimeout(() => {
            new Notification(`Time to take ${drug.name}`, {
              body: `Dosage: ${drug.dosage || ''} (${drug.frequency || ''})`,
            });
          }, timeout);
        }
      }
    }
  });
}

// Helper: Add prescription to Google Calendar (download .ics file)
function addToCalendar(prescription) {
  const { drugs, startDate, duration } = prescription;
  const start = new Date(startDate);
  const days = Number(duration) || 1;
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
  drugs.forEach(drug => {
    const timesPerDay = parseFrequency(drug.frequency);
    for (let day = 0; day < days; day++) {
      for (let t = 0; t < timesPerDay; t++) {
        const eventStart = new Date(start.getTime() + day * 24*60*60*1000 + t * (24/timesPerDay)*60*60*1000);
        const dt = eventStart.toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
        ics += `BEGIN:VEVENT\nSUMMARY:Take ${drug.name}\nDESCRIPTION:Dosage: ${drug.dosage || ''} (${drug.frequency || ''})\nDTSTART:${dt}\nDTEND:${dt}\nEND:VEVENT\n`;
      }
    }
  });
  ics += 'END:VCALENDAR';
  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'prescription.ics';
  a.click();
  URL.revokeObjectURL(url);
}

// Helper: Save alarms to localStorage and IndexedDB
function saveAlarms(prescriptions) {
  // LocalStorage
  localStorage.setItem('prescriptionAlarms', JSON.stringify(prescriptions));
  // IndexedDB (simple, for demo)
  if ('indexedDB' in window) {
    const req = indexedDB.open('HealthAppDB', 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('alarms')) db.createObjectStore('alarms', { keyPath: 'id' });
    };
    req.onsuccess = e => {
      const db = e.target.result;
      const tx = db.transaction('alarms', 'readwrite');
      const store = tx.objectStore('alarms');
      prescriptions.forEach(p => store.put(p));
    };
  }
}

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
      // Schedule notifications and save alarms
      if (Notification.permission === 'granted') {
        data.forEach(scheduleNotifications);
      }
      saveAlarms(data);
    }
    fetchPrescriptions();
  }, [user]);

  // Ask for notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  if (!user) return null;

  return (
    <div className="w-full">
      <div className="text-[18px] font-light font-poppins text-black mb-2 tracking-tight">
        My Prescriptions
        {prescriptions.length > 0 && (
          <button
            className="ml-4 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium"
            onClick={() => prescriptions.forEach(addToCalendar)}
          >Add to Calendar</button>
        )}
      </div>
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
