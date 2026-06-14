import express from 'express';
import {
  addToCart,
  getCartByEmail,
  updateCartQuantity,
  deleteCartItem,
  clearAllCartItems,
  moveToCart
} from '../controllers/cartController.js';

const router = express.Router();

router.post('/cart', addToCart);
router.get('/cart', getCartByEmail);
router.put('/cart/:id', updateCartQuantity);
router.delete('/cart/:id', deleteCartItem);
router.delete('/allCartItem', clearAllCartItems);
router.post('/moveToCart', moveToCart);

export default router;