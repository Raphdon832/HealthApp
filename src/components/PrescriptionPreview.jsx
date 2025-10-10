import {
  doc,
  collection,
  getDoc,
  onSnapshot,
  where,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";

import { CheckOut } from "./CheckOut";

export default function PrescriptionPreview({ prescriptionId }) {
  const [prescription, setPrescription] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [products, setProduct] = useState([]);
  const [showCheckout, setShowCheckOut] = useState(false);
  const [isPaid, setIsPaid] = useState(false);

  const addProduct = (newProduct) => {
    setProduct((prevProducts) => [...prevProducts, newProduct]);
  };

  useEffect(() => {
    const fetchPrescription = async () => {
      const snap = await getDoc(doc(db, "prescriptions", prescriptionId));

      if (snap.exists()) {
        setPrescription({ id: snap.id, ...snap.data() });
      }
    };
    fetchPrescription();
  }, [prescriptionId]);

  useEffect(() => {
    const calculateTotal = async () => {
      if (!prescription || !prescription.drugs) return;

      const prices = await Promise.all(
        prescription.drugs?.map(async (drug) => {
          const productSnap = await getDoc(doc(db, "products", drug.productId));

          if (productSnap.exists()) {
            const product = { id: productSnap.id, ...productSnap.data() };
            if (!products.find((p) => p.id === product.id)) {
              const productWithQty = { ...product, qty: drug.dosage };
              addProduct(productWithQty);
            }
            return drug.dosage * product.price;
          }

          return 0;
        })
      );

      const total = prices.reduce((acc, price) => acc + price, 0);
      setTotalPrice(total);
    };

    calculateTotal();
  }, [prescription]);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("prescriptionId", "==", prescriptionId)
    );

    const unSub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        const paid = !!data.prescriptionId;
        setIsPaid(paid);
      }
    });

    return () => unSub();
  }, []);

  if (!prescription) {
    return (
      <div className="text-xs text-gray-400 mt-1 italic">
        Loading prescription...
      </div>
    );
  }

  return (
    <div className="mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-xs text-gray-700 dark:text-gray-200 shadow-sm">
      <div className="font-semibold text-sm">📄 Prescription</div>
      <div className="mt-1">
        <span className="font-medium">Drugs:</span>{" "}
        {prescription.drugs?.length > 1
          ? `${prescription.drugs[0].name}, others...`
          : "Only one drug prescribed"}
      </div>
      <div>
        <span className="font-medium">Duration:</span> {prescription.duration}{" "}
        days
      </div>
      <div>
        <span className="font-medium">Notes:</span> {prescription.notes || "—"}
      </div>
      <div>
        <span className="font-medium">TotalPrice:</span> {totalPrice || 0}
      </div>
      <div className="mt-2">
        {isPaid ? (
          <button
            disabled
            className="w-full px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md cursor-not-allowed"
          >
            ✅ Paid
          </button>
        ) : (
          <button
            onClick={() => {
              setShowCheckOut(true);
            }}
            className="w-full px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            🛒 Order
          </button>
        )}
      </div>

      {showCheckout && (
        <CheckOut
          items={products}
          totalPrice={totalPrice}
          onClose={() => setShowCheckOut(false)}
          prescription={prescriptionId}
        />
      )}
    </div>
  );
}
