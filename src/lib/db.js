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

export const getOrCreateChatThread = async (customerId, vendorId) => {
  // Try to find an existing thread between these two participants
  const threadsRef = collection(db, 'threads');
  const q = query(threadsRef, where('participants', 'array-contains', customerId));
  const snap = await getDocs(q);
  // Look for a thread with both participants
  let threadDoc = snap.docs.find(d => {
    const participants = d.data().participants;
    return participants.includes(vendorId) && participants.includes(customerId);
  });
  if (threadDoc) {
    return threadDoc.id;
  }
  // If not found, create a new thread
  const newThread = await addDoc(threadsRef, {
    participants: [customerId, vendorId],
    createdAt: serverTimestamp(),
  });
  return newThread.id;
};