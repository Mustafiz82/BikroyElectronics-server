import express from 'express';
import {
  addToWishlist,
  getWishlistByEmail,
  checkWishlistStatus,
  deleteFromWishlist
} from '../controllers/wishlistController.js';

const router = express.Router();

router.post('/wishlist', addToWishlist);
router.get('/wishlist', getWishlistByEmail);
router.get('/wishlistStatus', checkWishlistStatus);
router.delete('/wishlist/:id', deleteFromWishlist); 

export default router;