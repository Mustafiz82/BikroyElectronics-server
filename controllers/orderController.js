import Stripe from 'stripe';
import SSLCommerzPayment from 'sslcommerz-lts';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';

// Import Services
import { createStripeSession } from '../services/stripe.js';
import { initSSLPayment } from '../services/ssl.js';
import { createBkashPayment, executeBkashPayment } from '../services/bkash.js';

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

// 1. MAIN ORDER DISPATCHER (POST /orders)
export const createOrder = async (req, res) => {
  try {
    const ordersData = req.body;
    const { paymentMethod, customerDetail, cartData } = ordersData;

    // Save pending Order
    const newOrder = new Order(ordersData);
    const orderResult = await newOrder.save();
    const orderId = orderResult._id.toString();

    const cartIDs = cartData.map(item => item._id || item.cartID);

    // Cash on Delivery
    if (paymentMethod === "COD") {
      await Cart.deleteMany({ email: customerDetail.email.toLowerCase() });
      return res.status(201).json({
        message: "Order placed successfully",
        orderId: orderResult._id
      });
    }

    // Stripe
    if (paymentMethod === "Stripe") {
      const url = await createStripeSession(orderId, cartData, customerDetail);
      return res.status(201).json({ url });
    }

    // SSLCommerz
    if (paymentMethod === "SSL") {
      const url = await initSSLPayment(orderId, ordersData, cartIDs);
      return res.status(201).json({ url });
    }

    // bKash
    if (paymentMethod === "Bkash") {
      const encodedCartIds = encodeURIComponent(JSON.stringify(cartIDs));
      const callbackUrl = `http://localhost:3000/payment/bkash-callback?orderId=${orderId}&cartIds=${encodedCartIds}`;
      const url = await createBkashPayment(orderId, ordersData.totalPrice, customerDetail.email, callbackUrl);
      return res.status(201).json({ url });
    }

  } catch (error) {
    console.error("Order dispatch error:", error.message);
    res.status(500).json({ message: "Checkout failed", error: error.message });
  }
};

// ==========================================
// 🚨 PAYMENT CALLBACKS & WEBHOOK HANDLERS
// ==========================================

// 2. Stripe raw Webhook (Receives unparsed body)
export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️ Stripe Webhook Verification Failed:`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { orderID, cartIDs } = session.metadata;

    try {
      await Order.findByIdAndUpdate(orderID, { $set: { paymentStatus: 'completed' } });
      if (cartIDs) {
        const parsedCartIds = JSON.parse(cartIDs);
        await Cart.deleteMany({ _id: { $in: parsedCartIds } });
      }
      console.log(`✅ Order ${orderID} updated to completed via Stripe Webhook`);
    } catch (err) {
      console.error("Stripe Webhook Database Error:", err.message);
    }
  }

  res.json({ received: true });
};

// 3. SSLCommerz Success Callback (POST)
export const sslSuccessCallback = async (req, res) => {
  const { orderId } = req.params;
  const paymentResponse = req.body;

  console.log("ssl-success")
  try {
    const sslcz = new SSLCommerzPayment(process.env.SSL_STORE_ID, process.env.SSL_STORE_PASS, false);
    const validationResult = await sslcz.validate(paymentResponse);

    if (validationResult.status === "VALID") {
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          paymentStatus: "completed",
          sslTransactionId: validationResult.bank_tran_id
        }
      });

      const cartIdsParam = req.query.cartIds;
      if (cartIdsParam) {
        const cartIds = JSON.parse(decodeURIComponent(cartIdsParam));
        await Cart.deleteMany({ _id: { $in: cartIds } });
      }

      return res.redirect("http://localhost:5173/payment/success");
    } else {
      return res.redirect(`http://localhost:5173/payment/failed?orderId=${orderId}`);
    }
  } catch (error) {
    console.error("SSL Success Callback Error:", error.message);
    return res.redirect(`http://localhost:5173/payment/failed?orderId=${orderId}`);
  }
};

// 4. SSLCommerz Fail Callback (POST)
export const sslFailCallback = async (req, res) => {
  const { orderId } = req.params;
  const reason = req.body.error || req.body.status || "Unknown payment failure";
  return res.redirect(`http://localhost:5173/payment/failed?orderId=${orderId}&reason=${encodeURIComponent(reason)}`);
};

// 5. SSLCommerz Cancel Callback (POST)
export const sslCancelCallback = async (req, res) => {
  const { orderId } = req.params;
  return res.redirect(`http://localhost:5173/payment/cancel?orderId=${orderId}`);
};

// 6. bKash Callback Handler (GET)
export const bkashCallbackHandler = async (req, res) => {
  const { orderId, cartIds, paymentID, status } = req.query;

  console.log(status)
  console.log(orderId)

  if (!paymentID || !status) {
    return res.status(400).send("Missing paymentID or status");
  }

  if (status !== "success") {
    if (status === "cancel") {
      return res.redirect(`http://localhost:5173/payment/cancel?orderId=${orderId}`);
    }
    return res.redirect(`http://localhost:5173/payment/failed?orderId=${orderId}&reason=${status}`);
  }

  try {
    const data = await executeBkashPayment(paymentID);

    if (data.statusCode === "0000") {
      await Order.findByIdAndUpdate(orderId, {
        $set: {
          paymentStatus: "completed",
          trxID: data.trxID,
          customerMsisdn: data.customerMsisdn,
          executedAt: new Date()
        }
      });

      if (cartIds) {
        const parsedCartIds = JSON.parse(decodeURIComponent(cartIds));
        await Cart.deleteMany({ _id: { $in: parsedCartIds } });
      }

      return res.redirect(`http://localhost:5173/payment/success?orderId=${orderId}`);
    } else {
      return res.redirect(`http://localhost:5173/payment/failed?orderId=${orderId}&reason=${encodeURIComponent(data.statusMessage)}`);
    }
  } catch (error) {
    console.error("bKash execute error:", error.message);
    return res.redirect(`http://localhost:5173/payment/failed?orderId=${orderId}&reason=execution_error`);
  }
};

// ==========================================
// Standard Order Management Methods
// ==========================================
export const getUserOrders = async (req, res) => {
  try {
    const { email } = req.query;
    const orders = await Order.find({ "customerDetail.email": email.toLowerCase() })
      .populate('cartData.productId')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getCancelledOrders = async (req, res) => {
  try {
    const { email } = req.query;
    const orders = await Order.find({
      "customerDetail.email": email.toLowerCase(),
      orderStatus: "cancelled"
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await Order.findByIdAndUpdate(id, { $set: { orderStatus: status } }, { new: true });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 6. Get single order details (Admin/User detail view)
export const getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch the order and populate product properties inside the cartData array
    const order = await Order.findById(id).populate('cartData.productId').lean();

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Format the product data to match the exact "products" array structure your frontend dashboard expects
    const products = order.cartData.map(item => {
      const product = item.productId;
      if (!product) return null;

      return {
        ...product,
        quantity: item.quantity,
        buyingPrice: item.buyingPrice
      };
    }).filter(Boolean); // Safely filters out null items if a product was deleted in the admin panel

    res.json({
      ...order,
      products
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};