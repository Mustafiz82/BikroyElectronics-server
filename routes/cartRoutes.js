import express from 'express';
import {
  addToCart,
  getCartByEmail,
  updateCartQuantity,
  deleteCartItem,
  clearAllCartItems,
  moveToCart
} from '../controllers/cartController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/cart', addToCart);
router.get('/cart',verifyToken, getCartByEmail);
router.put('/cart/:id',  updateCartQuantity);
router.delete('/cart/:id', deleteCartItem);
router.delete('/allCartItem', clearAllCartItems);
router.post('/moveToCart', moveToCart);

export default router;