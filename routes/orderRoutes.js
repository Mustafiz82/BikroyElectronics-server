import express from "express";
import {
  createOrder,
  sslSuccessCallback,
  sslFailCallback,
  sslCancelCallback,
  bkashCallbackHandler,
  getUserOrders,
  getCancelledOrders,
  updateOrderStatus,
  getAllOrders,
  getSingleOrder,
} from "../controllers/orderController.js";
import { verifyAdmin, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Checkout route mapping (Handles COD, Stripe, SSL, bKash setups)
router.post("/orders", verifyToken, createOrder);

// SSLCommerz Callback endpoints
router.post("/payment/ssl-success/:orderId", sslSuccessCallback);
router.post("/payment/ssl-fail/:orderId", sslFailCallback);
router.post("/payment/ssl-cancel/:orderId", sslCancelCallback);

// bKash Callback redirect handler
router.get("/payment/bkash-callback", bkashCallbackHandler);

// Order dashboard APIs
router.get("/orders", verifyToken, getUserOrders);
router.get("/cancelledOrder", verifyToken, getCancelledOrders);
router.put("/order/update/:id", verifyToken, verifyAdmin, updateOrderStatus);
router.get("/allOrders", verifyToken, verifyAdmin, getAllOrders);
router.get("/singleOrders/:id", verifyToken, verifyAdmin, getSingleOrder);

export default router;
