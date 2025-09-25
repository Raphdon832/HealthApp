import { getFunctions, httpsCallable } from "firebase/functions";
import PaystackPop from "@paystack/inline-js";

const functions = getFunctions();

async function onCheckout(total) {
  const initOrder = httpsCallable(functions, "initOrder");
  const res = await initOrder({ total });
  const { checkoutUrl, accessCode, orderId, paystackReference } = res.data;

  return new Promise((resolve, reject) => {
    const popup = new PaystackPop();
    popup.resumeTransaction(accessCode, {
      onSuccess: () => {
        console.log("Payment successful");
        resolve({
          status: true,
          message: "Payment successful",
          data: { checkoutUrl, orderId, paystackReference },
        });
      },
      onCancel: () => {
        console.log("User cancelled");
        resolve({ status: false, message: "Payment cancelled" });
      },
      onError: () => {
        console.log("Payment failed");
        resolve({ status: false, message: "Payment cancelled" });
      },
      onLoad: () => {
        console.log("Page is loaded");
      },
    });
  });
}
export { onCheckout };
