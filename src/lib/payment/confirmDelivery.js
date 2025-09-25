import { getFunctions, httpsCallable } from "firebase/functions";

const functions = getFunctions();

async function confirmDelivery(orderId, pharmacistId) {
  const confirm = httpsCallable(functions, "confirmDelivery");
  const res = await confirm({ orderId, pharmacistId });

  if (res.data.success) {
    console.log("Transfer initiated: ", res.data.transferReference);
  }
}

export { confirmDelivery };
