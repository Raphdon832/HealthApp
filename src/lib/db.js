// src/lib/db.js
import { db } from './firebase';
import {
  collection, query, where, orderBy, addDoc, doc, getDoc, getDocs, setDoc, updateDoc,
  deleteDoc, onSnapshot, serverTimestamp, writeBatch, increment, limit
} from 'firebase/firestore';

/* -----------------------------
   PHARMACIES (needed by Home.jsx)
----------------------------------*/
export const getAllPharmacies = async () => {
  const snap = await getDocs(collection(db, 'pharmacies'));
  const pharmacies = await Promise.all(snap.docs.map(async d => {
    const data = { id: d.id, ...d.data() };
    // Prefer lat/lon fields if present
    if (data.lat && data.lon) {
      data.coordinates = { latitude: Number(data.lat), longitude: Number(data.lon) };
    } else if (data.address) {
      // Fallback: geocode address (OpenStreetMap)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(data.address)}&limit=1`);
        const geo = await res.json();
        if (geo && geo[0]) {
          data.coordinates = { latitude: Number(geo[0].lat), longitude: Number(geo[0].lon) };
        }
      } catch {}
    }
    return data;
  }));
  return pharmacies;
};

/* -----------------------------
   CHAT HELPERS (customer initiates)
----------------------------------*/
export const getOrCreateThread = async ({ vendorId, customerId, role }) => {
  const threadId = `${vendorId}__${customerId}`;
  const ref = doc(db, 'threads', threadId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    if (role !== 'customer') throw new Error('Only customers can start a chat thread');
    // optional friendly names
    const [vSnap, cSnap] = await Promise.all([
      getDoc(doc(db, 'pharmacies', vendorId)),
      getDoc(doc(db, 'users', customerId)),
    ]);
    const vendorName = vSnap.exists() ? vSnap.data().name : 'Pharmacy';
    const customerName = cSnap.exists() ? cSnap.data().displayName : 'Customer';

    await setDoc(ref, {
      id: threadId,
      vendorId,
      customerId,
      vendorName,
      customerName,
      lastMessage: '',
      lastBy: null,
      lastAt: serverTimestamp(),
      unread: { [vendorId]: 0, [customerId]: 0 },
      createdAt: serverTimestamp(),
    });
  }
  return threadId;
};

export const sendChatMessage = async (threadId, { senderId, to, text }) => {
  const messagesCol = collection(db, 'threads', threadId, 'messages');
  await addDoc(messagesCol, {
    senderId, to, text: text || '', createdAt: serverTimestamp(), read: false,
  });
  await updateDoc(doc(db, 'threads', threadId), {
    lastMessage: text || '…',
    lastBy: senderId,
    lastAt: serverTimestamp(),
    [`unread.${to}`]: increment(1),
  });
};

export const markThreadRead = async (threadId, viewerUid) => {
  await updateDoc(doc(db, 'threads', threadId), { [`unread.${viewerUid}`]: 0 });
  // optional: mark recent incoming read
  const incoming = query(
    collection(db, 'threads', threadId, 'messages'),
    where('to', '==', viewerUid),
    where('read', '==', false),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(incoming);
  if (!snap.empty) {
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.update(d.ref, { read: true }));
    await batch.commit();
  }
};

/** Real-time messages in a thread */
export const listenThreadMessages = (threadId, cb, onErr) => {
  const q = query(collection(db, 'threads', threadId, 'messages'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => onErr?.(e)
  );
};

/**
 * Real-time thread list for a user (customer or vendor), newest first.
 * Pass { noSort: true } while your composite index is still building to avoid errors.
 */
export const listenUserThreads = (user, cb, onErr, opts = {}) => {
  if (!user?.uid || !user?.role) return () => {};
  const base = collection(db, 'threads');
  const byRole = user.role === 'customer'
    ? query(base, where('customerId', '==', user.uid))
    : query(base, where('vendorId', '==', user.uid));

  const q = opts.noSort ? byRole : query(byRole, orderBy('lastAt', 'desc'));

  return onSnapshot(
    q,
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => onErr?.(e)
  );
};

/* -----------------------------
   PRODUCTS / CART / ORDERS (unchanged)
----------------------------------*/
export const listenProducts = (cb, pharmacyId = null) => {
  const base = collection(db, 'products');
  const q = pharmacyId
    ? query(base, where('pharmacyId', '==', pharmacyId), orderBy('createdAt', 'desc'))
    : query(base, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => console.error('listenProducts error:', e)
  );
};

export const addProduct = async (data) => {
  const ref = collection(db, 'products');
  await addDoc(ref, { ...data, createdAt: serverTimestamp() });
};

export const bulkAddProducts = async (rows, pharmacyId) => {
  const batch = writeBatch(db);
  rows.forEach((r) => {
    const ref = doc(collection(db, 'products'));
    batch.set(ref, {
      ...r,
      pharmacyId,
      price: Number(r.price),
      stock: Number(r.stock || 0),
      createdAt: serverTimestamp()
    });
  });
  await batch.commit();
};

export const removeProduct = (id) => deleteDoc(doc(db, 'products', id));

export const addToCart = async (uid, productId, qty = 1) => {
  const ref = doc(collection(db, 'users', uid, 'cart'));
  await setDoc(ref, { productId, qty });
};
export const listenCart = (uid, cb) =>
  onSnapshot(collection(db, 'users', uid, 'cart'),
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => console.error('listenCart error:', e)
  );
export const removeFromCart = (uid, itemId) => deleteDoc(doc(db, 'users', uid, 'cart', itemId));

export const placeOrder = async ({ customerId, pharmacyId, items, total }) =>
  addDoc(collection(db, 'orders'), { customerId, pharmacyId, items, total, createdAt: serverTimestamp() });

export const listenOrders = (uid, cb) => {
  const q = query(collection(db, 'orders'), where('customerId', '==', uid), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))),
    e => console.error('listenOrders error:', e)
  );
};

/**
 * Get the top N best-selling products for the current pharmacy, sorted by sold count (desc), then dateAdded (desc).
 * Assumes products have { id, name, vendorId, dateAdded } and orders have { items: [{ productId, quantity }], vendorId }
 */
export const getBestSellingProducts = async (limitCount = 5, pharmacyId) => {
  if (!pharmacyId) return [];
  // 1. Get all products for this pharmacy
  const productsSnap = await getDocs(query(collection(db, 'products'), where('pharmacyId', '==', pharmacyId)));
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  if (products.length === 0) return [];

  // 2. Get all orders for this pharmacy
  const ordersSnap = await getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', pharmacyId)));
  const salesMap = {};
  ordersSnap.forEach(orderDoc => {
    const order = orderDoc.data();
    (order.items || []).forEach(item => {
      if (!salesMap[item.productId]) salesMap[item.productId] = 0;
      salesMap[item.productId] += item.quantity || 1;
    });
  });

  // 3. Merge sales count into products
  const productsWithSales = products.map(p => ({
    ...p,
    sold: salesMap[p.id] || 0
  }));

  // 4. Sort by sold desc, then dateAdded desc
  productsWithSales.sort((a, b) => {
    if (b.sold !== a.sold) return b.sold - a.sold;
    return (b.dateAdded?.toMillis?.() || 0) - (a.dateAdded?.toMillis?.() || 0);
  });

  // 5. Return top N
  return productsWithSales.slice(0, limitCount).map(p => ({
    id: p.id,
    name: p.name,
    sold: p.sold,
    dateAdded: p.dateAdded
  }));
}

/* -----------------------------
   PRESCRIPTIONS (new code)
----------------------------------*/
export async function createPrescription({ pharmacyId, customerId, chatThreadId, drugs, startDate, duration, notes }) {
  return await addDoc(collection(db, 'prescriptions'), {
    pharmacyId,
    customerId,
    chatThreadId,
    drugs,
    startDate,
    duration,
    notes,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getPrescriptionsForThread(chatThreadId) {
  const q = query(collection(db, 'prescriptions'), where('chatThreadId', '==', chatThreadId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Fulfill prescription if all drugs are purchased
export async function fulfillPrescriptionIfOrdered({ customerId }) {
  // 1. Get all prescriptions for this customer that require purchase and are not fulfilled
  const presSnap = await getDocs(query(collection(db, 'prescriptions'), where('customerId', '==', customerId), where('requirePurchase', '==', true), where('fulfilled', '!=', true)));
  const prescriptions = presSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  if (!prescriptions.length) return;
  // 2. Get all fulfilled orders for this customer
  const ordersSnap = await getDocs(query(collection(db, 'orders'), where('customerId', '==', customerId), where('status', '==', 'fulfilled')));
  const allOrderItems = [];
  ordersSnap.forEach(orderDoc => {
    const order = orderDoc.data();
    (order.items || []).forEach(item => {
      allOrderItems.push(item.productId);
    });
  });
  // 3. For each prescription, check if all drugs are in the orders
  for (const p of prescriptions) {
    const allDrugsPurchased = p.drugs.every(d => d.productId && allOrderItems.includes(d.productId));
    if (allDrugsPurchased) {
      await updateDoc(doc(db, 'prescriptions', p.id), { fulfilled: true });
    }
  }
}
