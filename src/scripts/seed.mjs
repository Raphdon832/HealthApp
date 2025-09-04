// scripts/seed.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const app = initializeApp({
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
});

const db = getFirestore(app);

const pharmId = 'demo_pharm_1';
await setDoc(doc(db, 'users', pharmId), { uid: pharmId, email: 'demo@pharm.com', displayName: 'HMedix Pharmacy (Demo)', role: 'pharmacy' });
await setDoc(doc(db, 'pharmacies', pharmId), { id: pharmId, name: 'HMedix Pharmacy', email: 'demo@pharm.com', address: '5 Wuse 2, Abuja, Nigeria', etaMins: 25, phone: '+2348000000000' });

const products = [
  { name: 'Paracetamol', price: 800, description: 'OTC analgesic', image: '', category: 'Over-the-Counter', stock: 50, sku: 'PAR-500' },
  { name: 'Ibuprofen', price: 1200, description: 'NSAID', image: '', category: 'Over-the-Counter', stock: 30, sku: 'IBU-200' },
];

for (const p of products) {
  await addDoc(collection(db, 'products'), { ...p, pharmacyId: pharmId, createdAt: serverTimestamp() });
}

console.log('Seeded demo pharmacy + products');
