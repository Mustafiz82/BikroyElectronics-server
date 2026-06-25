import express from "express";
import {
  getProducts,
  getProductCount,
  getProductById,
  createProduct,
  updateProduct,
  fixPrices,
  fixSellCount,
  deleteProduct,
} from "../controllers/productController.js";
import { verifyAdmin, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Utility routes (placed above dynamic /:id parameter)
router.get("/fix-prices", fixPrices);
router.get("/fix-sellcount", fixSellCount);

// Standard API routes
router.get("/products", getProducts);
router.get("/productCount", getProductCount);
router.get("/products/:id", getProductById);
router.post("/products", verifyToken, verifyAdmin, createProduct);
router.put("/products/update/:id", verifyToken, verifyAdmin, updateProduct);
router.delete("/products/delete/:id", deleteProduct);

export default router;
