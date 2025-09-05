import { db } from './firebase';
import { collection, query, where, orderBy, addDoc, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';

export const listenProducts = (cb, pharmacyId = null) => {
  const base = collection(db, 'products');
  const q = pharmacyId ? query(base, where('pharmacyId', '==', pharmacyId), orderBy('createdAt', 'desc')) : query(base, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const addProduct = async (data) => {
  const ref = collection(db, 'products');
  await addDoc(ref, { ...data, createdAt: serverTimestamp() });
};

export const bulkAddProducts = async (rows, pharmacyId) => {
  const batch = writeBatch(db);
  rows.forEach((r) => {
    const ref = doc(collection(db, 'products'));
    batch.set(ref, { ...r, pharmacyId, price: Number(r.price), stock: Number(r.stock || 0), createdAt: serverTimestamp() });
  });
  await batch.commit();
};

export const removeProduct = (id) => deleteDoc(doc(db, 'products', id));

export const listenThread = (threadId, cb) => onSnapshot(collection(db, 'threads', threadId, 'messages'), (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

export const ensureThread = async (vendorId, customerId) => {
  const threadId = `${vendorId}__${customerId}`;
  const ref = doc(db, 'threads', threadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) await setDoc(ref, { id: threadId, participants: [vendorId, customerId], createdAt: serverTimestamp() });
  return threadId;
};

export const sendMessage = async (threadId, message) => addDoc(collection(db, 'threads', threadId, 'messages'), { ...message, createdAt: serverTimestamp() });

export const addToCart = async (uid, productId, qty = 1) => {
  const ref = doc(collection(db, 'users', uid, 'cart'));
  await setDoc(ref, { productId, qty });
};

export const listenCart = (uid, cb) => onSnapshot(collection(db, 'users', uid, 'cart'), (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

export const removeFromCart = (uid, itemId) => deleteDoc(doc(db, 'users', uid, 'cart', itemId));

export const placeOrder = async ({ customerId, pharmacyId, items, total }) => {
  return addDoc(collection(db, 'orders'), { customerId, pharmacyId, items, total, createdAt: serverTimestamp() });
};

export const listenOrders = (uid, cb) => {
  const q = query(collection(db, 'orders'), where('customerId', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const getOrCreateChatThread = async (vendorId, customerId) => {
  // Thread ID format: vendorId__customerId
  const threadId = `${vendorId}__${customerId}`;
  const ref = doc(db, 'threads', threadId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    // Fetch names for both participants
    const vendorSnap = await getDoc(doc(db, 'pharmacies', vendorId));
    const vendorName = vendorSnap.exists() ? vendorSnap.data().name : 'Vendor';
    const customerSnap = await getDoc(doc(db, 'users', customerId));
    const customerName = customerSnap.exists() ? customerSnap.data().displayName : 'Customer';
    await setDoc(ref, {
      id: threadId,
      participants: [vendorId, customerId],
      vendorId,
      customerId,
      vendorName,
      customerName,
      createdAt: serverTimestamp(),
    });
  }
  return threadId;
};

// Fetch all pharmacies with coordinates and name
export const getAllPharmacies = async () => {
  const snap = await getDocs(collection(db, 'pharmacies'));
  return snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      coordinates: data.coordinates || null,
      // add other fields if needed
    };
  });
};