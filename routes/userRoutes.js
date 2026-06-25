import express from "express";
import {
  getUserByEmail,
  createUser,
  updateUser,
  getAllUsers,
  makeAdmin,
} from "../controllers/userController.js";
import { verifyAdmin, verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:email", getUserByEmail);
router.post("/", createUser);
router.put("/update", verifyToken, updateUser);
router.get("/", verifyToken, verifyAdmin, getAllUsers);
router.put("/role", verifyToken, verifyAdmin, makeAdmin);

export default router;
