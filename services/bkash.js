import axios from 'axios';
import BkashCache from '../models/BkashCache.js';

export const getBkashToken = async () => {
  const cache = await BkashCache.findById("bkash_token");

  if (cache && cache.id_token && Date.now() < cache.expiry_time) {
    console.log("♻️ Using cached bKash token");
    return cache.id_token;
  }

  if (cache && cache.refresh_token) {
    try {
      const refreshRes = await axios.post(
        process.env.SANDBOX_REFRESH_TOKEN_API,
        {
          app_key: process.env.SANDBOX_APP_KEY,
          app_secret: process.env.SANDBOX_APP_SECRET_KEY,
          refresh_token: cache.refresh_token,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: process.env.SANDBOX_USERNAME,
            password: process.env.SANDBOX_PASSWORD,
          },
        }
      );

      const { id_token, expires_in, refresh_token } = refreshRes.data;

      await BkashCache.findByIdAndUpdate(
        "bkash_token",
        {
          $set: {
            id_token,
            refresh_token: refresh_token || cache.refresh_token,
            expiry_time: Date.now() + (Number(expires_in) - 60) * 1000,
            last_token_source: "refresh"
          }
        },
        { upsert: true }
      );

      console.log("🔁 Token refreshed via bKash Refresh API");
      return id_token;
    } catch (err) {
      console.warn("⚠️ bKash token refresh failed. Falling back to Grant Token.");
    }
  }

  const grantRes = await axios.post(
    process.env.SANDBOX_GRANT_TOKEN_API,
    {
      app_key: process.env.SANDBOX_APP_KEY,
      app_secret: process.env.SANDBOX_APP_SECRET_KEY,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        username: process.env.SANDBOX_USERNAME,
        password: process.env.SANDBOX_PASSWORD,
      },
    }
  );

  const { id_token, expires_in, refresh_token } = grantRes.data;

  await BkashCache.findByIdAndUpdate(
    "bkash_token",
    {
      $set: {
        id_token,
        refresh_token,
        expiry_time: Date.now() + (Number(expires_in) - 60) * 1000,
        last_token_source: "grant"
      }
    },
    { upsert: true }
  );

  console.log("🔐 Token successfully granted");
  return id_token;
};

export const createBkashPayment = async (orderId, totalPrice, email, callbackUrl) => {
  const id_token = await getBkashToken();

  const bkashRes = await axios.post(
    process.env.SANDBOX_CREATE_PAYMENT_API,
    {
      mode: "0011",
      payerReference: email.toLowerCase(),
      callbackURL: callbackUrl,
      amount: String(totalPrice),
      currency: "BDT",
      intent: "authorization",
      merchantInvoiceNumber: orderId
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: id_token,
        "X-App-Key": process.env.SANDBOX_APP_KEY,
      },
    }
  );

  console.log("bkashRes")
  console.log(bkashRes)

  return bkashRes.data.bkashURL;
};

export const executeBkashPayment = async (paymentID) => {
  const id_token = await getBkashToken();

  const execRes = await axios.post(
    process.env.SANDBOX_EXECUTE_PAYMENT_API,
    { paymentID },
    {
      headers: {
        Accept: "application/json",
        Authorization: id_token,
        "X-App-Key": process.env.SANDBOX_APP_KEY,
      },
    }
  );

  return execRes.data;
};