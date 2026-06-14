import express from 'express';
import {
  getUserByEmail,
  createUser,
  updateUser,
  getAllUsers,
  makeAdmin
} from '../controllers/userController.js'; 

const router = express.Router();

router.get('/:email', getUserByEmail);
router.post('/', createUser);
router.put('/update', updateUser);
router.get('/', getAllUsers);
router.put('/role', makeAdmin);

export default router;