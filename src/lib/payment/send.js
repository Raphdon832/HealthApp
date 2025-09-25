import PaystackPop from "@paystack/inline-js";
import axios from "axios";

const sendPayment = async (email, total) => {
  // Convert Naira to Kobo
  let amountInKobo = total * 100;
  try {
    let paystackResponse = await axios.post(
      "https://us-central1-healthapp-438e0.cloudfunctions.net/makePayment",
      { email, amount: amountInKobo }
    );
    let accessCode = paystackResponse.data.data.access_code;
    return new Promise((resolve, reject) => {
      const popup = new PaystackPop();
      popup.resumeTransaction(accessCode, {
        onSuccess: () => {
          console.log("Payment successful");
          resolve(true);
        },
        onCancel: () => {
          console.log("User cancelled");
          resolve(false);
        },
        onError: () => {
          console.log("Payment failed");
          resolve(false);
        },
        onLoad: () => {
          console.log("Page is loaded");
        },
      });
    });
  } catch (error) {
    alert("Failed to start payment");
  }
};

const verifyPayment = async (reference) => {
  try {
    let verifyResponse = await axios.get(
      "https://us-central1-healthapp-438e0.cloudfunctions.net/verifyPayment" +
        reference
    );
    return verifyResponse.data.data.authorization;
  } catch (error) {
    alert("Failed to get result");
  }
};

export { sendPayment, verifyPayment };

// TODO: Implement verify using useEffect
