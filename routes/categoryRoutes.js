import express from 'express';
import {
  getAllCategories,
  createCategory,
  deleteCategory
} from '../controllers/categoryController.js';
import { verifyAdmin, verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/categories', getAllCategories);
router.post('/categories', verifyToken , verifyAdmin, createCategory);
router.delete('/categories/:id', verifyToken , verifyAdmin, deleteCategory);

export default router;