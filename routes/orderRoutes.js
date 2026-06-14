import express from 'express';
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
  getSingleOrder
} from '../controllers/orderController.js';

const router = express.Router();

// Checkout route mapping (Handles COD, Stripe, SSL, bKash setups)
router.post('/orders', createOrder);

// SSLCommerz Callback endpoints
router.post('/payment/ssl-success/:orderId', sslSuccessCallback);
router.post('/payment/ssl-fail/:orderId', sslFailCallback);
router.post('/payment/ssl-cancel/:orderId', sslCancelCallback);

// bKash Callback redirect handler
router.get('/payment/bkash-callback', bkashCallbackHandler);

// Order dashboard APIs
router.get('/orders', getUserOrders);
router.get('/cancelledOrder', getCancelledOrders);
router.put('/order/update/:id', updateOrderStatus);
router.get('/allOrders', getAllOrders);
router.get('/singleOrders/:id', getSingleOrder);

export default router;