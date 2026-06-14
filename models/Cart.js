import mongoose from 'mongoose';

const CartSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    lowercase: true, 
    trim: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1, 
    min: 1 
  }
}, { 
  timestamps: true 
});

// Prevent duplicate cart documents for the same product and user
CartSchema.index({ productId: 1, email: 1 }, { unique: true });

const Cart = mongoose.model('Cart', CartSchema);
export default Cart;