import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function generatePharmacyReport(user) {
  const docPDF = new jsPDF();
  docPDF.setFont('helvetica', 'normal');
  docPDF.setFontSize(16);
  docPDF.text('Pharmacy Profile Report', 20, 20);
  docPDF.setFontSize(12);
  docPDF.text(`Name: ${user?.displayName || 'Pharmacy'}`, 20, 35);
  docPDF.text(`Email: ${user?.email || ''}`, 20, 45);

  // Fetch pharmacy profile
  const snap = await getDoc(doc(db, 'pharmacies', user.uid));
  const profile = snap.exists() ? snap.data() : {};
  docPDF.text(`Address: ${profile.address || ''}`, 20, 55);
  docPDF.text(`Phone: ${profile.phone || ''}`, 20, 65);

  // Inventory
  const productsSnap = await getDocs(query(collection(db, 'products'), where('pharmacyId', '==', user.uid)));
  const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  autoTable(docPDF, {
    startY: 75,
    head: [['Product Name', 'Category', 'Stock', 'SKU', 'Price']],
    body: products.map(p => [p.name, p.category, p.stock, p.sku, `₦${Number(p.price).toLocaleString()}`]),
    theme: 'striped',
    headStyles: { fillColor: [54, 165, 255] },
    styles: { fontSize: 10 },
  });

  // Orders
  const ordersSnap = await getDocs(query(collection(db, 'orders'), where('pharmacyId', '==', user.uid)));
  const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  let y = docPDF.lastAutoTable ? docPDF.lastAutoTable.finalY + 10 : 100;
  docPDF.setFontSize(14);
  docPDF.text('Orders', 20, y);
  y += 6;
  autoTable(docPDF, {
    startY: y,
    head: [['Order ID', 'Date', 'Total', 'Items']],
    body: orders.map(order => [
      order.id.slice(0, 8),
      order.createdAt?.toDate?.().toLocaleString?.() || '',
      `₦${Number(order.total).toLocaleString()}`,
      (order.items || []).map(i => `${i.name || i.productId} x${i.qty || i.quantity || 1}`).join(', ')
    ]),
    theme: 'striped',
    headStyles: { fillColor: [54, 165, 255] },
    styles: { fontSize: 9 },
  });

  docPDF.save('pharmacy-profile-report.pdf');
}
