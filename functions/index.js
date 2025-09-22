import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import axios from "axios";
import corsLib from "cors";
// import { logger } from "firebase-functions";

setGlobalOptions({ maxInstances: 10 });

const cors = corsLib({ origin: true });

function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890";
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

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

export { makePayment, verifyPayment };
