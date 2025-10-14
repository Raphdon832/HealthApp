import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import PrescriptionList from '@/components/PrescriptionList';
import { useAuth } from '@/lib/auth';
import { fulfillPrescriptionIfOrdered } from '@/lib/db';
import { useTranslation } from '@/lib/language';

// Helper: Parse frequency string like "2x/day" to number of times per day
function parseFrequency(freq) {
  if (!freq) return 1;
  const match = freq.match(/(\d+)x\s*\/\s*day/i);
  if (match) return Number(match[1]);
  return 1;
}

// Helper: Schedule browser notifications for a prescription
function scheduleNotifications(prescription, t) {
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
      for (let timeIndex = 0; timeIndex < timesPerDay; timeIndex++) {
        // For demo: schedule at intervals from now (in real: use actual time fields)
        const notifyTime = new Date(start.getTime() + day * 24*60*60*1000 + timeIndex * (24 / timesPerDay) * 60*60*1000);
        if (notifyTime > now) {
          const timeout = notifyTime.getTime() - now.getTime();
          setTimeout(() => {
            new Notification(t('time_to_take_medicine', `Time to take ${drug.name}`), {
              body: t('dosage_frequency', `Dosage: ${drug.dosage || ''} (${drug.frequency || ''})`, { dosage: drug.dosage || '', frequency: drug.frequency || '' }),
            });
          }, timeout);
        }
      }
    }
  });
}

// Helper: Add prescription to Google Calendar (download .ics file)
function addToCalendar(prescription, t) {
  const { drugs, startDate, duration } = prescription;
  const start = new Date(startDate);
  const days = Number(duration) || 1;
  let ics = 'BEGIN:VCALENDAR\nVERSION:2.0\n';
  drugs.forEach(drug => {
    const timesPerDay = parseFrequency(drug.frequency);
    for (let day = 0; day < days; day++) {
      for (let timeIndex = 0; timeIndex < timesPerDay; timeIndex++) {
        const eventStart = new Date(start.getTime() + day * 24*60*60*1000 + timeIndex * (24 / timesPerDay) * 60*60*1000);
        const dt = eventStart.toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
        ics += `BEGIN:VEVENT\nSUMMARY:${t('take_medicine', 'Take {drugName}', { drugName: drug.name })}\nDESCRIPTION:${t('dosage_frequency', 'Dosage: {dosage} ({frequency})', { dosage: drug.dosage || '', frequency: drug.frequency || '' })}\nDTSTART:${dt}\nDTEND:${dt}\nEND:VEVENT\n`;
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
  const { t } = useTranslation();
  const [prescriptions, setPrescriptions] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function fetchPrescriptions() {
      // Fulfill prescriptions if all drugs are purchased (after order completion)
      await fulfillPrescriptionIfOrdered({ customerId: user.uid });
      const q = query(collection(db, 'prescriptions'), where('customerId', '==', user.uid));
      const snap = await getDocs(q);
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by startDate descending (most recent first)
      data = data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setPrescriptions(data);
      // Schedule notifications and save alarms
      if (Notification.permission === 'granted') {
        data.forEach(p => scheduleNotifications(p, t));
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

  const total = prescriptions.length;
  const visiblePrescriptions = showAll ? prescriptions : prescriptions.slice(0, 1);

  return (
    <div className="w-full">
      <div className="text-[18px] font-light font-poppins text-black dark:text-white mb-2 tracking-tight">
        {t('my_prescriptions', 'My Prescriptions')}
        {prescriptions.length > 0 && (
          <button
            className="ml-12 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-normal"
            onClick={() => prescriptions.forEach(p => addToCalendar(p, t))}
          >{t('add_to_calendar', 'Add to Calendar')}</button>
        )}
      </div>

      {prescriptions.length === 0 ? (
        <div className="text-zinc-400 text-[12px] font-light">{t('no_prescriptions_found', 'No prescriptions found.')}</div>
      ) : (
        <>
          <PrescriptionList
            prescriptions={visiblePrescriptions}
            userId={user.uid}
            chatThreadId={null} // Not needed for this view
          />
          {total > 1 && !showAll && (
            <button
              className="mt-2 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-normal"
              onClick={() => setShowAll(true)}
            >{t('see_more', 'See more')}</button>
          )}
          {showAll && total > 1 && (
            <button
              className="mt-2 px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-normal dark:text-black/90 dark:bg-black/50"
              onClick={() => setShowAll(false)}
            >{t('see_less', 'See less')}</button>
          )}
        </>
      )}
    </div>
  );
}
