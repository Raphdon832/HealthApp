import { setGlobalOptions } from "firebase-functions";
import { onRequest, onCall, HttpsError } from "firebase-functions/https";
import { defineSecret } from "firebase-functions/params";
import admin from "firebase-admin";
import axios from "axios";
import corsLib from "cors";
import crypto from "crypto";
// import { logger } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();
const cors = corsLib({ origin: true });
const db = admin.firestore();

const PAYSTACK_SECRET = defineSecret("PAYSTACK_SECRET");
const PAYSTACK_BASE = "https://api.paystack.co";

function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

function verifyPaystackSignature(rawBody, signature) {
  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

async function ensureRecipient(pharmId) {
  const pharmRef = db.collection("pharmacies").doc(pharmId);
  const pharmSnap = await pharmRef.get();
  if (!pharmSnap.exists) throw new Error("Pharmacy not found");

  const pharm = pharmSnap.data();
  if (pharm.recipientCode) return pharm.recipientCode;

  const payload = {
    type: "nuban",
    name: pharm.accountName,
    account_number: pharm.accountNumber,
    bank_code: pharm.bankCode,
    currency: "NGN",
  };

  const { data } = await axios.post(
    `${PAYSTACK_BASE}/transferrecipient`,
    payload,
    {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET.value()}` },
    }
  );

  const recipientCode = data.data.recipient_code;
  await pharmRef.update({ recipientCode: recipientCode });

  return recipientCode;
}

async function makeTransfer({ amountNGN, recipient, reason, idempotencyKey }) {
  const payload = {
    source: "balance",
    amount: Math.round(amountNGN * 100),
    recipient,
    reference: idempotencyKey,
    reason,
  };

  const headers = {
    Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
    "Idempotency-Key": idempotencyKey || crypto.randomBytes(12).toString("hex"),
  };

  const res = await axios.post(`${PAYSTACK_BASE}/transfer`, payload, {
    headers,
  });
  return res.data.data;
}

const initOrder = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login Required");
  try {
    const { total } = request.data;
    const customerEmail = request.auth.token.email;
    const orderId = generateRandomString(20);

    const payload = {
      email: customerEmail,
      amount: Math.round(total * 100),
      metadata: { orderId: orderId },
      reference: generateRandomString(10),
    };

    // Initialize paystack transaction
    const { data } = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET.value()}`,
        },
      }
    );

    const authUrl = data.data.authorization_url;
    const reference = data.data.reference;
    const accessCode = data.data.access_code;

    return {
      checkoutUrl: authUrl,
      accessCode: accessCode,
      orderId: orderId,
      paystackReference: reference,
    };
  } catch (error) {
    // console.log(error);
    throw new HttpsError("internal", "Could not initialize order");
  }
});

const paystackWebhook = onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const signature = req.get("x-paystack-signature") || "";
      const rawBody = JSON.stringify(req.body);

      if (!verifyPaystackSignature(rawBody, signature)) {
        return res.status(400).send("Invalid signature");
      }

      const event = req.body;

      if (event.event === "transfer.success") {
        const transferRefence = event.data.reference;

        const transferDoc = await db
          .collection("transfers")
          .doc(transferRefence)
          .get();
        if (transferDoc.exists) {
          const { orderId, pharmacyId, itemIndex } = transferDoc.data();
          const orderRef = db.collection("orders").doc(orderId);
          const orderSnap = await orderRef.get();
          if (orderSnap.exists) {
            const order = orderSnap.data();
            const items = order.items || [];
            if (
              items[itemIndex] &&
              items[itemIndex].transferRefence === transferRefence
            ) {
              items[itemIndex].transferStatus = "success";
              await orderRef.update({ items });
            }
          }
        } else {
          console.warn(
            "Transfer reference not tracked locally: ",
            transferRefence
          );
        }
      }

      return res.status(200).send("OK");
    } catch (error) {
      return res.status(500).send("Error");
    }
  });
});

const confirmDelivery = onCall(async (request) => {
  if (!request.auth) throw new HttpsError("unauthenticated", "Login required");

  try {
    const customerId = request.auth.uid;
    const { orderId, pharmacyId } = request.data;
    if (!orderId || !pharmacyId)
      throw new HttpsError("invalid-argument", "orderId & pharmacyId required");

    const orderRef = db.collection("orders").doc(orderId);
    const orderSnap = await orderRef.get();
    if (!orderSnap.exists) throw new HttpsError("not found", "Order not found");

    const order = orderSnap.data();
    if (order.customerId !== customerId)
      throw new HttpsError("permission-denied", "Not your order");
    if (order.status !== "paid" && order.status !== "partly_released") {
      throw new HttpsError(
        "failed-precondition",
        "Order not ready to be released"
      );
    }

    const itemsForPharm = order.items
      .map((it, idx) => ({ ...it, idx }))
      .filter((it) => it.pharmacyId === pharmacyId && !it.paid);

    if (itemsForPharm.length === 0) {
      return {
        success: false,
        message: "No unpaid item for this pharmacist",
      };
    }

    const recipientCode = await ensureRecipient(pharmacyId);

    const amount = itemsForPharm.reduce(
      (s, it) => s + it.price * it.quantity,
      0
    );

    const idempotencyKey = crypto.randomBytes(12).toString("hex");

    const transferData = await makeTransfer({
      amountNGN: amount,
      recipient: recipientCode,
      reason: `Payment for order ${orderId} to pharmacist ${pharmacyId}`,
      idempotencyKey,
    });

    const updatedItems = order.items.map((it, idx) => {
      if (it.pharmacyId === pharmacyId && !it.paid) {
        return {
          ...it,
          paid: true,
          transferRefence: transferData.reference,
          transferStatus: "pending",
        };
      }

      return it;
    });

    let newStatus = "partly_released";
    const allPaid = updatedItems.every((it) => it.paid);

    if (allPaid && updatedItems.every((it) => it.status === "delivered")) {
      newStatus = "completed";
    }

    await orderRef.update({ items: updatedItems, status: newStatus });

    await db
      .collection("transfers")
      .doc(transferData.reference)
      .set({
        orderId,
        pharmacyId,
        itemIndexes: itemsForPharm.map((i) => i.idx),
        amount,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return { status: true, transferRefence: transferData.reference };
  } catch (error) {
    console.log("Error: ", error);
    throw new HttpsError("internal", "Could not confirm delivery");
  }
});

const makePayment = onRequest((req, res) => {
  cors(req, res, async () => {
    let data = JSON.stringify({
      email: req.body.email,
      amount: req.body.amount,
      reference: generateRandomString(10),
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.paystack.co/transaction/initialize",
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer sk_test_21e4b7074f467fcf17d1a6abdfec2e4b2adb97d3",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        res.status(200).send(response.data);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send(error.response.data);
      });
  });
});

const verifyPayment = onRequest((req, res) => {
  cors(req, res, async () => {
    let reference = req.url.split("/").pop();

    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: "https://api.paystack.co/transaction/verify/" + reference,
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer sk_test_21e4b7074f467fcf17d1a6abdfec2e4b2adb97d3",
      },
    };

    axios
      .request(config)
      .then((response) => {
        console.log(JSON.stringify(response.data));
        res.status(200).send(response.data);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send(error.response.data);
      });
  });
});

export {
  initOrder,
  paystackWebhook,
  confirmDelivery,
  makePayment,
  verifyPayment,
};
